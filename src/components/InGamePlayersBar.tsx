import React from 'react';
import { GamePlayer, GameRoom } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { Flame, Crown, Bot, WifiOff, Clock } from 'lucide-react';

interface InGamePlayersBarProps {
  room: GameRoom;
  currentPlayerId: string;
}

export const PLAYER_PALETTES = [
  {
    name: 'Cyan',
    border: 'border-cyan-400',
    borderInactive: 'border-cyan-900/60',
    bgActive: 'bg-cyan-950/70',
    text: 'text-cyan-400',
    ring: 'ring-cyan-400',
    glow: 'shadow-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    tagBg: 'bg-cyan-500 text-slate-950',
    dot: '#06b6d4',
  },
  {
    name: 'Amber',
    border: 'border-amber-400',
    borderInactive: 'border-amber-900/60',
    bgActive: 'bg-amber-950/70',
    text: 'text-amber-400',
    ring: 'ring-amber-400',
    glow: 'shadow-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    tagBg: 'bg-amber-500 text-slate-950',
    dot: '#f59e0b',
  },
  {
    name: 'Emerald',
    border: 'border-emerald-400',
    borderInactive: 'border-emerald-900/60',
    bgActive: 'bg-emerald-950/70',
    text: 'text-emerald-400',
    ring: 'ring-emerald-400',
    glow: 'shadow-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    tagBg: 'bg-emerald-500 text-slate-950',
    dot: '#10b981',
  },
  {
    name: 'Purple',
    border: 'border-purple-400',
    borderInactive: 'border-purple-900/60',
    bgActive: 'bg-purple-950/70',
    text: 'text-purple-400',
    ring: 'ring-purple-400',
    glow: 'shadow-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    tagBg: 'bg-purple-500 text-slate-950',
    dot: '#a855f7',
  },
];

export const InGamePlayersBar: React.FC<InGamePlayersBarProps> = ({ room, currentPlayerId }) => {
  const currentActivePlayer = room.players[room.currentTurnIndex];

  return (
    <div
      id="in-game-players-bar"
      className="w-full bg-slate-950/80 rounded-2xl border border-slate-800/80 p-2 shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-800/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Match ({room.players.length} Players)</span>
        </div>
        <div className="text-slate-300 flex items-center gap-1">
          <span>Turn:</span>
          <span className="text-amber-400 font-black">{currentActivePlayer?.username || 'Unknown'}</span>
        </div>
      </div>

      <div
        className={`grid gap-1.5 pt-1.5 ${
          room.players.length === 2
            ? 'grid-cols-2'
            : room.players.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {room.players.map((p, idx) => {
          const isTurn = idx === room.currentTurnIndex;
          const isUser = p.id === currentPlayerId;
          const color = PLAYER_PALETTES[idx % PLAYER_PALETTES.length];
          const isAfk = (p.turnsWithoutMoving ?? 0) >= 2;
          const hasStreak = (p.mathStreak ?? 0) >= 2;

          return (
            <div
              key={p.id}
              id={`player-card-${p.id}`}
              className={`relative rounded-xl p-2 transition-all flex flex-col justify-between border ${
                isTurn
                  ? `${color.border} ${color.bgActive} shadow-md ${color.glow} ring-1 ${color.ring}`
                  : `${color.borderInactive} bg-slate-900/60 opacity-85 hover:opacity-100`
              }`}
            >
              {/* Turn indicator ribbon */}
              {isTurn && (
                <div
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full ${color.tagBg} text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  <span>{room.activeChallenge ? 'SOLVING' : 'ROLLING'}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <SnakeSkinAvatar skinId={p.skinId} size="sm" />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${color.badge} text-[8px] font-black flex items-center justify-center border`}
                  >
                    {idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  {/* Name row with status icons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-100 truncate max-w-[70px] sm:max-w-[90px]">
                      {p.username}
                    </span>

                    {/* YOU badge */}
                    {isUser && (
                      <span className="shrink-0 text-[8px] px-1 rounded bg-cyan-500/30 text-cyan-300 font-bold">
                        YOU
                      </span>
                    )}

                    {/* Host icon */}
                    {p.isHost && (
                      <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" title="Host" />
                    )}

                    {/* Bot icon */}
                    {p.isBot && (
                      <span
                        className="shrink-0 text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-0.5"
                        title="AI Opponent"
                      >
                        <Bot className="w-2.5 h-2.5" />
                        <span>BOT</span>
                      </span>
                    )}

                    {/* AFK Badge (hasn't moved for 2 turns) */}
                    {isAfk && (
                      <span
                        id={`player-afk-badge-${p.id}`}
                        className="shrink-0 text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black flex items-center gap-0.5 animate-pulse"
                        title="AFK: Has not moved for 2+ consecutive turns"
                      >
                        <Clock className="w-2.5 h-2.5 text-rose-400" />
                        <span>AFK</span>
                      </span>
                    )}

                    {/* Streak Fire Icon (consecutive correct math answers) */}
                    {hasStreak && (
                      <span
                        id={`player-streak-badge-${p.id}`}
                        className="shrink-0 text-[8px] px-1 py-0.2 rounded bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/50 font-black flex items-center gap-0.5 shadow-sm shadow-amber-500/20"
                        title={`${p.mathStreak} consecutive correct math answers!`}
                      >
                        <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400 animate-bounce" />
                        <span>{p.mathStreak}🔥</span>
                      </span>
                    )}

                    {/* Disconnected alert */}
                    {p.connected === false && !p.isBot && (
                      <span
                        className="shrink-0 text-[8px] px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 flex items-center gap-0.5"
                        title="Disconnected / Reconnecting..."
                      >
                        <WifiOff className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Tile position & stats */}
                  <div className="flex items-center gap-2 text-[10px] mt-0.5">
                    <span className={`font-mono font-bold ${color.text}`}>
                      Tile {p.position}
                    </span>
                    {p.mathStreak === 1 && !hasStreak && (
                      <span className="flex items-center text-[9px] text-amber-400 font-bold" title="1 Correct Answer">
                        <Flame className="w-2.5 h-2.5 fill-amber-400/70 text-amber-400" />
                        <span>1</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar towards tile 100 */}
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1.5 overflow-hidden border border-slate-800/60">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    idx === 0
                      ? 'bg-cyan-400'
                      : idx === 1
                      ? 'bg-amber-400'
                      : idx === 2
                      ? 'bg-emerald-400'
                      : 'bg-purple-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(1, p.position))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
