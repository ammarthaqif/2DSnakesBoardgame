import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GameRoom, GamePlayer, MathChallenge, ActionLogEntry, LeaderboardEntry, TournamentEvent, MathDifficulty } from './src/types';
import { SNAKES, LADDERS, INITIAL_LEADERBOARD, CURRENT_TOURNAMENT, RANDOM_BOT_NAMES } from './src/data/gameConstants';
import { createDiceRollChallenge, createSnakeBiteChallenge, createBonusThrowChallenge } from './src/utils/mathChallenge';

const rooms: Map<string, GameRoom> = new Map();
// Map playerId -> current socket.id
const playerSockets: Map<string, string> = new Map();
// Map socket.id -> { playerId: string; roomId?: string }
const socketToPlayer: Map<string, { playerId: string; roomId?: string }> = new Map();
// Map roomId -> authoritative turn/challenge timer
const roomTimers: Map<string, NodeJS.Timeout> = new Map();
// Map playerId -> disconnect grace timeout
const disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
// Map roomId -> Set of achieved milestone keys
const roomMilestones: Map<string, Set<string>> = new Map();

let leaderboard: LeaderboardEntry[] = [...INITIAL_LEADERBOARD];
let currentTournament: TournamentEvent = { ...CURRENT_TOURNAMENT };

// Robust helper to lookup rooms by custom code, partial code, full invite URL, case-insensitively
function extractRoomCode(rawCode: string | undefined): string {
  if (!rawCode) return '';
  let clean = rawCode.trim();

  // Extract from full invite link or query parameter if pasted
  try {
    if (clean.includes('?room=') || clean.includes('&room=')) {
      const match = clean.match(/[?&]room=([^&#\s]+)/i);
      if (match && match[1]) {
        clean = decodeURIComponent(match[1]);
      }
    } else if (clean.includes('://')) {
      const url = new URL(clean);
      const r = url.searchParams.get('room');
      if (r) clean = r;
    }
  } catch {
    // fallback
  }

  // Remove leading '#' or spaces
  clean = clean.replace(/^[#\s]+/, '').trim().toUpperCase();
  // Standardize "ROOM 1234" or "ROOM - 1234" to "ROOM-1234"
  clean = clean.replace(/^ROOM\s*[-_ ]\s*/i, 'ROOM-');

  return clean;
}

function findRoomByCode(rawCode: string | undefined): GameRoom | undefined {
  const clean = extractRoomCode(rawCode);
  if (!clean) return undefined;

  // 1. Direct map lookup
  if (rooms.has(clean)) return rooms.get(clean);

  // 2. Lookup with ROOM- prefix if omitted (e.g. "1234" -> "ROOM-1234")
  if (!clean.startsWith('ROOM-') && rooms.has(`ROOM-${clean}`)) {
    return rooms.get(`ROOM-${clean}`);
  }

  // 3. Lookup without ROOM- prefix if provided (e.g. "ROOM-1234" -> "1234")
  if (clean.startsWith('ROOM-')) {
    const withoutPrefix = clean.replace('ROOM-', '');
    if (rooms.has(withoutPrefix)) return rooms.get(withoutPrefix);
  }

  // 4. Normalized alphanumeric comparison (ignores spaces, hyphens, underscores)
  const normClean = clean.replace(/[^A-Z0-9]/g, '');
  if (normClean) {
    for (const [key, room] of rooms.entries()) {
      const normKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normRoomId = room.id.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (normKey === normClean || normRoomId === normClean) {
        return room;
      }
      if (normKey === `ROOM${normClean}` || normRoomId === `ROOM${normClean}`) {
        return room;
      }
      if (`ROOM${normKey}` === normClean || `ROOM${normRoomId}` === normClean) {
        return room;
      }
    }
  }

  return undefined;
}

function clearRoomTimer(roomId: string) {
  const existing = roomTimers.get(roomId);
  if (existing) {
    clearTimeout(existing);
    roomTimers.delete(roomId);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(express.json());

  // ---------------- REST APIs ----------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  app.get('/api/debug/rooms', (req, res) => {
    const list: any[] = [];
    rooms.forEach((r, id) => {
      list.push({
        id,
        name: r.name,
        isPrivate: r.isPrivate,
        status: r.status,
        players: r.players.map((p) => ({ id: p.id, username: p.username, connected: p.connected, isHost: p.isHost })),
      });
    });
    res.json(list);
  });

  app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard);
  });

  app.post('/api/leaderboard/record', (req, res) => {
    const { username, skinId, won, mathCorrect, mathTotal, seasonPointsEarned } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    let existing = leaderboard.find((e) => e.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      if (won) {
        existing.matchesWon += 1;
        existing.trophies += 25;
      } else {
        existing.trophies = Math.max(0, existing.trophies - 5);
      }
      existing.seasonPoints += seasonPointsEarned || (won ? 40 : 15);
      existing.skinId = skinId || existing.skinId;
    } else {
      existing = {
        rank: leaderboard.length + 1,
        id: `u_${Date.now()}`,
        username,
        skinId: skinId || 'emerald_viper',
        trophies: won ? 120 : 100,
        matchesWon: won ? 1 : 0,
        winRate: won ? 100 : 0,
        mathAccuracy: 92,
        seasonPoints: seasonPointsEarned || (won ? 50 : 20),
        tier: 'Bronze',
      };
      leaderboard.push(existing);
    }

    // Sort and recalculate ranks
    leaderboard.sort((a, b) => b.seasonPoints - a.seasonPoints || b.trophies - a.trophies);
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
      if (entry.rank <= 3) entry.tier = 'Diamond';
      else if (entry.rank <= 6) entry.tier = 'Platinum';
      else if (entry.rank <= 10) entry.tier = 'Gold';
      else if (entry.rank <= 20) entry.tier = 'Silver';
      else entry.tier = 'Bronze';
    });

    res.json({ success: true, userEntry: existing, leaderboard });
  });

  app.get('/api/tournaments', (req, res) => {
    res.json(currentTournament);
  });

  // Alias for singular /api/tournament
  app.get('/api/tournament', (req, res) => {
    res.json(currentTournament);
  });

  // API endpoint for listing available public rooms
  app.get('/api/rooms', (req, res) => {
    res.json(getPublicRooms());
  });

  // Helper to get sanitized room list
  function getPublicRooms() {
    return Array.from(rooms.values())
      .filter((r) => !r.isPrivate && r.status === 'waiting')
      .map((r) => ({
        id: r.id,
        name: r.name,
        playerCount: r.players.length,
        maxPlayers: r.maxPlayers,
        isTournament: r.isTournament,
        timerDuration: r.timerDuration,
      }));
  }

  let serverLogCounter = 0;
  function addLog(room: GameRoom, text: string, type: ActionLogEntry['type'], player?: GamePlayer) {
    serverLogCounter += 1;
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${serverLogCounter}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      playerId: player?.id || 'system',
      playerName: player?.username || 'System',
      text,
      type,
    };
    room.actionLog = [entry, ...room.actionLog.slice(0, 30)];
  }

  function checkAndBroadcastMilestone(
    room: GameRoom,
    player: GamePlayer,
    key: string,
    milestone: {
      title: string;
      message: string;
      icon?: 'trophy' | 'flame' | 'ladder' | 'star' | 'zap' | 'shield';
      type?: 'success' | 'warning' | 'info' | 'streak';
    }
  ) {
    let milestones = roomMilestones.get(room.id);
    if (!milestones) {
      milestones = new Set();
      roomMilestones.set(room.id, milestones);
    }
    if (!milestones.has(key)) {
      milestones.add(key);
      io.to(room.id).emit('milestone_unlocked', milestone);
    }
  }

  function advanceTurn(room: GameRoom) {
    clearRoomTimer(room.id);
    room.activeChallenge = null;
    room.diceValue = null;
    room.extraTurnAwarded = false;

    if (room.players.length === 0) return;

    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    room.status = 'in_progress';

    const currentPlayer = room.players[room.currentTurnIndex];
    addLog(room, `It is ${currentPlayer.username}'s turn to roll!`, 'info', currentPlayer);

    io.to(room.id).emit('room_update', room);

    // If currentPlayer is bot, automate turn
    if (currentPlayer.isBot && room.status === 'in_progress') {
      scheduleBotTurn(room.id);
    } else if (!currentPlayer.isBot && room.status === 'in_progress') {
      startTurnRollTimer(room, currentPlayer);
    }
  }

  function startTurnRollTimer(room: GameRoom, player: GamePlayer) {
    clearRoomTimer(room.id);
    if (player.isBot) return;

    const timer = setTimeout(() => {
      const curR = rooms.get(room.id);
      if (!curR || curR.status !== 'in_progress' || curR.activeChallenge) return;
      const curP = curR.players[curR.currentTurnIndex];
      if (!curP || curP.id !== player.id) return;

      addLog(curR, `⏱️ ${curP.username} timed out rolling. Auto-rolling dice!`, 'info', curP);
      executeDiceRoll(curR, curP);
    }, 20000); // 20s turn roll timeout

    roomTimers.set(room.id, timer);
  }

  function startChallengeTimer(room: GameRoom, player: GamePlayer, timeLimitSec: number) {
    clearRoomTimer(room.id);
    if (player.isBot) return;

    const bufferSec = 2; // latency safety buffer
    const timer = setTimeout(() => {
      const curR = rooms.get(room.id);
      if (!curR || !curR.activeChallenge || curR.status === 'game_over') return;
      const targetP = curR.players.find((p) => p.id === player.id) || curR.players[curR.currentTurnIndex];
      if (!targetP) return;

      addLog(curR, `⏱️ Time ran out for ${targetP.username}!`, 'math_fail', targetP);
      processMathAnswer(curR, targetP, -99999);
    }, (timeLimitSec + bufferSec) * 1000);

    roomTimers.set(room.id, timer);
  }

  function scheduleBotTurn(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'in_progress') return;
    const bot = room.players[room.currentTurnIndex];
    if (!bot || !bot.isBot) return;

    const diff = bot.mathDifficulty || 'medium';
    const rollDelay = diff === 'easy' ? 800 : diff === 'hard' ? 120 : 400;

    setTimeout(() => {
      const curR = rooms.get(roomId);
      if (!curR || curR.status !== 'in_progress') return;
      const curBot = curR.players[curR.currentTurnIndex];
      if (!curBot || !curBot.isBot) return;
      executeDiceRoll(curR, curBot);
    }, rollDelay);
  }

  function executeDiceRoll(room: GameRoom, player: GamePlayer) {
    clearRoomTimer(room.id);
    const rolled = Math.floor(Math.random() * 6) + 1;
    room.diceValue = rolled;
    room.status = 'answering_math';

    addLog(room, `${player.username} rolled a ${rolled}! Solving math challenge...`, 'roll', player);

    // Create dice roll math challenge: Current tile + rolled dice
    const challenge = createDiceRollChallenge(
      player.id,
      player.position,
      rolled,
      room.timerDuration,
      player.mathDifficulty || 'medium'
    );
    room.activeChallenge = challenge;

    io.to(room.id).emit('room_update', room);

    // If bot, auto answer with difficulty-based speed and error probability
    if (player.isBot) {
      const diff = player.mathDifficulty || 'medium';
      let delay = 550;
      let correctChance = 0.82;

      if (diff === 'easy') {
        delay = 1800 + Math.floor(Math.random() * 700);
        correctChance = 0.55;
      } else if (diff === 'hard') {
        delay = 150 + Math.floor(Math.random() * 150);
        correctChance = 0.98;
      } else {
        delay = 750 + Math.floor(Math.random() * 350);
        correctChance = 0.82;
      }

      setTimeout(() => {
        const currentR = rooms.get(room.id);
        if (!currentR || currentR.status !== 'answering_math' || !currentR.activeChallenge) return;

        const isCorrect = Math.random() < correctChance;
        let answer: number;

        if (isCorrect) {
          answer = challenge.correctAnswer;
        } else {
          const wrongOptions = challenge.options.filter((opt) => opt !== challenge.correctAnswer);
          if (wrongOptions.length > 0) {
            answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          } else {
            answer = challenge.correctAnswer + (Math.random() < 0.5 ? 1 : -1);
          }
        }

        processMathAnswer(currentR, player, answer);
      }, delay);
    } else {
      startChallengeTimer(room, player, challenge.timeLimit || room.timerDuration);
    }
  }

  function processMathAnswer(room: GameRoom, player: GamePlayer, answer: number) {
    clearRoomTimer(room.id);
    const challenge = room.activeChallenge;
    if (!challenge) return;

    const isCorrect = answer === challenge.correctAnswer;

    if (challenge.type === 'dice_move') {
      if (isCorrect) {
        player.mathStreak += 1;
        player.turnsWithoutMoving = 0;
        addLog(
          room,
          `${player.username} solved ${challenge.questionText} (${answer}) correctly! Moving ahead!`,
          'math_success',
          player
        );

        // Check math streak milestones
        if (player.mathStreak === 3) {
          checkAndBroadcastMilestone(room, player, `streak_3_${player.id}_${Math.floor(Date.now() / 60000)}`, {
            title: '3-Match Math Streak!',
            message: `${player.username} is on fire with 3 correct math answers in a row!`,
            icon: 'flame',
            type: 'streak',
          });
        } else if (player.mathStreak === 5) {
          checkAndBroadcastMilestone(room, player, `streak_5_${player.id}_${Math.floor(Date.now() / 60000)}`, {
            title: '5-Match Math Streak!',
            message: `${player.username} is an unstoppable mental math prodigy!`,
            icon: 'flame',
            type: 'streak',
          });
        }

        // Move player forward
        const targetTile = Math.min(100, player.position + (challenge.rolledValue || 1));
        player.position = targetTile;

        // Check halfway milestone
        if (player.position >= 50) {
          checkAndBroadcastMilestone(room, player, 'first_tile_50', {
            title: 'First to reach Tile 50!',
            message: `${player.username} crossed the halfway mark on the board!`,
            icon: 'trophy',
            type: 'success',
          });
        }

        // Check for Win condition first
        if (player.position >= 100) {
          player.position = 100;
          room.winner = player;
          room.status = 'game_over';
          addLog(room, `🏆 ${player.username} reached tile 100 and WON THE GAME!`, 'win', player);
          io.to(room.id).emit('room_update', room);
          return;
        }

        // Check if landed on Snake Head
        const snake = SNAKES.find((s) => s.head === player.position);
        if (snake) {
          player.position = snake.tail;
          addLog(
            room,
            `🐍 Oh no! ${player.username} was bitten by the ${snake.name} at tile ${snake.head} and slid down to tile ${snake.tail}!`,
            'snake_slide',
            player
          );

          // Popup mathematical question: current tile minus the snake tail number with timer
          const snakeChallenge = createSnakeBiteChallenge(
            player.id,
            snake.head,
            snake.tail,
            room.timerDuration,
            player.mathDifficulty || 'medium'
          );
          room.activeChallenge = snakeChallenge;
          room.status = 'answering_snake';

          io.to(room.id).emit('room_update', room);

          if (player.isBot) {
            setTimeout(() => {
              const curR = rooms.get(room.id);
              if (!curR || curR.status !== 'answering_snake') return;
              const botCorrect = Math.random() < 0.85;
              const botAns = botCorrect ? snakeChallenge.correctAnswer : snakeChallenge.correctAnswer + 2;
              processMathAnswer(curR, player, botAns);
            }, 450);
          } else {
            startChallengeTimer(room, player, snakeChallenge.timeLimit || room.timerDuration);
          }
          return;
        }

        // Check if landed on Ladder Base
        const ladder = LADDERS.find((l) => l.bottom === player.position);
        if (ladder) {
          player.position = ladder.top;
          addLog(
            room,
            `🪜 Splendid! ${player.username} climbed the ladder from tile ${ladder.bottom} up to tile ${ladder.top}!`,
            'ladder_climb',
            player
          );

          if (player.position >= 100) {
            player.position = 100;
            room.winner = player;
            room.status = 'game_over';
            addLog(room, `🏆 ${player.username} reached tile 100 and WON THE GAME!`, 'win', player);
            io.to(room.id).emit('room_update', room);
            return;
          }
        }

        // Advance to next turn
        advanceTurn(room);
      } else {
        // Incorrect answer or timeout: they stay put
        player.mathStreak = 0;
        player.turnsWithoutMoving = (player.turnsWithoutMoving || 0) + 1;
        addLog(
          room,
          `${player.username} missed the math challenge (${challenge.questionText}). Staying put at tile ${player.position}!`,
          'math_fail',
          player
        );
        advanceTurn(room);
      }
    } else if (challenge.type === 'snake_bite') {
      if (isCorrect) {
        addLog(
          room,
          `⚡ ${player.username} solved Snake Bite math (${challenge.questionText} = ${answer})! Unlocked Bonus Question for an EXTRA DICE THROW!`,
          'bonus_award',
          player
        );

        // Give them a bonus question for an extra dice throw
        const bonusChallenge = createBonusThrowChallenge(
          player.id,
          8,
          player.mathDifficulty || 'medium'
        );
        room.activeChallenge = bonusChallenge;
        room.status = 'answering_bonus';

        io.to(room.id).emit('room_update', room);

        if (player.isBot) {
          setTimeout(() => {
            const curR = rooms.get(room.id);
            if (!curR || curR.status !== 'answering_bonus') return;
            const botCorrect = Math.random() < 0.8;
            const botAns = botCorrect ? bonusChallenge.correctAnswer : bonusChallenge.correctAnswer - 1;
            processMathAnswer(curR, player, botAns);
          }, 450);
        } else {
          startChallengeTimer(room, player, bonusChallenge.timeLimit || 8);
        }
      } else {
        addLog(
          room,
          `${player.username} failed Snake Bite math (${challenge.questionText}). No bonus throw awarded.`,
          'math_fail',
          player
        );
        advanceTurn(room);
      }
    } else if (challenge.type === 'bonus_extra_throw') {
      if (isCorrect) {
        room.extraTurnAwarded = true;
        room.activeChallenge = null;
        room.status = 'in_progress';
        addLog(
          room,
          `🎉 BONUS SOLVED! ${player.username} answered correctly and gets an IMMEDIATE EXTRA DICE THROW!`,
          'bonus_award',
          player
        );

        io.to(room.id).emit('room_update', room);

        if (player.isBot) {
          scheduleBotTurn(room.id);
        } else {
          startTurnRollTimer(room, player);
        }
      } else {
        addLog(
          room,
          `${player.username} missed the bonus question. Turn passes to next player.`,
          'math_fail',
          player
        );
        advanceTurn(room);
      }
    }
  }

  // ---------------- Socket.IO Connection ----------------
  io.on('connection', (socket: Socket) => {
    socket.emit('lobby_rooms', getPublicRooms());

    // Create Room
    socket.on('create_room', (data: {
      roomName: string;
      customCode?: string;
      isTournament: boolean;
      timerDuration: 5 | 10 | 15;
      isPrivate: boolean;
      maxPlayers?: number;
      player: { id?: string; username: string; skinId: string; mathDifficulty?: MathDifficulty };
    }) => {
      // Clean up previous room if socket was already in one
      const prevInfo = socketToPlayer.get(socket.id);
      if (prevInfo && rooms.has(prevInfo.roomId)) {
        const prevRoom = rooms.get(prevInfo.roomId)!;
        socket.leave(prevRoom.id);
        prevRoom.players = prevRoom.players.filter((p) => p.id !== prevInfo.playerId);
        if (prevRoom.players.filter((p) => !p.isBot).length === 0) {
          clearRoomTimer(prevRoom.id);
          rooms.delete(prevRoom.id);
        } else {
          io.to(prevRoom.id).emit('room_update', prevRoom);
        }
      }

      let roomId = '';

      // Validate & clean custom code if requested
      if (data.customCode && data.customCode.trim()) {
        const cleaned = data.customCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
        if (cleaned.length >= 2) {
          if (findRoomByCode(cleaned)) {
            socket.emit('error_message', `Room code "${cleaned}" is already in use. Try a different code.`);
            return;
          }
          roomId = cleaned;
        }
      }

      if (!roomId) {
        let code = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
        while (rooms.has(code)) {
          code = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        roomId = code;
      }

      const playerId = data.player?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      playerSockets.set(playerId, socket.id);
      socketToPlayer.set(socket.id, { playerId, roomId });

      const hostPlayer: GamePlayer = {
        id: playerId,
        username: (data.player?.username || '').trim() || 'SnakeMaster',
        skinId: data.player?.skinId || 'emerald_viper',
        position: 1,
        isBot: false,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: 0,
        isHost: true,
        isReady: true,
        connected: true,
        mathDifficulty: data.player?.mathDifficulty || 'medium',
        turnsWithoutMoving: 0,
      };

      const requestedMaxPlayers = data.maxPlayers ? Math.min(4, Math.max(2, Number(data.maxPlayers))) : 4;

      const newRoom: GameRoom = {
        id: roomId,
        name: data.roomName || `${hostPlayer.username}'s Game`,
        isTournament: data.isTournament || false,
        timerDuration: data.timerDuration || 10,
        maxPlayers: requestedMaxPlayers,
        status: 'waiting',
        players: [hostPlayer],
        currentTurnIndex: 0,
        diceValue: null,
        activeChallenge: null,
        actionLog: [],
        winner: null,
        createdAt: Date.now(),
        isPrivate: data.isPrivate ?? false,
        extraTurnAwarded: false,
      };

      addLog(newRoom, `${hostPlayer.username} created room [${roomId}].`, 'info', hostPlayer);
      rooms.set(roomId, newRoom);
      socket.join(roomId);

      console.log(`[server] Created room "${roomId}" (isPrivate=${newRoom.isPrivate}) by ${hostPlayer.username}`);
      socket.emit('joined_room', { roomId, room: newRoom, player: hostPlayer });
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Join Room (by code or clicking lobby)
    socket.on('join_room', (data: { roomId: string; player: { id?: string; username: string; skinId: string; mathDifficulty?: MathDifficulty } }) => {
      const cleanTarget = extractRoomCode(data.roomId);
      const room = findRoomByCode(cleanTarget);
      console.log(`[server] join_room request: "${data.roomId}" (cleaned: "${cleanTarget}") -> resolved room:`, room ? room.id : 'NOT FOUND');
      if (!room) {
        socket.emit('error_message', `Room "${cleanTarget || data.roomId}" not found. Check the room code or invite link.`);
        return;
      }

      // Clean up previous room if socket was in a different room
      const prevInfo = socketToPlayer.get(socket.id);
      if (prevInfo && prevInfo.roomId !== room.id && rooms.has(prevInfo.roomId)) {
        const prevRoom = rooms.get(prevInfo.roomId)!;
        socket.leave(prevRoom.id);
        prevRoom.players = prevRoom.players.filter((p) => p.id !== prevInfo.playerId);
        if (prevRoom.players.filter((p) => !p.isBot).length === 0) {
          clearRoomTimer(prevRoom.id);
          rooms.delete(prevRoom.id);
        } else {
          io.to(prevRoom.id).emit('room_update', prevRoom);
        }
      }

      const clientPlayerId = data.player?.id;

      // Reconnection check: ONLY reconnect if the player ID already exists in the room
      // AND that player's existing socket is not currently active (or is the exact same socket)
      const existingPlayerById = clientPlayerId ? room.players.find((p) => p.id === clientPlayerId) : undefined;
      const existingSocketId = clientPlayerId ? playerSockets.get(clientPlayerId) : undefined;
      const isExistingSocketStillActive = Boolean(
        existingSocketId &&
        existingSocketId !== socket.id &&
        io.sockets.sockets.get(existingSocketId)?.connected
      );

      if (existingPlayerById && (!isExistingSocketStillActive || existingSocketId === socket.id)) {
        // Clear any disconnect grace timer
        const discTimer = disconnectTimers.get(existingPlayerById.id);
        if (discTimer) {
          clearTimeout(discTimer);
          disconnectTimers.delete(existingPlayerById.id);
        }

        playerSockets.set(existingPlayerById.id, socket.id);
        socketToPlayer.set(socket.id, { playerId: existingPlayerById.id, roomId: room.id });
        existingPlayerById.connected = true;
        socket.join(room.id);

        addLog(room, `${existingPlayerById.username} reconnected to the room.`, 'info', existingPlayerById);
        socket.emit('joined_room', { roomId: room.id, room, player: existingPlayerById });
        io.to(room.id).emit('room_update', room);
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('error_message', 'Room is currently full.');
        return;
      }
      if (room.status !== 'waiting') {
        socket.emit('error_message', 'Game has already started in this room.');
        return;
      }

      // Avoid identical usernames in the same match
      let chosenUsername = (data.player?.username || '').trim() || `Player ${room.players.length + 1}`;
      const duplicateCount = room.players.filter((p) => p.username.toLowerCase() === chosenUsername.toLowerCase()).length;
      if (duplicateCount > 0) {
        chosenUsername = `${chosenUsername} #${duplicateCount + 1}`;
      }

      // Assign a unique playerId if clientPlayerId is already active in this room
      let playerId = clientPlayerId;
      if (!playerId || room.players.some((p) => p.id === playerId)) {
        playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }

      playerSockets.set(playerId, socket.id);
      socketToPlayer.set(socket.id, { playerId, roomId: room.id });

      const newPlayer: GamePlayer = {
        id: playerId,
        username: chosenUsername,
        skinId: data.player?.skinId || 'neon_cyber',
        position: 1,
        isBot: false,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: room.players.length,
        isHost: false,
        isReady: true,
        connected: true,
        mathDifficulty: (data.player as any)?.mathDifficulty || 'medium',
        turnsWithoutMoving: 0,
      };

      room.players.push(newPlayer);
      socket.join(room.id);
      addLog(room, `${newPlayer.username} joined the match.`, 'info', newPlayer);

      console.log(`[server] ${newPlayer.username} (${newPlayer.id}) joined room "${room.id}" (total=${room.players.length})`);
      socket.emit('joined_room', { roomId: room.id, room, player: newPlayer });
      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Rejoin Room (for auto-reconnect on socket disconnect/transport upgrade)
    socket.on('rejoin_room', (data: { roomId: string; player: { id: string; username: string; skinId: string } }) => {
      const room = findRoomByCode(data.roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === data.player?.id);
      if (player) {
        const discTimer = disconnectTimers.get(player.id);
        if (discTimer) {
          clearTimeout(discTimer);
          disconnectTimers.delete(player.id);
        }

        playerSockets.set(player.id, socket.id);
        socketToPlayer.set(socket.id, { playerId: player.id, roomId: room.id });
        player.connected = true;
        socket.join(room.id);

        socket.emit('joined_room', { roomId: room.id, room, player });
        io.to(room.id).emit('room_update', room);
      }
    });

    // Quick Match
    socket.on('quick_match', (data: { isTournament?: boolean; player: { id?: string; username: string; skinId: string } }) => {
      let targetRoom = Array.from(rooms.values()).find(
        (r) => !r.isPrivate && r.status === 'waiting' && r.players.length < r.maxPlayers
      );

      const playerId = data.player?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (targetRoom) {
        playerSockets.set(playerId, socket.id);
        socketToPlayer.set(socket.id, { playerId, roomId: targetRoom.id });

        let chosenUsername = data.player.username || 'SpeedSerpent';
        const duplicateCount = targetRoom.players.filter((p) => p.username.startsWith(chosenUsername)).length;
        if (duplicateCount > 0) {
          chosenUsername = `${chosenUsername} #${duplicateCount + 1}`;
        }

        const newPlayer: GamePlayer = {
          id: playerId,
          username: chosenUsername,
          skinId: data.player.skinId || 'emerald_viper',
          position: 1,
          isBot: false,
          score: 0,
          mathStreak: 0,
          consecutiveExtraTurns: 0,
          avatarIndex: targetRoom.players.length,
          isHost: false,
          isReady: true,
          connected: true,
          mathDifficulty: (data.player as any)?.mathDifficulty || 'medium',
          turnsWithoutMoving: 0,
        };
        targetRoom.players.push(newPlayer);
        socket.join(targetRoom.id);
        addLog(targetRoom, `${newPlayer.username} matched into the lobby!`, 'info', newPlayer);

        socket.emit('joined_room', { roomId: targetRoom.id, room: targetRoom, player: newPlayer });
        io.to(targetRoom.id).emit('room_update', targetRoom);
      } else {
        const roomId = `QM-${Math.floor(1000 + Math.random() * 9000)}`;
        playerSockets.set(playerId, socket.id);
        socketToPlayer.set(socket.id, { playerId, roomId });

        const hostPlayer: GamePlayer = {
          id: playerId,
          username: data.player.username || 'SpeedSerpent',
          skinId: data.player.skinId || 'emerald_viper',
          position: 1,
          isBot: false,
          score: 0,
          mathStreak: 0,
          consecutiveExtraTurns: 0,
          avatarIndex: 0,
          isHost: true,
          isReady: true,
          connected: true,
          mathDifficulty: (data.player as any)?.mathDifficulty || 'medium',
          turnsWithoutMoving: 0,
        };

        const newRoom: GameRoom = {
          id: roomId,
          name: data.isTournament ? 'Tournament Arena' : 'Quick Match Arena',
          isTournament: data.isTournament || false,
          timerDuration: 10,
          maxPlayers: 2,
          status: 'waiting',
          players: [hostPlayer],
          currentTurnIndex: 0,
          diceValue: null,
          activeChallenge: null,
          actionLog: [],
          winner: null,
          createdAt: Date.now(),
          isPrivate: false,
          extraTurnAwarded: false,
        };

        rooms.set(roomId, newRoom);
        socket.join(roomId);
        addLog(newRoom, `${hostPlayer.username} started quick match lobby.`, 'info', hostPlayer);

        socket.emit('joined_room', { roomId, room: newRoom, player: hostPlayer });
        io.emit('lobby_rooms', getPublicRooms());
      }
    });

    // Add Bot Player
    socket.on('add_bot', (data: { roomId: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room || room.status !== 'waiting' || room.players.length >= room.maxPlayers) return;

      const botSkins = ['coral_striker', 'golden_python', 'frost_wyrm', 'magma_drake', 'shadow_viper', 'neon_cyber'];
      const unusedSkin = botSkins.find((s) => !room.players.some((p) => p.skinId === s)) || botSkins[room.players.length % botSkins.length];

      const availableNames = RANDOM_BOT_NAMES.filter((n) => !room.players.some((p) => p.username.startsWith(n)));
      const chosenName = availableNames.length > 0
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : RANDOM_BOT_NAMES[Math.floor(Math.random() * RANDOM_BOT_NAMES.length)];

      const botPlayer: GamePlayer = {
        id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        username: `${chosenName} [AI]`,
        skinId: unusedSkin,
        position: 1,
        isBot: true,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: room.players.length,
        isReady: true,
        connected: true,
        mathDifficulty: 'medium',
        turnsWithoutMoving: 0,
      };

      room.players.push(botPlayer);
      addLog(room, `${botPlayer.username} joined the game!`, 'info', botPlayer);
      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Start Game
    socket.on('start_game', (data: { roomId: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room || room.status !== 'waiting') return;

      // If only 1 player, add a bot so game is immediately playable
      if (room.players.length === 1) {
        const randomName = RANDOM_BOT_NAMES[Math.floor(Math.random() * RANDOM_BOT_NAMES.length)];
        const botPlayer: GamePlayer = {
          id: `bot_${Date.now()}`,
          username: `${randomName} [AI]`,
          skinId: 'golden_python',
          position: 1,
          isBot: true,
          score: 0,
          mathStreak: 0,
          consecutiveExtraTurns: 0,
          avatarIndex: 1,
          isReady: true,
          connected: true,
        };
        room.players.push(botPlayer);
      }

      room.status = 'in_progress';
      room.currentTurnIndex = 0;
      const firstPlayer = room.players[0];
      const humanPlayers = room.players.filter((p) => !p.isBot);
      if (humanPlayers.length >= 2) {
        addLog(
          room,
          `Online multiplayer match started amongst ${humanPlayers.map((p) => p.username).join(' vs ')}! ${firstPlayer.username} rolls first!`,
          'info',
          firstPlayer
        );
      } else {
        addLog(room, `Game started! ${firstPlayer.username} rolls first!`, 'info', firstPlayer);
      }

      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());

      if (firstPlayer.isBot) {
        scheduleBotTurn(room.id);
      } else {
        startTurnRollTimer(room, firstPlayer);
      }
    });

    // Roll Dice
    socket.on('roll_dice', (data: { roomId: string; playerId?: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room || room.status !== 'in_progress') return;

      socket.join(room.id);

      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer) return;

      const playerSocketId = playerSockets.get(currentPlayer.id);
      const isAuthorized =
        currentPlayer.id === socket.id ||
        playerSocketId === socket.id ||
        (data.playerId && data.playerId === currentPlayer.id) ||
        (!currentPlayer.isBot && room.players.filter((p) => !p.isBot).length === 1);

      if (!isAuthorized) return;

      // Update mapping just in case socket reconnected
      playerSockets.set(currentPlayer.id, socket.id);
      socketToPlayer.set(socket.id, { playerId: currentPlayer.id, roomId: room.id });

      executeDiceRoll(room, currentPlayer);
    });

    // Submit Math Answer
    socket.on('submit_math_answer', (data: { roomId: string; answer: number; playerId?: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room || !room.activeChallenge) return;

      socket.join(room.id);

      // Find the player targeted by the challenge or the current turn player
      const challengePlayer =
        room.players.find((p) => p.id === room.activeChallenge?.forPlayerId) ||
        room.players[room.currentTurnIndex];

      if (!challengePlayer) return;

      const playerSocketId = playerSockets.get(challengePlayer.id);
      const isAuthorized =
        challengePlayer.id === socket.id ||
        playerSocketId === socket.id ||
        (data.playerId && data.playerId === challengePlayer.id) ||
        (!challengePlayer.isBot && room.players.filter((p) => !p.isBot).length === 1);

      if (!isAuthorized) return;

      playerSockets.set(challengePlayer.id, socket.id);
      processMathAnswer(room, challengePlayer, data.answer);
    });

    // Timeout event if client timer reaches 0
    socket.on('math_timeout', (data: { roomId: string; playerId?: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room || !room.activeChallenge) return;

      socket.join(room.id);

      const challengePlayer =
        room.players.find((p) => p.id === room.activeChallenge?.forPlayerId) ||
        room.players[room.currentTurnIndex];

      if (!challengePlayer) return;

      const playerSocketId = playerSockets.get(challengePlayer.id);
      const isAuthorized =
        challengePlayer.id === socket.id ||
        playerSocketId === socket.id ||
        (data.playerId && data.playerId === challengePlayer.id) ||
        (!challengePlayer.isBot && room.players.filter((p) => !p.isBot).length === 1);

      if (!isAuthorized) return;

      addLog(room, `⏱️ Time ran out for ${challengePlayer.username}!`, 'math_fail', challengePlayer);
      processMathAnswer(room, challengePlayer, -99999);
    });

    // Restart game in same room
    socket.on('restart_game', (data: { roomId: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room) return;

      clearRoomTimer(room.id);
      room.status = 'in_progress';
      room.players.forEach((p) => {
        p.position = 1;
        p.mathStreak = 0;
      });
      room.winner = null;
      room.activeChallenge = null;
      room.diceValue = null;
      room.currentTurnIndex = 0;
      addLog(room, `Match restarted! All players back to tile 1!`, 'info');

      io.to(room.id).emit('room_update', room);

      const firstP = room.players[0];
      if (firstP?.isBot) {
        scheduleBotTurn(room.id);
      } else if (firstP) {
        startTurnRollTimer(room, firstP);
      }
    });

    // Leave room
    socket.on('leave_room', (data: { roomId: string; playerId?: string }) => {
      const room = findRoomByCode(data.roomId) || rooms.get(data.roomId);
      if (!room) return;

      const leavingId = data.playerId || socketToPlayer.get(socket.id)?.playerId || socket.id;
      room.players = room.players.filter((p) => p.id !== leavingId && p.id !== socket.id);
      socket.leave(room.id);
      socketToPlayer.delete(socket.id);

      if (room.players.length === 0) {
        clearRoomTimer(room.id);
        rooms.delete(room.id);
      } else {
        if (room.currentTurnIndex >= room.players.length) {
          room.currentTurnIndex = 0;
        }
        io.to(room.id).emit('room_update', room);
      }
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Disconnect handling with grace period
    socket.on('disconnect', () => {
      const playerInfo = socketToPlayer.get(socket.id);
      socketToPlayer.delete(socket.id);

      rooms.forEach((room, rId) => {
        const player = room.players.find(
          (p) => p.id === socket.id || (playerInfo && p.id === playerInfo.playerId)
        );

        if (player) {
          player.connected = false;
          addLog(room, `${player.username} connection lost (reconnecting...).`, 'info');
          io.to(rId).emit('room_update', room);

          // If room is waiting and has no other human players, clean up quickly
          const remainingHumans = room.players.filter((p) => !p.isBot && p.connected !== false);
          const graceTimeoutMs = room.status === 'waiting' && remainingHumans.length === 0 ? 15000 : 45000;

          const timer = setTimeout(() => {
            disconnectTimers.delete(player.id);
            const curRoom = rooms.get(rId);
            if (!curRoom) return;

            // Remove permanently if still disconnected
            const pIdx = curRoom.players.findIndex((p) => p.id === player.id);
            if (pIdx !== -1 && curRoom.players[pIdx].connected === false) {
              const removed = curRoom.players.splice(pIdx, 1)[0];
              addLog(curRoom, `${removed.username} left the match.`, 'info');

              if (curRoom.players.length === 0 || curRoom.players.every((p) => p.isBot)) {
                clearRoomTimer(rId);
                rooms.delete(rId);
              } else {
                if (curRoom.currentTurnIndex >= curRoom.players.length) {
                  curRoom.currentTurnIndex = 0;
                }
                io.to(rId).emit('room_update', curRoom);
                // If it was their turn, advance
                if (curRoom.status === 'in_progress') {
                  advanceTurn(curRoom);
                }
              }
              io.emit('lobby_rooms', getPublicRooms());
            }
          }, graceTimeoutMs);

          disconnectTimers.set(player.id, timer);
        }
      });

      io.emit('lobby_rooms', getPublicRooms());
    });
  });

  // Return JSON 404 for any unmatched /api requests to avoid SPA HTML fallthrough
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // ---------------- Vite Middleware ----------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Snake Board Game server running on port ${PORT}`);
  });
}

startServer();
