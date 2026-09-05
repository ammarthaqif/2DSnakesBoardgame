/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayerProfile,
  GameRoom,
  GamePlayer,
  LeaderboardEntry,
  TournamentEvent,
} from './types';
import {
  CURRENT_TOURNAMENT,
  INITIAL_LEADERBOARD,
  SNAKES,
  LADDERS,
} from './data/gameConstants';
import { sounds } from './utils/soundEffects';
import { GameBoard } from './components/GameBoard';
import { DiceRoller } from './components/DiceRoller';
import { MathChallengeModal } from './components/MathChallengeModal';
import { LobbyView } from './components/LobbyView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { SkinCustomizerModal } from './components/SkinCustomizerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TournamentModal } from './components/TournamentModal';
import { GameOverModal } from './components/GameOverModal';
import { PlayerRegistrationModal } from './components/PlayerRegistrationModal';
import { ActionFeed } from './components/ActionFeed';
import { SnakeSkinAvatar } from './components/SnakeSkinAvatar';
import { TurnCountdownTimer } from './components/TurnCountdownTimer';
import { LocalGameEngine } from './utils/localGameEngine';
import { motion } from 'motion/react';
import {
  Trophy,
  Palette,
  Volume2,
  VolumeX,
  LogOut,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
  Globe,
  Wifi,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'snake_boardgame_profile_v1';

export default function App() {
  // Socket connection
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const localEngineRef = useRef<LocalGameEngine | null>(null);

  // Player Profile
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: `p_${Date.now()}`,
      username: 'SpeedViper',
      skinId: 'emerald_viper',
      avatarSeed: 'seed1',
      level: 1,
      xp: 40,
      trophies: 150,
      matchesWon: 3,
      matchesPlayed: 5,
      mathCorrect: 28,
      mathTotal: 30,
      seasonPoints: 340,
    };
  });

  const profileRef = useRef<PlayerProfile>(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // UI Modals
  const [showRegistration, setShowRegistration] = useState<boolean>(() => {
    return !localStorage.getItem(LOCAL_STORAGE_KEY);
  });
  const [showSkinsModal, setShowSkinsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showTournamentModal, setShowTournamentModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active Game State
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('local_human');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [tournament, setTournament] = useState<TournamentEvent>(CURRENT_TOURNAMENT);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Initialize Local Game Engine fallback for GitHub Pages & offline play
  useEffect(() => {
    localEngineRef.current = new LocalGameEngine((updatedRoom) => {
      setActiveRoom(updatedRoom);

      if (updatedRoom.winner && updatedRoom.status === 'game_over') {
        const isMeWinner = updatedRoom.winner.id === 'local_human';
        setProfile((prev) => ({
          ...prev,
          matchesPlayed: prev.matchesPlayed + 1,
          matchesWon: isMeWinner ? prev.matchesWon + 1 : prev.matchesWon,
          trophies: isMeWinner ? prev.trophies + 25 : prev.trophies + 5,
          seasonPoints: prev.seasonPoints + (isMeWinner ? (updatedRoom.isTournament ? 60 : 40) : 15),
          xp: prev.xp + 50,
          level: Math.floor((prev.xp + 50) / 100) + 1,
        }));
      }
    });
  }, []);

  // Persist profile
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Sync mute with sounds utility
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  // Fetch initial leaderboard and tournament data
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Setup Socket.IO
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setMyPlayerId(socket.id || '');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('joined_room', (data: { roomId: string; room: GameRoom; player: GamePlayer }) => {
      setActiveRoom(data.room);
      setMyPlayerId(data.player.id);
      sounds.playDiceRoll();
    });

    socket.on('room_update', (updatedRoom: GameRoom) => {
      setActiveRoom(updatedRoom);

      // Check if winner
      if (updatedRoom.winner && updatedRoom.status === 'game_over') {
        const isMeWinner = updatedRoom.winner.id === socket.id;
        const currentProf = profileRef.current;
        // Record on server
        fetch('/api/leaderboard/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentProf.username,
            skinId: currentProf.skinId,
            won: isMeWinner,
            mathCorrect: currentProf.mathCorrect,
            mathTotal: currentProf.mathTotal,
            seasonPointsEarned: isMeWinner ? 60 : 20,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.leaderboard) setLeaderboard(res.leaderboard);
          })
          .catch(() => {});

        // Update local stats
        setProfile((prev) => ({
          ...prev,
          matchesPlayed: prev.matchesPlayed + 1,
          matchesWon: isMeWinner ? prev.matchesWon + 1 : prev.matchesWon,
          trophies: isMeWinner ? prev.trophies + 25 : prev.trophies + 5,
          seasonPoints: prev.seasonPoints + (isMeWinner ? 60 : 20),
          xp: prev.xp + 50,
          level: Math.floor((prev.xp + 50) / 100) + 1,
        }));
      }
    });

    socket.on('error_message', (msg: string) => {
      setStatusMessage(msg);
      sounds.playWrong();
      setTimeout(() => setStatusMessage(''), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Profile Save
  const handleSaveProfile = (username: string, skinId: string) => {
    setProfile((prev) => ({
      ...prev,
      username,
      skinId,
    }));
    setShowRegistration(false);
  };

  // Matchmaking / Room actions
  const handleQuickMatch = (isTournament: boolean = false) => {
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('quick_match', {
        isTournament,
        player: { username: profile.username, skinId: profile.skinId },
      });
    } else if (localEngineRef.current) {
      setMyPlayerId('local_human');
      const room = localEngineRef.current.quickMatch(
        { username: profile.username, skinId: profile.skinId },
        isTournament
      );
      setActiveRoom(room);
    }
  };

  const handleCreateRoom = (
    roomName: string,
    timerDuration: 5 | 10,
    isPrivate: boolean,
    isTournament: boolean
  ) => {
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('create_room', {
        roomName,
        timerDuration,
        isPrivate,
        isTournament,
        player: { username: profile.username, skinId: profile.skinId },
      });
    } else if (localEngineRef.current) {
      setMyPlayerId('local_human');
      const room = localEngineRef.current.createRoom(
        roomName,
        timerDuration,
        isPrivate,
        isTournament,
        { username: profile.username, skinId: profile.skinId }
      );
      setActiveRoom(room);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (socketConnected && socketRef.current) {
      socketRef.current.emit('join_room', {
        roomId,
        player: { username: profile.username, skinId: profile.skinId },
      });
    } else if (localEngineRef.current) {
      setMyPlayerId('local_human');
      const room = localEngineRef.current.quickMatch(
        { username: profile.username, skinId: profile.skinId }
      );
      setActiveRoom(room);
    }
  };

  // Auto-recovery safety check: Ensure no challenge remains stuck in UI indefinitely
  useEffect(() => {
    if (!activeRoom?.activeChallenge) return;
    const chalId = activeRoom.activeChallenge.id;
    const timeLimitSec = (activeRoom.activeChallenge.timeLimit || 10) + 3;
    const safetyTimer = setTimeout(() => {
      setActiveRoom((prev) => {
        if (!prev || !prev.activeChallenge || prev.activeChallenge.id !== chalId) return prev;
        return { ...prev, activeChallenge: null };
      });
    }, timeLimitSec * 1000);
    return () => clearTimeout(safetyTimer);
  }, [activeRoom?.activeChallenge?.id]);

  const handleStartGame = () => {
    if (isCurrentRoomLocal) {
      if (localEngineRef.current) localEngineRef.current.startGame();
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('start_game', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.startGame();
    }
  };

  const handleAddBot = () => {
    if (isCurrentRoomLocal) {
      if (localEngineRef.current) localEngineRef.current.addBot();
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('add_bot', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.addBot();
    }
  };

  const handleLeaveRoom = () => {
    if (isCurrentRoomLocal) {
      if (localEngineRef.current) localEngineRef.current.leaveRoom();
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('leave_room', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.leaveRoom();
    }
    setActiveRoom(null);
  };

  // Helper variables for current match
  const isCurrentRoomLocal = Boolean(
    activeRoom && (
      activeRoom.id.startsWith('LOCAL-') ||
      activeRoom.players.some((p) => p.id === 'local_human')
    )
  );

  const myEffectivePlayerId = useMemo(() => {
    if (!activeRoom) return myPlayerId;
    if (isCurrentRoomLocal) return 'local_human';
    const foundById = activeRoom.players.find((p) => p.id === myPlayerId);
    if (foundById) return foundById.id;
    const foundHuman = activeRoom.players.find((p) => !p.isBot && p.username === profile.username);
    if (foundHuman) return foundHuman.id;
    const firstHuman = activeRoom.players.find((p) => !p.isBot);
    if (firstHuman) return firstHuman.id;
    return myPlayerId;
  }, [activeRoom, isCurrentRoomLocal, profile.username, myPlayerId]);

  const currentPlayerInTurn = activeRoom?.players[activeRoom?.currentTurnIndex || 0];
  const isMyTurn = Boolean(currentPlayerInTurn && currentPlayerInTurn.id === myEffectivePlayerId);
  const myPlayerState = activeRoom?.players.find((p) => p.id === myEffectivePlayerId);

  // Compute target tile for highlight
  const targetHighlight =
    activeRoom?.activeChallenge?.type === 'dice_move'
      ? activeRoom.activeChallenge.targetTileIfCorrect
      : null;

  const handleRollDice = () => {
    sounds.playDiceRoll();
    if (isCurrentRoomLocal) {
      if (localEngineRef.current) {
        localEngineRef.current.rollDice();
      }
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('roll_dice', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.rollDice();
    }
  };

  const handleSubmitMath = (answer: number) => {
    const chal = activeRoom?.activeChallenge;
    const currentMyId = myEffectivePlayerId;

    if (chal && chal.forPlayerId === currentMyId) {
      const isCorrect = answer === chal.correctAnswer;
      if (isCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playWrong();
      }

      setProfile((prev) => ({
        ...prev,
        mathCorrect: isCorrect ? prev.mathCorrect + 1 : prev.mathCorrect,
        mathTotal: prev.mathTotal + 1,
      }));

      // Optimistically move player token immediately so movement never lags or misses a frame
      if (isCorrect && chal.type === 'dice_move') {
        const rolled = chal.rolledValue || activeRoom?.diceValue || 1;
        setActiveRoom((prev) => {
          if (!prev) return null;
          const currentPlayer = prev.players.find((p) => p.id === currentMyId);
          const currentPos = currentPlayer ? currentPlayer.position : 1;
          const targetTile = Math.min(100, currentPos + rolled);

          const ladder = LADDERS.find((l) => l.bottom === targetTile);
          const snake = SNAKES.find((s) => s.head === targetTile);
          const finalPos = ladder ? ladder.top : snake ? snake.tail : targetTile;

          return {
            ...prev,
            activeChallenge: null,
            players: prev.players.map((p) =>
              p.id === currentMyId
                ? { ...p, position: finalPos, mathStreak: p.mathStreak + 1 }
                : p
            ),
          };
        });
      } else {
        setActiveRoom((prev) => (prev ? { ...prev, activeChallenge: null } : null));
      }
    } else {
      setActiveRoom((prev) => (prev ? { ...prev, activeChallenge: null } : null));
    }

    if (isCurrentRoomLocal) {
      if (localEngineRef.current) {
        localEngineRef.current.submitMathAnswer(answer);
      }
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('submit_math_answer', { roomId: activeRoom.id, answer });
    } else if (localEngineRef.current) {
      localEngineRef.current.submitMathAnswer(answer);
    }
  };

  const handleMathTimeout = () => {
    sounds.playWrong();
    setActiveRoom((prev) => {
      if (!prev) return null;
      if (prev.activeChallenge && prev.activeChallenge.forPlayerId === myEffectivePlayerId) {
        return { ...prev, activeChallenge: null };
      }
      return prev;
    });

    if (isCurrentRoomLocal) {
      if (localEngineRef.current) {
        localEngineRef.current.handleTimeout();
      }
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('math_timeout', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.handleTimeout();
    }
    setProfile((prev) => ({
      ...prev,
      mathTotal: prev.mathTotal + 1,
    }));
  };

  const handlePlayAgain = () => {
    sounds.playDiceRoll();
    if (isCurrentRoomLocal) {
      if (localEngineRef.current) {
        localEngineRef.current.restartGame();
      }
    } else if (socketConnected && socketRef.current && activeRoom) {
      socketRef.current.emit('restart_game', { roomId: activeRoom.id });
    } else if (localEngineRef.current) {
      localEngineRef.current.restartGame();
    }
  };

  return (
    <div
      id="snake-boardgame-app"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 overflow-x-hidden"
    >
      {/* Top Banner Status (if any) */}
      {statusMessage && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg animate-bounce">
          {statusMessage}
        </div>
      )}

      {/* Main Container Wrapper - Mobile Phone Proportion */}
      <main className="w-full max-w-lg flex flex-col gap-3">
        {/* VIEW 1: LOBBY / DASHBOARD (when not in a room) */}
        {!activeRoom && (
          <>
            {/* Top Brand Header */}
            <div className="flex items-center justify-between py-1 px-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐍</span>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    SNAKE BOARD GAME
                  </h1>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                    Mobile Multiplayer & Speed Math
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    socketConnected
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  }`}
                  title={
                    socketConnected
                      ? 'Connected to live game server'
                      : 'Running in zero-config standalone mode (ideal for GitHub Pages)'
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                    }`}
                  />
                  <span>{socketConnected ? 'Multiplayer Online' : 'GitHub Pages Ready'}</span>
                </div>
              </div>
            </div>

            <LobbyView
              profile={profile}
              tournament={tournament}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onQuickMatch={handleQuickMatch}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onOpenSkins={() => setShowSkinsModal(true)}
              onOpenLeaderboard={() => setShowLeaderboardModal(true)}
              onOpenTournament={() => setShowTournamentModal(true)}
              onEditProfile={() => setShowRegistration(true)}
            />
          </>
        )}

        {/* VIEW 2: WAITING LOBBY (room exists but not started) */}
        {activeRoom && activeRoom.status === 'waiting' && (
          <WaitingRoomView
            room={activeRoom}
            currentPlayerId={myPlayerId}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {/* VIEW 3: ACTIVE GAME BOARD IN PROGRESS */}
        {activeRoom && activeRoom.status !== 'waiting' && (
          <div className="space-y-2.5 w-full">
            {/* In-Game Top Bar */}
            <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 min-w-0">
                <SnakeSkinAvatar
                  skinId={myPlayerState?.skinId || profile.skinId}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-100">
                      Tile {myPlayerState?.position || 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/100</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>Streak: {myPlayerState?.mathStreak || 0}</span>
                  </div>
                </div>
              </div>

              {/* Visual Countdown Timer for Turn Urgency */}
              {activeRoom.status !== 'game_over' && (
                <TurnCountdownTimer
                  durationSeconds={
                    activeRoom.activeChallenge
                      ? activeRoom.activeChallenge.timeLimit
                      : activeRoom.timerDuration || 10
                  }
                  isMyTurn={isMyTurn}
                  activePlayerName={currentPlayerInTurn?.username || 'Opponent'}
                  isAnsweringMath={Boolean(activeRoom.activeChallenge)}
                  turnKey={`${activeRoom.currentTurnIndex}-${activeRoom.status}-${activeRoom.activeChallenge?.id || 'idle'}`}
                  onTimeout={() => {
                    if (isMyTurn && activeRoom.activeChallenge) {
                      handleMathTimeout();
                    }
                  }}
                />
              )}

              {/* Leave Match Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="in-game-leave-btn"
                  onClick={handleLeaveRoom}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Leave Match"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Opponent Math Solving Status Indicator (No blocking modal!) */}
            {activeRoom.activeChallenge && activeRoom.activeChallenge.forPlayerId !== myEffectivePlayerId && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 rounded-2xl border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {activeRoom.players.find((p) => p.id === activeRoom.activeChallenge?.forPlayerId)?.username || 'Opponent'} is solving:
                  </span>
                  <span className="font-mono font-black text-xs text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-cyan-700/50">
                    {activeRoom.activeChallenge.questionText}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-cyan-400 animate-pulse">
                  Solving...
                </div>
              </motion.div>
            )}

            {/* The 10x10 Snake Board */}
            <GameBoard
              players={activeRoom.players}
              currentPlayerId={myEffectivePlayerId}
              activeTurnPlayerId={currentPlayerInTurn?.id || ''}
              targetTileHighlight={targetHighlight}
            />

            {/* Dice Roller & Turn Action Bar */}
            <DiceRoller
              diceValue={activeRoom.diceValue}
              isMyTurn={isMyTurn}
              disabled={activeRoom.status !== 'in_progress'}
              extraTurnAwarded={activeRoom.extraTurnAwarded}
              onRoll={handleRollDice}
            />

            {/* Action Log Event Feed */}
            <ActionFeed logs={activeRoom.actionLog} />
          </div>
        )}
      </main>

      {/* MODAL 1: Math Challenge (Dice Roll, Snake Bite Escape, Bonus Extra Throw) */}
      {/* Crucial fix: Only show full-screen interactive modal for the local player */}
      {activeRoom?.activeChallenge && activeRoom.activeChallenge.forPlayerId === myEffectivePlayerId && (
        <MathChallengeModal
          challenge={activeRoom.activeChallenge}
          isMyTurn={true}
          activePlayerName={currentPlayerInTurn?.username || 'You'}
          onSubmitAnswer={handleSubmitMath}
          onTimeout={handleMathTimeout}
        />
      )}

      {/* MODAL 2: Game Over / Victory Celebration */}
      {activeRoom?.status === 'game_over' && activeRoom.winner && (
        <GameOverModal
          winner={activeRoom.winner}
          isCurrentUserWinner={activeRoom.winner.id === myEffectivePlayerId}
          isTournament={activeRoom.isTournament}
          onPlayAgain={handlePlayAgain}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* MODAL 3: Snake Skin Armory Customizer */}
      {showSkinsModal && (
        <SkinCustomizerModal
          currentSkinId={profile.skinId}
          userTrophies={profile.trophies}
          onSelectSkin={(newSkinId) => {
            setProfile((prev) => ({ ...prev, skinId: newSkinId }));
          }}
          onClose={() => setShowSkinsModal(false)}
        />
      )}

      {/* MODAL 4: Global Leaderboards */}
      {showLeaderboardModal && (
        <LeaderboardModal
          leaderboard={leaderboard}
          currentUsername={profile.username}
          onRefresh={fetchLeaderboard}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {/* MODAL 5: Seasonal Tournament Details */}
      {showTournamentModal && (
        <TournamentModal
          tournament={tournament}
          onEnterTournament={() => handleQuickMatch(true)}
          onClose={() => setShowTournamentModal(false)}
        />
      )}

      {/* MODAL 6: Registration / Instant Profile Setup */}
      <PlayerRegistrationModal
        initialUsername={profile.username}
        initialSkinId={profile.skinId}
        isOpen={showRegistration}
        onSave={handleSaveProfile}
        onClose={() => setShowRegistration(false)}
      />
    </div>
  );
}
