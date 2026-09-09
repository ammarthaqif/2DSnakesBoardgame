import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Trophy,
  Palette,
  Flame,
  PlusCircle,
  LogIn,
  Bot,
  Volume2,
  VolumeX,
  Pencil,
  Clock,
  Swords,
  Sparkles,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PlayerProfile, TournamentEvent } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';

interface LobbyViewProps {
  profile: PlayerProfile;
  tournament: TournamentEvent;
  isMuted: boolean;
  onToggleMute: () => void;
  onQuickMatch: (isTournament?: boolean) => void;
  onCreateRoom: (
    roomName: string,
    timerDuration: 5 | 10 | 15,
    isPrivate: boolean,
    isTournament: boolean,
    customCode?: string,
    maxPlayers?: number
  ) => void;
  onJoinRoom: (roomId: string) => void;
  onOpenSkins: () => void;
  onOpenLeaderboard: () => void;
  onOpenTournament: () => void;
  onEditProfile: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  tournament,
  isMuted,
  onToggleMute,
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
  onOpenSkins,
  onOpenLeaderboard,
  onOpenTournament,
  onEditProfile,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState(`${profile.username}'s Arena`);
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState<2 | 3 | 4>(4);
  const [newRoomTimer, setNewRoomTimer] = useState<5 | 10 | 15>(10);
  const [isPrivateRoom, setIsPrivateRoom] = useState(true);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sounds.playDiceRoll();
    onJoinRoom(roomCodeInput.trim());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playDiceRoll();
    onCreateRoom(
      newRoomName || `${profile.username}'s Arena`,
      newRoomTimer,
      isPrivateRoom,
      false,
      customRoomCode.trim(),
      newRoomMaxPlayers
    );
    setShowCreateModal(false);
  };

  const handleInstantPrivateRoom = () => {
    sounds.playDiceRoll();
    onCreateRoom(
      `${profile.username}'s Arena`,
      10,
      true,
      false,
      undefined,
      4
    );
  };

  return (
    <div id="lobby-view" className="w-full max-w-md mx-auto space-y-3 pb-8">
      {/* Top Bar: Profile Summary & Utility Buttons */}
      <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
        <div
          id="profile-badge-btn"
          onClick={onEditProfile}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Edit serpent profile"
        >
          <div className="relative">
            <SnakeSkinAvatar skinId={profile.skinId} size="lg" />
            <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 border border-slate-700 text-slate-300 group-hover:text-cyan-400">
              <Pencil className="w-2.5 h-2.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-100 group-hover:text-cyan-400 transition-colors">
                {profile.username}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                Lv.{profile.level}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                <Trophy className="w-3 h-3" /> {profile.trophies}
              </span>
              <span>•</span>
              <span>{profile.matchesWon} Wins</span>
              <span>•</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded border font-black uppercase tracking-wider ${
                  profile.mathDifficulty === 'hard'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : profile.mathDifficulty === 'easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {profile.mathDifficulty || 'medium'}
              </span>
            </div>
          </div>
        </div>

        {/* Status indicator and audio toggle */}
        <div className="flex items-center gap-1.5">
          <div
            id="arena-status-badge"
            className="px-2.5 py-1 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5"
            title="Game Arena Ready"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arena Ready</span>
          </div>

          <button
            id="toggle-audio-btn"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Seasonal Tournament Callout Banner */}
      <motion.div
        id="tournament-callout-card"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onOpenTournament}
        className="cursor-pointer p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 shadow-xl shadow-amber-950/30 flex items-center justify-between gap-3 relative overflow-hidden"
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Seasonal Tournament Active</span>
          </div>
          <div className="text-sm font-black text-slate-100">{tournament.title}</div>
          <p className="text-[11px] text-slate-400 line-clamp-1">{tournament.bonusRule}</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
            <Swords className="w-3.5 h-3.5" />
            <span>Event</span>
          </span>
        </div>
      </motion.div>

      {/* Main Action Buttons */}
      <div className="space-y-2.5">
        {/* Quick Match - 1 Tap Play */}
        <button
          id="lobby-quick-match-btn"
          onClick={() => {
            sounds.playDiceRoll();
            onQuickMatch(false);
          }}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-between transition-all active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center">
              <Play className="w-5 h-5 fill-slate-950" />
            </div>
            <div className="text-left">
              <div className="leading-tight">QUICK MATCH</div>
              <div className="text-[11px] font-semibold text-slate-900/80">Play online immediately</div>
            </div>
          </div>
          <span className="text-xl">🎲</span>
        </button>

        {/* Tournament Ranked Match */}
        <button
          id="lobby-tournament-match-btn"
          onClick={() => {
            sounds.playDiceRoll();
            onQuickMatch(true);
          }}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-between transition-all active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center">
              <Swords className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight">TOURNAMENT MATCH</div>
              <div className="text-[10px] font-semibold text-slate-900/80">2x Season Points & Trophy Rating</div>
            </div>
          </div>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Submenu: Skins & Rankings */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="lobby-open-skins-btn"
          onClick={onOpenSkins}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 flex items-center gap-2.5 transition-all text-left shadow-md group"
        >
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Snake Skins</div>
            <div className="text-[10px] text-slate-400">Armory & Customizer</div>
          </div>
        </button>

        <button
          id="lobby-open-rankings-btn"
          onClick={onOpenLeaderboard}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 flex items-center gap-2.5 transition-all text-left shadow-md group"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Leaderboard</div>
            <div className="text-[10px] text-slate-400">Global Rankings</div>
          </div>
        </button>
      </div>

      {/* Custom Room Creation & Join Room Code */}
      <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Private Room with Friends
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">2-4 Players</span>
        </div>

        {/* Join by code form */}
        <form onSubmit={handleJoinSubmit} className="flex gap-2">
          <input
            id="room-code-input"
            type="text"
            placeholder="Room Code (e.g. 1234 or paste link)"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase"
          />
          <button
            id="join-room-code-btn"
            type="submit"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shadow-md shadow-cyan-500/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join</span>
          </button>
        </form>

        {/* Two room creation options: Instant vs Custom */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="instant-create-private-room-btn"
            onClick={handleInstantPrivateRoom}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            title="Create instant private room and get share code"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Room</span>
          </button>

          <button
            id="create-custom-room-btn"
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            title="Choose custom room code, timer speed, or player limit"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom Settings</span>
          </button>
        </div>
      </div>

      {/* How to Play Quick Card */}
      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-300 flex items-center gap-1">
          <span>🧠</span>
          <span>Math Mechanics Guide</span>
        </div>
        <p>
          • <strong>Dice Roll:</strong> Answer <em>Current Tile + Dice Roll</em> within timer to advance!
        </p>
        <p>
          • <strong>Snake Bite:</strong> Slid down? Answer <em>Head - Tail</em> to unlock a <strong>Bonus Question for an EXTRA DICE THROW!</strong>
        </p>
        <p>
          • <strong>Ladder:</strong> Land on base to climb straight to the top!
        </p>
      </div>

      {/* Custom Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-100">Create Match Room</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">Custom Room Code</label>
                  <span className="text-[10px] text-slate-400">Optional (or auto-assigned)</span>
                </div>
                <input
                  id="create-custom-code-input"
                  type="text"
                  placeholder="e.g. VIP88, SERPENT, 1234"
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  maxLength={12}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-400 font-mono font-bold tracking-wider uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">Max Players</label>
                  <span className="text-[10px] text-cyan-400 font-bold">Up to 4 Concurrent</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomMaxPlayers(2)}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs ${
                      newRoomMaxPlayers === 2
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    2 Players
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomMaxPlayers(3)}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs ${
                      newRoomMaxPlayers === 3
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    3 Players
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomMaxPlayers(4)}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs flex items-center justify-center gap-1 ${
                      newRoomMaxPlayers === 4
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/40'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span>4 Players</span>
                    <span className="text-[9px] text-amber-400">★</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Play with up to 4 friends using the room code or link, or add AI bots in open slots.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">
                    Turn Timer Speed
                  </label>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {newRoomTimer}s Per Turn
                  </span>
                </div>

                <div
                  className="grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label="Turn timer duration options"
                >
                  {[
                    { sec: 5 as const, title: '5 Sec', badge: '⚡ Blitz', desc: 'Fast & frantic pace' },
                    { sec: 10 as const, title: '10 Sec', badge: '⏱️ Standard', desc: 'Balanced competition' },
                    { sec: 15 as const, title: '15 Sec', badge: '🧠 Strategic', desc: 'Deep calculation' },
                  ].map(({ sec, title, badge, desc }) => {
                    const isSelected = newRoomTimer === sec;
                    return (
                      <label
                        key={sec}
                        id={`timer-option-${sec}s`}
                        className={`py-2.5 px-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-between text-center relative select-none ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 ring-1 ring-cyan-400 shadow-md shadow-cyan-950/40'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="turn-timer"
                          value={sec}
                          checked={isSelected}
                          onChange={() => setNewRoomTimer(sec)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <span className="w-1 h-1 rounded-full bg-slate-950" />}
                          </span>
                          <span className="text-xs font-black">{title}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 mt-1">{badge}</span>
                        <span className="text-[8px] text-slate-500 leading-none mt-0.5">{desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="private-chk"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="private-chk" className="text-slate-300 cursor-pointer">
                  Private Room (Only players with code can join)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 text-slate-950 rounded-xl font-bold"
                >
                  Create & Host
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
