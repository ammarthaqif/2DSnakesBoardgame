import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Users, Bot, Play, LogOut, Clock, Swords } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const isHost = room.players[0]?.id === currentPlayerId;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    sounds.playDiceRoll();
    setTimeout(() => setCopied(false), 1500);
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

      {/* Room Code Card */}
      <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Room Code (Share to Play Together)
          </div>
          <div className="text-lg font-black font-mono tracking-widest text-cyan-400 mt-0.5">
            {room.id}
          </div>
        </div>
        <button
          id="copy-room-code-btn"
          onClick={handleCopyCode}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
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
          {room.players.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <SnakeSkinAvatar skinId={p.skinId} size="md" showCrown={idx === 0} />
                <div>
                  <div className="flex items-center gap-1.5">
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
                  <span className="text-[10px] text-emerald-400 font-semibold">Ready to slither</span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty slot placeholder */}
          {room.players.length < room.maxPlayers && (
            <div className="p-3 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
              Waiting for players to join...
            </div>
          )}
        </div>
      </div>

      {/* Host Controls */}
      <div className="pt-2 space-y-2">
        {isHost && room.players.length < room.maxPlayers && (
          <button
            id="add-ai-bot-btn"
            onClick={onAddBot}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Add AI Challenger</span>
          </button>
        )}

        {isHost ? (
          <button
            id="start-match-action-btn"
            onClick={() => {
              sounds.playDiceRoll();
              onStartGame();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{room.players.length === 1 ? 'START (WITH AI BOT)' : 'START GAME NOW'}</span>
          </button>
        ) : (
          <div className="text-center text-xs text-slate-400 italic py-2">
            Waiting for host to start match...
          </div>
        )}
      </div>
    </div>
  );
};
