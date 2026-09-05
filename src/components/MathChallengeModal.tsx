import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MathChallenge } from '../types';
import { sounds } from '../utils/soundEffects';
import { Clock, Zap, AlertTriangle, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface MathChallengeModalProps {
  challenge: MathChallenge | null;
  isMyTurn: boolean;
  activePlayerName: string;
  onSubmitAnswer: (answer: number) => void;
  onTimeout: () => void;
}

export const MathChallengeModal: React.FC<MathChallengeModalProps> = ({
  challenge,
  isMyTurn,
  activePlayerName: _activePlayerName,
  onSubmitAnswer,
  onTimeout,
}) => {
  if (!challenge || !isMyTurn) return null;

  const [timeLeft, setTimeLeft] = useState<number>(challenge.timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and run countdown
  useEffect(() => {
    setTimeLeft(challenge.timeLimit);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setFeedback(null);
    setCustomInput('');

    const startTime = Date.now();
    const durationMs = challenge.timeLimit * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!hasSubmitted && isMyTurn) {
          setHasSubmitted(true);
          setFeedback('timeout');
          sounds.playWrong();
          setTimeout(() => {
            onTimeout();
          }, 600);
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challenge.id]);

  const handleSelect = (ans: number) => {
    if (hasSubmitted || !isMyTurn) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(ans);
    setHasSubmitted(true);

    const isCorrect = ans === challenge.correctAnswer;
    if (isCorrect) {
      setFeedback('correct');
      sounds.playCorrect();
    } else {
      setFeedback('wrong');
      sounds.playWrong();
    }

    setTimeout(() => {
      onSubmitAnswer(ans);
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput || hasSubmitted || !isMyTurn) return;
    const num = parseInt(customInput, 10);
    if (!isNaN(num)) {
      handleSelect(num);
    }
  };

  const progressPercent = Math.max(0, (timeLeft / challenge.timeLimit) * 100);
  const timerColor =
    progressPercent > 50
      ? 'bg-emerald-500'
      : progressPercent > 25
      ? 'bg-amber-500'
      : 'bg-rose-500 animate-pulse';

  const isDiceChallenge = challenge.type === 'dice_move';
  const isSnakeChallenge = challenge.type === 'snake_bite';
  const isBonusChallenge = challenge.type === 'bonus_extra_throw';

  return (
    <AnimatePresence>
      <div
        id="math-challenge-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm"
      >
        <motion.div
          id="math-challenge-card"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl overflow-hidden relative ${
            isSnakeChallenge
              ? 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-rose-600/60'
              : isBonusChallenge
              ? 'bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-amber-500/70 shadow-amber-500/20'
              : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-cyan-500/50 shadow-cyan-500/10'
          }`}
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {isSnakeChallenge && (
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              )}
              {isBonusChallenge && (
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-bounce">
                  <Sparkles className="w-5 h-5" />
                </span>
              )}
              {isDiceChallenge && (
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Zap className="w-5 h-5" />
                </span>
              )}

              <div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                  {challenge.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Your turn to calculate!
                </p>
              </div>
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                progressPercent > 25
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft.toFixed(1)}s</span>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full ${timerColor} transition-all duration-100 ease-linear`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Context Explanation */}
          <div className="text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 mb-4 leading-relaxed">
            {isDiceChallenge && (
              <span>
                Move forward by solving: <strong>Tile {challenge.operand1}</strong> +{' '}
                <strong>Rolled {challenge.operand2}</strong>. Correct answer moves you to Tile{' '}
                {challenge.targetTileIfCorrect}!
              </span>
            )}
            {isSnakeChallenge && (
              <span>
                Bitten by snake! Calculate <strong>Head ({challenge.operand1})</strong> minus{' '}
                <strong>Tail ({challenge.operand2})</strong>. Solve correctly to unlock a{' '}
                <strong className="text-amber-300">BONUS QUESTION for an EXTRA DICE THROW!</strong>
              </span>
            )}
            {isBonusChallenge && (
              <span className="text-amber-200 font-medium">
                🔥 Quick mental math! Solve this bonus question correctly to win an{' '}
                <strong>IMMEDIATE EXTRA DICE THROW!</strong>
              </span>
            )}
          </div>

          {/* Big High-Contrast Math Formula */}
          <div className="text-center py-4 px-2 my-2 bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-inner">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-slate-100 flex items-center justify-center gap-3">
              <span className="text-cyan-300">{challenge.operand1}</span>
              <span className="text-amber-400 font-bold">{challenge.operator}</span>
              <span className="text-cyan-300">{challenge.operand2}</span>
              <span className="text-slate-400">=</span>
              <span className="text-amber-400 font-black animate-pulse">?</span>
            </div>
          </div>

          {/* Feedback Overlay if Submitted */}
          {feedback && (
            <div
              className={`my-3 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm ${
                feedback === 'correct'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : feedback === 'timeout'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500'
              }`}
            >
              {feedback === 'correct' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Correct! Answer is {challenge.correctAnswer}!</span>
                </>
              )}
              {feedback === 'wrong' && (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Incorrect! Correct answer was {challenge.correctAnswer}.</span>
                </>
              )}
              {feedback === 'timeout' && (
                <>
                  <Clock className="w-5 h-5 text-rose-400" />
                  <span>Time expired! Staying put.</span>
                </>
              )}
            </div>
          )}

          {/* 4 Large Mobile Touch Target Choices */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {challenge.options.map((option, idx) => {
              const isChosen = selectedAnswer === option;
              const isCorrect = option === challenge.correctAnswer;
              let btnStyle = 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700';

              if (hasSubmitted) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300';
                } else if (isChosen) {
                  btnStyle = 'bg-rose-600 text-white border-rose-400';
                } else {
                  btnStyle = 'bg-slate-800/40 text-slate-500 border-slate-800';
                }
              }

              return (
                <button
                  key={`${option}-${idx}`}
                  id={`math-option-btn-${option}`}
                  disabled={hasSubmitted || !isMyTurn}
                  onClick={() => handleSelect(option)}
                  className={`py-3.5 px-4 rounded-xl border text-xl sm:text-2xl font-black font-mono shadow-md transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px] ${btnStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Custom keypad manual entry form (in case user wants to type exact number) */}
          {!hasSubmitted && (
            <form onSubmit={handleCustomSubmit} className="mt-3 flex gap-2">
              <input
                id="math-custom-input"
                type="number"
                placeholder="Or type answer..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 text-slate-100 rounded-xl border border-slate-700 text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                id="math-custom-submit-btn"
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-sm transition-colors"
              >
                Submit
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
