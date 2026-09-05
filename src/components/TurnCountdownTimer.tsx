import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, Zap, Flame } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface TurnCountdownTimerProps {
  durationSeconds: number; // e.g., 5 or 10
  isMyTurn: boolean;
  activePlayerName: string;
  isAnsweringMath: boolean;
  turnKey: string; // Unique key when turn or challenge switches to reset timer
  onTimeout?: () => void;
}

export const TurnCountdownTimer: React.FC<TurnCountdownTimerProps> = ({
  durationSeconds,
  isMyTurn,
  activePlayerName,
  isAnsweringMath,
  turnKey,
  onTimeout,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const totalDurationRef = useRef<number>(durationSeconds);
  const lastTickSecondRef = useRef<number>(-1);
  const timeoutTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    totalDurationRef.current = durationSeconds;
    setTimeLeft(durationSeconds);
    lastTickSecondRef.current = -1;
    timeoutTriggeredRef.current = false;

    const startTime = Date.now();
    const durationMs = durationSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeLeft(remaining);

      // Play audio ticks during the final 3 seconds
      const currentIntSec = Math.ceil(remaining);
      if (currentIntSec <= 3 && currentIntSec > 0 && currentIntSec !== lastTickSecondRef.current) {
        lastTickSecondRef.current = currentIntSec;
        sounds.playTick(true);
      } else if (currentIntSec > 3 && currentIntSec !== lastTickSecondRef.current && currentIntSec % 2 === 0) {
        lastTickSecondRef.current = currentIntSec;
        sounds.playTick(false);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          if (onTimeout) {
            onTimeout();
          }
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [turnKey, durationSeconds]);

  const total = totalDurationRef.current || 10;
  const ratio = Math.max(0, Math.min(1, timeLeft / total));
  const percent = ratio * 100;

  // Visual urgency phases
  const isCritical = timeLeft <= 3.0 && timeLeft > 0;
  const isWarning = timeLeft <= 5.0 && timeLeft > 3.0;

  // SVG circular gauge geometry
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  // Color tokens
  const ringColor = isCritical
    ? '#f43f5e' // Rose-500
    : isWarning
    ? '#f59e0b' // Amber-500
    : '#10b981'; // Emerald-500

  const badgeBg = isCritical
    ? 'bg-rose-950/80 border-rose-600/70 text-rose-300 shadow-rose-950/50'
    : isWarning
    ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-amber-950/50'
    : 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-slate-950/50';

  return (
    <motion.div
      id="in-game-turn-countdown-timer"
      animate={
        isCritical
          ? { scale: [1, 1.05, 1], y: [0, -1, 0] }
          : { scale: 1, y: 0 }
      }
      transition={{
        repeat: isCritical ? Infinity : 0,
        duration: 0.6,
        ease: 'easeInOut',
      }}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-2xl border shadow-lg transition-colors ${badgeBg}`}
    >
      {/* Circular Progress Meter */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          {/* Background Track */}
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="transparent"
            className="text-slate-800/80"
          />
          {/* Dynamic Depleting Arc */}
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke={ringColor}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.08s linear' }}
          />
        </svg>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isCritical ? (
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          ) : isAnsweringMath ? (
            <Zap className="w-3 h-3 text-cyan-400" />
          ) : (
            <Clock className="w-3 h-3 text-slate-400" />
          )}
        </div>
      </div>

      {/* Time & Turn Labels */}
      <div className="flex flex-col text-left leading-tight pr-1">
        <div className="flex items-center gap-1">
          <span
            className={`font-mono text-xs font-black tracking-tight ${
              isCritical
                ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                : isWarning
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {timeLeft.toFixed(1)}s
          </span>

          {isCritical && (
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400 animate-bounce" />
          )}
        </div>

        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              isCritical
                ? 'bg-rose-500 animate-ping'
                : isMyTurn
                ? 'bg-emerald-400'
                : 'bg-cyan-400'
            }`}
          />
          <span className="truncate max-w-[75px] sm:max-w-[110px]">
            {isMyTurn ? (isAnsweringMath ? 'Solve Now!' : 'Your Move') : activePlayerName}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
