import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GameRoom, GamePlayer, MathChallenge, ActionLogEntry, LeaderboardEntry, TournamentEvent } from './src/types';
import { SNAKES, LADDERS, INITIAL_LEADERBOARD, CURRENT_TOURNAMENT, RANDOM_BOT_NAMES } from './src/data/gameConstants';
import { createDiceRollChallenge, createSnakeBiteChallenge, createBonusThrowChallenge } from './src/utils/mathChallenge';

const rooms: Map<string, GameRoom> = new Map();
let leaderboard: LeaderboardEntry[] = [...INITIAL_LEADERBOARD];
let currentTournament: TournamentEvent = { ...CURRENT_TOURNAMENT };

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

  function addLog(room: GameRoom, text: string, type: ActionLogEntry['type'], player?: GamePlayer) {
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      playerId: player?.id || 'system',
      playerName: player?.username || 'System',
      text,
      type,
    };
    room.actionLog = [entry, ...room.actionLog.slice(0, 30)];
  }

  function advanceTurn(room: GameRoom) {
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
    }
  }

  function scheduleBotTurn(roomId: string) {
    setTimeout(() => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'in_progress') return;
      const bot = room.players[room.currentTurnIndex];
      if (!bot || !bot.isBot) return;

      // Bot rolls dice
      executeDiceRoll(room, bot);
    }, 450);
  }

  function executeDiceRoll(room: GameRoom, player: GamePlayer) {
    const rolled = Math.floor(Math.random() * 6) + 1;
    room.diceValue = rolled;
    room.status = 'answering_math';

    addLog(room, `${player.username} rolled a ${rolled}! Solving math challenge...`, 'roll', player);

    // Create dice roll math challenge: Current tile + rolled dice
    const challenge = createDiceRollChallenge(player.id, player.position, rolled, room.timerDuration);
    room.activeChallenge = challenge;

    io.to(room.id).emit('room_update', room);

    // If bot, auto answer
    if (player.isBot) {
      setTimeout(() => {
        const currentR = rooms.get(room.id);
        if (!currentR || currentR.status !== 'answering_math' || !currentR.activeChallenge) return;
        // Bot has 90% chance to be correct
        const isCorrect = Math.random() < 0.9;
        const answer = isCorrect ? challenge.correctAnswer : challenge.correctAnswer + 1;
        processMathAnswer(currentR, player, answer);
      }, 450);
    }
  }

  function processMathAnswer(room: GameRoom, player: GamePlayer, answer: number) {
    const challenge = room.activeChallenge;
    if (!challenge) return;

    const isCorrect = answer === challenge.correctAnswer;

    if (challenge.type === 'dice_move') {
      if (isCorrect) {
        player.mathStreak += 1;
        addLog(
          room,
          `${player.username} solved ${challenge.questionText} (${answer}) correctly! Moving ahead!`,
          'math_success',
          player
        );

        // Move player forward
        const targetTile = Math.min(100, player.position + (challenge.rolledValue || 1));
        player.position = targetTile;

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
          // Slide back to snake tail!
          player.position = snake.tail;
          addLog(
            room,
            `🐍 Oh no! ${player.username} was bitten by the ${snake.name} at tile ${snake.head} and slid down to tile ${snake.tail}!`,
            'snake_slide',
            player
          );

          // Popup mathematical question: current tile minus the snake tail number with timer
          const snakeChallenge = createSnakeBiteChallenge(player.id, snake.head, snake.tail, room.timerDuration);
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
        const bonusChallenge = createBonusThrowChallenge(player.id, 8);
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
      isTournament: boolean;
      timerDuration: 5 | 10;
      isPrivate: boolean;
      player: { username: string; skinId: string };
    }) => {
      const roomId = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
      const hostPlayer: GamePlayer = {
        id: socket.id,
        username: data.player.username || 'SnakeMaster',
        skinId: data.player.skinId || 'emerald_viper',
        position: 1,
        isBot: false,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: 0,
        isHost: true,
        isReady: true,
      };

      const newRoom: GameRoom = {
        id: roomId,
        name: data.roomName || `${data.player.username}'s Game`,
        isTournament: data.isTournament || false,
        timerDuration: data.timerDuration || 10,
        maxPlayers: 4,
        status: 'waiting',
        players: [hostPlayer],
        currentTurnIndex: 0,
        diceValue: null,
        activeChallenge: null,
        actionLog: [],
        winner: null,
        createdAt: Date.now(),
        isPrivate: data.isPrivate || false,
        extraTurnAwarded: false,
      };

      addLog(newRoom, `${hostPlayer.username} created the room.`, 'info', hostPlayer);
      rooms.set(roomId, newRoom);
      socket.join(roomId);

      socket.emit('joined_room', { roomId, room: newRoom, player: hostPlayer });
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Join Room
    socket.on('join_room', (data: { roomId: string; player: { username: string; skinId: string } }) => {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        socket.emit('error_message', 'Room not found. Check the room code.');
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        socket.emit('error_message', 'Room is full.');
        return;
      }
      if (room.status !== 'waiting') {
        socket.emit('error_message', 'Game has already started in this room.');
        return;
      }

      const newPlayer: GamePlayer = {
        id: socket.id,
        username: data.player.username || `Player${room.players.length + 1}`,
        skinId: data.player.skinId || 'neon_cyber',
        position: 1,
        isBot: false,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: room.players.length,
        isHost: false,
        isReady: true,
      };

      room.players.push(newPlayer);
      socket.join(room.id);
      addLog(room, `${newPlayer.username} joined the match.`, 'info', newPlayer);

      socket.emit('joined_room', { roomId: room.id, room, player: newPlayer });
      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Quick Match
    socket.on('quick_match', (data: { isTournament?: boolean; player: { username: string; skinId: string } }) => {
      // Find open room or create one
      let targetRoom = Array.from(rooms.values()).find(
        (r) => !r.isPrivate && r.status === 'waiting' && r.players.length < r.maxPlayers
      );

      if (targetRoom) {
        const newPlayer: GamePlayer = {
          id: socket.id,
          username: data.player.username || 'SpeedSerpent',
          skinId: data.player.skinId || 'emerald_viper',
          position: 1,
          isBot: false,
          score: 0,
          mathStreak: 0,
          consecutiveExtraTurns: 0,
          avatarIndex: targetRoom.players.length,
          isHost: false,
          isReady: true,
        };
        targetRoom.players.push(newPlayer);
        socket.join(targetRoom.id);
        addLog(targetRoom, `${newPlayer.username} matched into the lobby!`, 'info', newPlayer);

        socket.emit('joined_room', { roomId: targetRoom.id, room: targetRoom, player: newPlayer });
        io.to(targetRoom.id).emit('room_update', targetRoom);
      } else {
        // Create quick room
        const roomId = `QM-${Math.floor(1000 + Math.random() * 9000)}`;
        const hostPlayer: GamePlayer = {
          id: socket.id,
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
      const room = rooms.get(data.roomId);
      if (!room || room.status !== 'waiting' || room.players.length >= room.maxPlayers) return;

      const randomName = RANDOM_BOT_NAMES[Math.floor(Math.random() * RANDOM_BOT_NAMES.length)];
      const botSkins = ['coral_striker', 'golden_python', 'frost_wyrm', 'magma_drake'];
      const randomSkin = botSkins[Math.floor(Math.random() * botSkins.length)];

      const botPlayer: GamePlayer = {
        id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        username: `${randomName} [AI]`,
        skinId: randomSkin,
        position: 1,
        isBot: true,
        score: 0,
        mathStreak: 0,
        consecutiveExtraTurns: 0,
        avatarIndex: room.players.length,
        isReady: true,
      };

      room.players.push(botPlayer);
      addLog(room, `${botPlayer.username} joined the game!`, 'info', botPlayer);
      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());
    });

    // Start Game
    socket.on('start_game', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
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
        };
        room.players.push(botPlayer);
      }

      room.status = 'in_progress';
      room.currentTurnIndex = 0;
      const firstPlayer = room.players[0];
      addLog(room, `Game started! ${firstPlayer.username} rolls first!`, 'info', firstPlayer);

      io.to(room.id).emit('room_update', room);
      io.emit('lobby_rooms', getPublicRooms());

      if (firstPlayer.isBot) {
        scheduleBotTurn(room.id);
      }
    });

    // Roll Dice
    socket.on('roll_dice', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || room.status !== 'in_progress') return;

      socket.join(room.id);

      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer) return;

      const isCurrentPlayer =
        currentPlayer.id === socket.id ||
        (!currentPlayer.isBot && room.players.filter((p) => !p.isBot).length === 1) ||
        room.players.some((p) => p.id === socket.id && !p.isBot && p.username === currentPlayer.username);

      if (!isCurrentPlayer) return;

      currentPlayer.id = socket.id;
      executeDiceRoll(room, currentPlayer);
    });

    // Submit Math Answer
    socket.on('submit_math_answer', (data: { roomId: string; answer: number }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.activeChallenge) return;

      socket.join(room.id);

      // Find the player targeted by the challenge or the current turn player
      const challengePlayer =
        room.players.find((p) => p.id === room.activeChallenge?.forPlayerId) ||
        room.players[room.currentTurnIndex];

      if (!challengePlayer) return;

      const isAuthorized =
        challengePlayer.id === socket.id ||
        (!challengePlayer.isBot && room.players.filter((p) => !p.isBot).length === 1) ||
        room.players.some((p) => p.id === socket.id && !p.isBot);

      if (!isAuthorized) return;

      challengePlayer.id = socket.id;
      processMathAnswer(room, challengePlayer, data.answer);
    });

    // Timeout event if client timer reaches 0
    socket.on('math_timeout', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.activeChallenge) return;

      socket.join(room.id);

      const challengePlayer =
        room.players.find((p) => p.id === room.activeChallenge?.forPlayerId) ||
        room.players[room.currentTurnIndex];

      if (!challengePlayer) return;

      const isAuthorized =
        challengePlayer.id === socket.id ||
        (!challengePlayer.isBot && room.players.filter((p) => !p.isBot).length === 1) ||
        room.players.some((p) => p.id === socket.id && !p.isBot);

      if (!isAuthorized) return;

      challengePlayer.id = socket.id;
      addLog(room, `⏱️ Time ran out for ${challengePlayer.username}!`, 'math_fail', challengePlayer);
      processMathAnswer(room, challengePlayer, -99999);
    });

    // Restart game in same room
    socket.on('restart_game', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

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
    });

    // Leave room
    socket.on('leave_room', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      room.players = room.players.filter((p) => p.id !== socket.id);
      socket.leave(room.id);

      if (room.players.length === 0) {
        rooms.delete(room.id);
      } else {
        if (room.currentTurnIndex >= room.players.length) {
          room.currentTurnIndex = 0;
        }
        io.to(room.id).emit('room_update', room);
      }
      io.emit('lobby_rooms', getPublicRooms());
    });

    socket.on('disconnect', () => {
      rooms.forEach((room, rId) => {
        const idx = room.players.findIndex((p) => p.id === socket.id);
        if (idx !== -1) {
          const removed = room.players[idx];
          room.players.splice(idx, 1);
          addLog(room, `${removed.username} disconnected.`, 'info');

          if (room.players.length === 0) {
            rooms.delete(rId);
          } else {
            if (room.currentTurnIndex >= room.players.length) {
              room.currentTurnIndex = 0;
            }
            io.to(rId).emit('room_update', room);
          }
        }
      });
      io.emit('lobby_rooms', getPublicRooms());
    });
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
