import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Dices, Play, Sparkles } from 'lucide-react';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';

interface PlayerRegistrationModalProps {
  initialUsername: string;
  initialSkinId: string;
  isOpen: boolean;
  onSave: (username: string, skinId: string) => void;
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
  isOpen,
  onSave,
  onClose,
}) => {
  const [username, setUsername] = useState(initialUsername || 'MathMamba');
  const [skinId, setSkinId] = useState(initialSkinId || 'emerald_viper');

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
    onSave(username.trim(), skinId);
  };

  return (
    <div
      id="registration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md"
    >
      <motion.div
        id="registration-card"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl shadow-cyan-950/50 flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-100">
            Welcome to Snake Board Game!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your serpent username & starter skin to dive straight into the match.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <SnakeSkinAvatar skinId={skinId} size="xl" />
            <span className="text-[11px] font-bold text-cyan-400 mt-2">Active Serpent Avatar</span>
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
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <button
                id="randomize-username-btn"
                type="button"
                onClick={handleRandomize}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center"
                title="Random Name"
              >
                <Dices className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Starter Skin Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Choose Starter Skin
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="starter-skin-emerald"
                onClick={() => setSkinId('emerald_viper')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                  skinId === 'emerald_viper'
                    ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <SnakeSkinAvatar skinId="emerald_viper" size="md" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Emerald Viper</div>
                  <div className="text-[10px] text-emerald-400 font-medium">Verdant Hunter</div>
                </div>
              </button>

              <button
                type="button"
                id="starter-skin-neon"
                onClick={() => setSkinId('neon_cyber')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                  skinId === 'neon_cyber'
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <SnakeSkinAvatar skinId="neon_cyber" size="md" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Cyber Neon</div>
                  <div className="text-[10px] text-cyan-400 font-medium">Arcade Runner</div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="dive-straight-action-btn"
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>DIVE STRAIGHT INTO ACTION!</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
