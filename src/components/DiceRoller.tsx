import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dices, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface DiceRollerProps {
  diceValue: number | null;
  isMyTurn: boolean;
  disabled: boolean;
  extraTurnAwarded?: boolean;
  onRoll: () => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  diceValue,
  isMyTurn,
  disabled,
  extraTurnAwarded = false,
  onRoll,
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleRollClick = () => {
    if (disabled || !isMyTurn || isRolling) return;
    setIsRolling(true);
    sounds.playDiceRoll();

    setTimeout(() => {
      setIsRolling(false);
      onRoll();
    }, 400);
  };

  // Dot patterns for dice faces 1 to 6
  const renderDiceDots = (value: number) => {
    const dotPositions: Record<number, string[]> = {
      1: ['col-start-2 row-start-2'],
      2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
      3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
      4: [
        'col-start-1 row-start-1',
        'col-start-3 row-start-1',
        'col-start-1 row-start-3',
        'col-start-3 row-start-3',
      ],
      5: [
        'col-start-1 row-start-1',
        'col-start-3 row-start-1',
        'col-start-2 row-start-2',
        'col-start-1 row-start-3',
        'col-start-3 row-start-3',
      ],
      6: [
        'col-start-1 row-start-1',
        'col-start-3 row-start-1',
        'col-start-1 row-start-2',
        'col-start-3 row-start-2',
        'col-start-1 row-start-3',
        'col-start-3 row-start-3',
      ],
    };

    const positions = dotPositions[value] || dotPositions[1];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-1.5 gap-0.5">
        {positions.map((posClass, idx) => (
          <div
            key={idx}
            className={`w-2.5 h-2.5 rounded-full bg-slate-950 shadow-inner ${posClass} place-self-center`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      id="dice-roller-controls"
      className="flex items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl"
    >
      {/* Visual Dice Display */}
      <div className="flex items-center gap-2.5">
        <motion.div
          id="dice-visual-cube"
          animate={
            isRolling
              ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 0.9, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.4 }}
          className="w-13 h-13 rounded-xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 border-2 border-amber-500/80 shadow-lg shadow-amber-500/20 flex items-center justify-center select-none"
        >
          {diceValue ? (
            renderDiceDots(diceValue)
          ) : (
            <Dices className="w-7 h-7 text-amber-900" />
          )}
        </motion.div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {extraTurnAwarded ? (
              <span className="text-amber-400 flex items-center gap-1 font-extrabold animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> Extra Throw!
              </span>
            ) : isMyTurn ? (
              <span className="text-emerald-400 font-bold">Your Turn</span>
            ) : (
              'Opponent Turn'
            )}
          </div>
          <div className="text-sm font-extrabold text-slate-100 font-mono">
            {diceValue ? `Rolled ${diceValue}` : 'Ready to Roll'}
          </div>
        </div>
      </div>

      {/* Throw Button */}
      <button
        id="roll-dice-action-btn"
        disabled={disabled || !isMyTurn || isRolling}
        onClick={handleRollClick}
        className={`px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center gap-2 select-none active:scale-95 ${
          extraTurnAwarded
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/30'
            : isMyTurn && !disabled
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-emerald-500/30'
            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        <Dices className="w-4 h-4" />
        <span>{extraTurnAwarded ? 'FREE ROLL!' : 'ROLL DICE'}</span>
      </button>
    </div>
  );
};
