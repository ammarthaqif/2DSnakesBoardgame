import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Dices,
  Play,
  Sparkles,
  Brain,
  Check,
  Zap,
  X,
  UserCheck,
  Ghost,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';
import { MathDifficulty } from '../types';

interface PlayerRegistrationModalProps {
  initialUsername: string;
  initialSkinId: string;
  initialDifficulty?: MathDifficulty;
  isOpen: boolean;
  targetRoomCode?: string;
  onSave: (username: string, skinId: string, difficulty: MathDifficulty, isGuest?: boolean) => void;
  onClose?: () => void;
}

const UNIQUE_SERPENT_NAMES = [
  'MathMamba',
  'ApexPython',
  'NovaViper',
  'SpeedAdder',
  'QuantumCobra',
  'DeltaKrait',
  'HyperSerpent',
  'CosmoBoa',
  'LogicAsp',
  'RapidRattler',
  'CyberTaipan',
  'OmegaSidewinder',
  'SolarAnaconda',
  'VectorViper',
];

const GUEST_PREFIXES = ['Cobra', 'Viper', 'Python', 'Mamba', 'Adder', 'Taipan', 'Serpent', 'Boa'];

export function generateRandomGuestName(): string {
  const prefix = GUEST_PREFIXES[Math.floor(Math.random() * GUEST_PREFIXES.length)];
  const randNum = Math.floor(100 + Math.random() * 900);
  return `Guest_${prefix}${randNum}`;
}

export const PlayerRegistrationModal: React.FC<PlayerRegistrationModalProps> = ({
  initialUsername,
  initialSkinId,
  initialDifficulty = 'medium',
  isOpen,
  targetRoomCode,
  onSave,
  onClose,
}) => {
  const [entryMode, setEntryMode] = useState<'custom' | 'guest'>('custom');
  const [username, setUsername] = useState(initialUsername || 'MathMamba');
  const [guestName, setGuestName] = useState(() => generateRandomGuestName());
  const [skinId, setSkinId] = useState(initialSkinId || 'emerald_viper');
  const [difficulty, setDifficulty] = useState<MathDifficulty>(initialDifficulty);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (!initialUsername || initialUsername.startsWith('SpeedViper_') || initialUsername.startsWith('Guest_')) {
        setGuestName(generateRandomGuestName());
      } else {
        setUsername(initialUsername);
      }
    }
  }, [isOpen, initialUsername]);

  if (!isOpen) return null;

  const handleRandomizeCustom = () => {
    sounds.playDiceRoll();
    const random = UNIQUE_SERPENT_NAMES[Math.floor(Math.random() * UNIQUE_SERPENT_NAMES.length)];
    const randomNum = Math.floor(10 + Math.random() * 89);
    setUsername(`${random}${randomNum}`);
    setValidationError('');
  };

  const handleRerollGuest = () => {
    sounds.playDiceRoll();
    setGuestName(generateRandomGuestName());
  };

  const handleQuickJoinGuest = () => {
    sounds.playCorrect();
    const finalGuestName = guestName.trim() || generateRandomGuestName();
    onSave(finalGuestName, skinId, difficulty, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryMode === 'guest') {
      const finalGuestName = guestName.trim() || generateRandomGuestName();
      sounds.playCorrect();
      onSave(finalGuestName, skinId, difficulty, true);
      return;
    }

    const clean = username.trim();
    if (clean.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      sounds.playWrong();
      return;
    }
    if (clean.length > 16) {
      setValidationError('Username cannot exceed 16 characters.');
      sounds.playWrong();
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setValidationError('Only letters, numbers, hyphens, and underscores are allowed.');
      sounds.playWrong();
      return;
    }

    setValidationError('');
    sounds.playCorrect();
    onSave(clean, skinId, difficulty, false);
  };

  return (
    <div
      id="registration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="registration-card"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 flex flex-col text-slate-100 my-auto relative"
      >
        {onClose && (
          <button
            id="registration-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-100">
            {targetRoomCode ? 'Join Private Match' : 'Choose Your Identity'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {targetRoomCode
              ? `Enter your username or join instantly as a guest to race in room ${targetRoomCode}!`
              : 'Pick a unique username or jump in immediately as a guest.'}
          </p>

          {targetRoomCode && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 border border-cyan-700/50 rounded-full text-xs font-mono font-bold text-cyan-300">
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Room: {targetRoomCode}</span>
            </div>
          )}
        </div>

        {/* Mode Selector: Unique Username vs Join as Guest */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            id="mode-unique-username-btn"
            onClick={() => {
              sounds.playDiceRoll();
              setEntryMode('custom');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'custom'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Unique Username</span>
          </button>

          <button
            type="button"
            id="mode-guest-btn"
            onClick={() => {
              sounds.playDiceRoll();
              setEntryMode('guest');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'guest'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>Join as Guest</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <SnakeSkinAvatar skinId={skinId} size="md" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {entryMode === 'custom' ? username || 'Enter name...' : guestName}
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold">
                  {entryMode === 'custom' ? 'Custom Racer Profile' : 'Guest Racer'}
                </div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold uppercase">
              {difficulty}
            </span>
          </div>

          {/* Option 1: Unique Username Entry */}
          {entryMode === 'custom' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Unique Username
                </label>
                <span className="text-[10px] text-slate-400 font-mono">3-16 characters</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="player-username-input"
                    type="text"
                    maxLength={16}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="e.g. SpeedPython"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <button
                  id="randomize-username-btn"
                  type="button"
                  onClick={handleRandomizeCustom}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1 text-xs font-bold"
                  title="Generate Unique Name"
                >
                  <Dices className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Random</span>
                </button>
              </div>

              {validationError ? (
                <div className="text-[10px] text-rose-400 font-semibold">{validationError}</div>
              ) : (
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Used across leaderboards, private rooms, and tournaments.</span>
                </div>
              )}
            </div>
          ) : (
            /* Option 2: Guest Mode Instant Name */
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Ghost className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Guest Identity</span>
                </span>
                <button
                  type="button"
                  id="reroll-guest-btn"
                  onClick={handleRerollGuest}
                  className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/40 border border-amber-700/50 rounded-lg text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Dices className="w-3 h-3" />
                  <span>Reroll</span>
                </button>
              </div>
              <div className="text-base font-black font-mono tracking-wider text-amber-200">
                {guestName}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Play immediately without entering an account or custom name. You can customize anytime.
              </p>
            </div>
          )}

          {/* Math Challenge Difficulty Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Math Difficulty</span>
              </label>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wide">
                {difficulty} mode
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="difficulty-btn-easy"
                onClick={() => {
                  sounds.playDiceRoll();
                  setDifficulty('easy');
                }}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  difficulty === 'easy'
                    ? 'border-emerald-400 bg-emerald-950/50 ring-1 ring-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200">Easy</span>
                  {difficulty === 'easy' && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="text-[9px] text-emerald-400/90 font-medium mt-0.5 leading-tight">
                  Single-digit addition
                </div>
              </button>

              <button
                type="button"
                id="difficulty-btn-medium"
                onClick={() => {
                  sounds.playDiceRoll();
                  setDifficulty('medium');
                }}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  difficulty === 'medium'
                    ? 'border-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200">Medium</span>
                  {difficulty === 'medium' && <Check className="w-3 h-3 text-cyan-400" />}
                </div>
                <div className="text-[9px] text-cyan-400/90 font-medium mt-0.5 leading-tight">
                  Standard 2-digit math
                </div>
              </button>

              <button
                type="button"
                id="difficulty-btn-hard"
                onClick={() => {
                  sounds.playDiceRoll();
                  setDifficulty('hard');
                }}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  difficulty === 'hard'
                    ? 'border-amber-400 bg-amber-950/50 ring-1 ring-amber-400 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-0.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Hard</span>
                  </span>
                  {difficulty === 'hard' && <Check className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[9px] text-amber-400/90 font-medium mt-0.5 leading-tight">
                  Rapid mental math
                </div>
              </button>
            </div>
          </div>

          {/* Starter Skin Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Choose Starter Skin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="starter-skin-emerald"
                onClick={() => setSkinId('emerald_viper')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all text-left ${
                  skinId === 'emerald_viper'
                    ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <SnakeSkinAvatar skinId="emerald_viper" size="sm" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Emerald Viper</div>
                  <div className="text-[9px] text-emerald-400 font-medium">Verdant Hunter</div>
                </div>
              </button>

              <button
                type="button"
                id="starter-skin-neon"
                onClick={() => setSkinId('neon_cyber')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all text-left ${
                  skinId === 'neon_cyber'
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <SnakeSkinAvatar skinId="neon_cyber" size="sm" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Cyber Neon</div>
                  <div className="text-[9px] text-cyan-400 font-medium">Arcade Runner</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              id="confirm-username-action-btn"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                {targetRoomCode
                  ? entryMode === 'custom'
                    ? `JOIN ROOM ${targetRoomCode} AS ${username.toUpperCase() || 'PLAYER'}`
                    : `JOIN ROOM ${targetRoomCode} AS GUEST`
                  : entryMode === 'custom'
                  ? 'SAVE USERNAME & ENTER GAME'
                  : 'ENTER GAME AS GUEST'}
              </span>
            </button>

            {/* Quick 1-tap Join as Guest shortcut if in custom mode */}
            {entryMode === 'custom' && (
              <button
                type="button"
                id="quick-guest-btn"
                onClick={handleQuickJoinGuest}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-700/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Ghost className="w-3.5 h-3.5 text-amber-400" />
                <span>Skip typing — Join as Guest ({guestName})</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
