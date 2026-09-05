import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Zap, Award, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { MilestoneToast } from '../types';

interface MilestoneToastContainerProps {
  toasts: MilestoneToast[];
  onDismiss?: (id: string) => void;
}

export const MilestoneToastContainer: React.FC<MilestoneToastContainerProps> = ({ toasts }) => {
  return (
    <div
      id="milestone-toast-container"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 max-w-sm w-full px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isStreak = toast.type === 'streak' || toast.icon === 'flame';
          const isTrophy = toast.icon === 'trophy';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`w-full rounded-2xl p-3 shadow-2xl backdrop-blur-md border pointer-events-auto flex items-center gap-3 relative overflow-hidden ${
                isStreak
                  ? 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-orange-950/95 border-amber-500/80 shadow-amber-500/25 ring-1 ring-amber-400/40'
                  : isTrophy
                  ? 'bg-gradient-to-r from-yellow-950/95 via-slate-900/95 to-amber-950/95 border-yellow-400/80 shadow-yellow-500/25 ring-1 ring-yellow-400/40'
                  : 'bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-blue-950/95 border-cyan-500/80 shadow-cyan-500/25 ring-1 ring-cyan-400/40'
              }`}
            >
              {/* Pulsing side aura */}
              <div
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  isStreak
                    ? 'bg-gradient-to-b from-amber-400 to-orange-500'
                    : isTrophy
                    ? 'bg-gradient-to-b from-yellow-300 to-amber-500'
                    : 'bg-gradient-to-b from-cyan-400 to-emerald-400'
                }`}
              />

              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                  isStreak
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 animate-bounce'
                    : isTrophy
                    ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                    : 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                }`}
              >
                {isStreak ? (
                  <Flame className="w-5 h-5 fill-amber-400 text-amber-300" />
                ) : isTrophy ? (
                  <Trophy className="w-5 h-5 fill-yellow-400 text-yellow-300" />
                ) : toast.icon === 'zap' ? (
                  <Zap className="w-5 h-5 fill-cyan-400 text-cyan-300" />
                ) : toast.icon === 'shield' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : toast.icon === 'ladder' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Award className="w-5 h-5 text-cyan-300" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border flex items-center gap-1 ${
                      isStreak
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : isTrophy
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <Sparkles className="w-2 h-2" />
                    <span>Match Milestone</span>
                  </span>
                </div>
                <div className="text-xs font-black text-slate-100 tracking-tight mt-0.5 truncate">
                  {toast.title}
                </div>
                <div className="text-[11px] text-slate-300 line-clamp-1 leading-snug">
                  {toast.message}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
