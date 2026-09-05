import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Award, Sparkles } from 'lucide-react';
import { GamePlayer } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';

interface GameOverModalProps {
  winner: GamePlayer;
  isCurrentUserWinner: boolean;
  isTournament: boolean;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  isCurrentUserWinner,
  isTournament,
  onPlayAgain,
  onLeaveRoom,
}) => {
  useEffect(() => {
    sounds.playWin();

    // Trigger celebratory confetti fireworks
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch {
      // confetti fallback
    }
  }, []);

  return (
    <div
      id="game-over-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md"
    >
      <motion.div
        id="game-over-card"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 text-center flex flex-col items-center"
      >
        {/* Trophy Header */}
        <div className="relative mb-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Trophy className="w-9 h-9" />
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-bounce">👑</span>
        </div>

        <h2 className="text-xl font-black text-slate-100 tracking-tight">
          {isCurrentUserWinner ? 'VICTORY! YOU REACHED TILE 100!' : `${winner.username} WON THE MATCH!`}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {isCurrentUserWinner
            ? 'Exceptional mental math and agile board navigation!'
            : 'Well fought! Hone your arithmetic speed and try another round.'}
        </p>

        {/* Winner Showcase */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 w-full flex items-center justify-center gap-3">
          <SnakeSkinAvatar skinId={winner.skinId} size="lg" showCrown={true} />
          <div className="text-left">
            <div className="text-sm font-bold text-slate-200">{winner.username}</div>
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Boardgame Grandmaster</span>
            </div>
          </div>
        </div>

        {/* Rewards Earned */}
        <div className="w-full grid grid-cols-2 gap-2 mb-5">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Trophies Earned</div>
            <div className="text-base font-extrabold text-amber-400 font-mono">
              {isCurrentUserWinner ? '+25 Trophies' : '+5 Trophies'}
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Season Points</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCurrentUserWinner ? (isTournament ? '+60 PTS' : '+40 PTS') : '+15 PTS'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
          <button
            id="return-lobby-btn"
            onClick={onLeaveRoom}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
