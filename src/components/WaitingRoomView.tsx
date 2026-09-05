import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Users, Bot, Play, LogOut, Clock, Swords, Share2, Wifi } from 'lucide-react';
import { GameRoom, GamePlayer } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';

interface WaitingRoomViewProps {
  room: GameRoom;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  room,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isHost =
    room.players.find((p) => p.id === currentPlayerId)?.isHost ??
    (room.players[0]?.id === currentPlayerId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    sounds.playDiceRoll();
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room.id)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    sounds.playDiceRoll();
    setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div
      id="waiting-room-container"
      className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {room.isTournament && (
              <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                <Swords className="w-3 h-3" /> Tournament
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {room.timerDuration}s Timer
            </span>
          </div>
          <h2 className="text-base font-black text-slate-100 mt-1">{room.name}</h2>
        </div>

        <button
          id="waiting-room-leave-btn"
          onClick={onLeaveRoom}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Room Code & Invite Link Card */}
      <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Room Code (Share with Friends)
            </div>
            <div className="text-xl font-black font-mono tracking-widest text-cyan-400 mt-0.5 select-all">
              {room.id}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="copy-room-code-btn"
              onClick={handleCopyCode}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Copy room code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              id="copy-invite-link-btn"
              onClick={handleCopyInviteLink}
              className="px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Copy direct invite link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>Real-time multiplayer active. Players can join via code or link.</span>
        </div>
      </div>

      {/* Players List */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Players in Match ({room.players.length}/{room.maxPlayers})</span>
          </div>
        </div>

        <div className="space-y-2">
          {room.players.map((p, idx) => {
            const playerColors = [
              { border: 'border-cyan-500/50', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', dot: 'bg-cyan-400' },
              { border: 'border-amber-500/50', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' },
              { border: 'border-emerald-500/50', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' },
              { border: 'border-purple-500/50', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: 'bg-purple-400' },
            ];
            const color = playerColors[idx % playerColors.length];

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/70 border ${color.border} transition-all`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <SnakeSkinAvatar skinId={p.skinId} size="md" showCrown={idx === 0} />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${color.badge} text-[9px] font-black flex items-center justify-center border shadow-sm`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-100">{p.username}</span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          Host
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                          AI Bot
                        </span>
                      )}
                      {p.id === currentPlayerId && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          p.connected !== false ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold ${
                          p.connected !== false ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {p.connected !== false ? 'Connected' : 'Reconnecting...'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">P{idx + 1}</span>
                  <span className="text-[9px] text-slate-500">Tile 1</span>
                </div>
              </div>
            );
          })}

          {/* Render each unfilled slot up to maxPlayers (up to 4) */}
          {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map((_, slotIdx) => {
            const actualSlotNumber = room.players.length + slotIdx + 1;
            return (
              <div
                key={`empty-slot-${actualSlotNumber}`}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 text-xs text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {actualSlotNumber}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs">Slot {actualSlotNumber}: Open</span>
                    <p className="text-[10px] text-slate-600">Waiting for friend code or bot</p>
                  </div>
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={onAddBot}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-purple-800/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Bot className="w-3 h-3" />
                    <span>+ Add AI</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {room.players.length === room.maxPlayers && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold">
          🎉 Match Room Full! All {room.maxPlayers} player slots filled and ready to race!
        </div>
      )}

      {/* Host Controls */}
      <div className="pt-2 space-y-2">
        {room.players.length >= 2 && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {room.players.filter((p) => !p.isBot).length >= 2
                ? `Online multiplayers joined (${room.players.length}/${room.maxPlayers})! Ready to race!`
                : `Players ready (${room.players.length}/${room.maxPlayers})!`}
            </span>
          </div>
        )}

        {isHost && room.players.length < room.maxPlayers && (
          <button
            id="add-ai-bot-btn"
            onClick={onAddBot}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Add Optional AI Challenger ({room.players.length}/{room.maxPlayers})</span>
          </button>
        )}

        {isHost ? (
          room.players.length >= 2 ? (
            <div className="space-y-1.5">
              <button
                id="start-match-action-btn"
                onClick={() => {
                  sounds.playDiceRoll();
                  onStartGame();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>
                  {room.players.filter((p) => !p.isBot).length >= 2
                    ? `START MULTIPLAYER MATCH (${room.players.length} PLAYERS)`
                    : `START MATCH (${room.players.length} PLAYERS)`}
                </span>
              </button>
              <div className="text-center text-[10px] text-slate-400 font-semibold">
                Match starts amongst the {room.players.length} joined players without extra bots.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-slate-950/80 border border-cyan-500/30 rounded-2xl text-center space-y-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Waiting for other players to join... (1/{room.maxPlayers})</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Share Room Code <strong className="text-cyan-400 font-mono select-all">{room.id}</strong>. Match starts amongst joined players when ready.
                </p>
              </div>

              <button
                id="start-match-action-btn"
                onClick={() => {
                  sounds.playDiceRoll();
                  onStartGame();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                title="Play alone with an AI bot right now"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Start Solo Practice (Play with AI Opponent)</span>
              </button>
            </div>
          )
        ) : (
          <div className="text-center text-xs text-slate-400 italic py-2">
            Waiting for host to start match...
          </div>
        )}
      </div>
    </div>
  );
};
