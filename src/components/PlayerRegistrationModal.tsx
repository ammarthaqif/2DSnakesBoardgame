import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Dices, Play, Sparkles, Brain, Check, Zap, X } from 'lucide-react';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';
import { MathDifficulty } from '../types';

interface PlayerRegistrationModalProps {
  initialUsername: string;
  initialSkinId: string;
  initialDifficulty?: MathDifficulty;
  isOpen: boolean;
  onSave: (username: string, skinId: string, difficulty: MathDifficulty) => void;
  onClose?: () => void;
}

const RANDOM_NAMES = [
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
];

export const PlayerRegistrationModal: React.FC<PlayerRegistrationModalProps> = ({
  initialUsername,
  initialSkinId,
  initialDifficulty = 'medium',
  isOpen,
  onSave,
  onClose,
}) => {
  const [username, setUsername] = useState(initialUsername || 'MathMamba');
  const [skinId, setSkinId] = useState(initialSkinId || 'emerald_viper');
  const [difficulty, setDifficulty] = useState<MathDifficulty>(initialDifficulty);

  if (!isOpen) return null;

  const handleRandomize = () => {
    sounds.playDiceRoll();
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setUsername(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    sounds.playCorrect();
    onSave(username.trim(), skinId, difficulty);
  };

  return (
    <div
      id="registration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="registration-card"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl shadow-cyan-950/50 flex flex-col text-slate-100 my-auto relative"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-100">
            Player Profile & Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize your serpent avatar, username, and math challenge difficulty.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <SnakeSkinAvatar skinId={skinId} size="lg" />
            <span className="text-[11px] font-bold text-cyan-400 mt-1">Active Serpent Avatar</span>
          </div>

          {/* Username Input with Randomizer Button */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Serpent Username
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="player-username-input"
                  type="text"
                  maxLength={15}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <button
                id="randomize-username-btn"
                type="button"
                onClick={handleRandomize}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center"
                title="Random Name"
              >
                <Dices className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Math Challenge Difficulty Selector (Easy / Medium / Hard) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Math Challenge Difficulty</span>
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
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  difficulty === 'easy'
                    ? 'border-emerald-400 bg-emerald-950/50 ring-1 ring-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200">Easy</span>
                  {difficulty === 'easy' && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="text-[9px] text-emerald-400/90 font-medium mt-1 leading-tight">
                  Friendly numbers & single additions
                </div>
              </button>

              <button
                type="button"
                id="difficulty-btn-medium"
                onClick={() => {
                  sounds.playDiceRoll();
                  setDifficulty('medium');
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  difficulty === 'medium'
                    ? 'border-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200">Medium</span>
                  {difficulty === 'medium' && <Check className="w-3 h-3 text-cyan-400" />}
                </div>
                <div className="text-[9px] text-cyan-400/90 font-medium mt-1 leading-tight">
                  Standard equations & 2-digit math
                </div>
              </button>

              <button
                type="button"
                id="difficulty-btn-hard"
                onClick={() => {
                  sounds.playDiceRoll();
                  setDifficulty('hard');
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
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
                <div className="text-[9px] text-amber-400/90 font-medium mt-1 leading-tight">
                  Multi-term operations & rapid mental math
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

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="dive-straight-action-btn"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>SAVE & ENTER MATCH!</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
