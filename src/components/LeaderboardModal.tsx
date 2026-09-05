import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Target, Award, Sparkles, RefreshCw } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';

interface LeaderboardModalProps {
  leaderboard: LeaderboardEntry[];
  currentUsername: string;
  onRefresh: () => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  leaderboard,
  currentUsername,
  onRefresh,
  onClose,
}) => {
  const [tab, setTab] = useState<'trophies' | 'season' | 'accuracy'>('trophies');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortedList = [...leaderboard].sort((a, b) => {
    if (tab === 'trophies') return b.trophies - a.trophies;
    if (tab === 'season') return b.seasonPoints - a.seasonPoints;
    return b.mathAccuracy - a.mathAccuracy;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return (
      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
        {rank}
      </span>
    );
  };

  return (
    <div
      id="leaderboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm"
    >
      <motion.div
        id="leaderboard-card"
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Global Leaderboards</h2>
              <p className="text-xs text-slate-400">Track player rankings, trophies & math accuracy</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="refresh-leaderboard-btn"
              onClick={handleRefresh}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Refresh rankings"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              id="close-leaderboard-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 my-3 p-1 bg-slate-950/70 rounded-2xl border border-slate-800/80">
          <button
            id="tab-leaderboard-trophies"
            onClick={() => setTab('trophies')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'trophies'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Trophies</span>
          </button>
          <button
            id="tab-leaderboard-season"
            onClick={() => setTab('season')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'season'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Season 1 Cup</span>
          </button>
          <button
            id="tab-leaderboard-accuracy"
            onClick={() => setTab('accuracy')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'accuracy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Math Accuracy</span>
          </button>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedList.map((entry, idx) => {
            const displayRank = idx + 1;
            const isCurrentUser = entry.username.toLowerCase() === currentUsername.toLowerCase();

            return (
              <div
                key={entry.id}
                id={`leaderboard-row-${entry.username}`}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {getRankBadge(displayRank)}
                  </div>
                  <SnakeSkinAvatar skinId={entry.skinId} size="md" showCrown={displayRank === 1} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {entry.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{entry.tier}</span>
                      <span>•</span>
                      <span>{entry.matchesWon} Wins</span>
                    </div>
                  </div>
                </div>

                {/* Right: Metric Value */}
                <div className="text-right shrink-0">
                  {tab === 'trophies' && (
                    <div>
                      <span className="text-sm font-extrabold text-amber-400 font-mono">
                        {entry.trophies.toLocaleString()}
                      </span>
                      <div className="text-[9px] text-slate-400 font-medium">Trophies</div>
                    </div>
                  )}
                  {tab === 'season' && (
                    <div>
                      <span className="text-sm font-extrabold text-cyan-400 font-mono">
                        {entry.seasonPoints.toLocaleString()}
                      </span>
                      <div className="text-[9px] text-slate-400 font-medium">Points</div>
                    </div>
                  )}
                  {tab === 'accuracy' && (
                    <div>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        {entry.mathAccuracy}%
                      </span>
                      <div className="text-[9px] text-slate-400 font-medium">Accuracy</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-2 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Top 3 players win exclusive Mythic Snake Skins at season end!</span>
        </div>
      </motion.div>
    </div>
  );
};
