import React from 'react';
import { ActionLogEntry } from '../types';
import { Activity, AlertTriangle, ArrowUpRight, Sparkles, Trophy } from 'lucide-react';

interface ActionFeedProps {
  logs: ActionLogEntry[];
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ logs }) => {
  const getLogIcon = (type: ActionLogEntry['type']) => {
    switch (type) {
      case 'snake_slide':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'ladder_climb':
        return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'bonus_award':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'win':
        return <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div
      id="game-action-feed"
      className="w-full bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Match Event Feed</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Live</span>
      </div>

      <div className="max-h-[85px] overflow-y-auto space-y-1.5 pr-1 text-xs">
        {logs.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic text-center py-2">
            Match is commencing... Roll the dice to begin!
          </div>
        ) : (
          logs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-1.5 text-[11px] leading-tight text-slate-300 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40"
            >
              {getLogIcon(log.type)}
              <span className="flex-1">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
