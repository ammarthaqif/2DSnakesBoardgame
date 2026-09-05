import React from 'react';
import { motion } from 'motion/react';
import { X, Flame, Award, Calendar, Swords, Sparkles, CheckCircle2 } from 'lucide-react';
import { TournamentEvent } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';

interface TournamentModalProps {
  tournament: TournamentEvent;
  onEnterTournament: () => void;
  onClose: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  tournament,
  onEnterTournament,
  onClose,
}) => {
  const percentProgress = Math.min(100, (tournament.currentPoints / tournament.targetPoints) * 100);

  return (
    <div
      id="tournament-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm"
    >
      <motion.div
        id="tournament-modal-card"
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Flame className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Active Event
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {tournament.endDate}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">{tournament.title}</h2>
            </div>
          </div>
          <button
            id="close-tournament-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1">
          {/* Banner Hero */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-950 to-slate-900 border border-amber-500/40 relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  {tournament.subtitle}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tournament.description}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <SnakeSkinAvatar skinId={tournament.prizeSkinId} size="lg" showCrown={true} />
                <span className="text-[9px] font-bold text-amber-400 mt-1">Grand Prize</span>
              </div>
            </div>
          </div>

          {/* Tournament Special Rules */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tournament Rules & Modifiers</span>
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Speed Math Bonus:</strong> Solve under 4 seconds to earn +20 bonus Season Points!
                </span>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Snake Bite Escape:</strong> Solve snake difference math & bonus question to unlock extra throws & 2x ranking points!
                </span>
              </div>
            </div>
          </div>

          {/* User Tournament Progress */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Your Season Ranking</span>
              <span className="font-mono font-bold text-amber-400">Rank #{tournament.userRank}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Season Milestone Points</span>
              <span className="font-mono font-bold text-cyan-400">
                {tournament.currentPoints} / {tournament.targetPoints} PTS
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${percentProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Reach {tournament.targetPoints} points to automatically unlock the Cosmic Serpent Mythic Skin!
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800">
          <button
            id="enter-tournament-btn"
            onClick={() => {
              onEnterTournament();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Swords className="w-4 h-4" />
            <span>PLAY TOURNAMENT MATCH</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
