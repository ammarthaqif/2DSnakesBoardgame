import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamePlayer } from '../types';
import { SNAKES, LADDERS } from '../data/gameConstants';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface GameBoardProps {
  players: GamePlayer[];
  currentPlayerId: string;
  activeTurnPlayerId: string;
  targetTileHighlight?: number | null;
  onTileClick?: (tileNumber: number) => void;
}

interface MoveFxState {
  type: 'ladder' | 'snake' | 'step';
  text: string;
  timestamp: number;
}

// Convert tile number 1-100 to grid coordinate (col 0-9, rowFromTop 0-9)
export function getTileCoordinates(tile: number) {
  const safeTile = Math.max(1, Math.min(100, tile));
  const zeroIndex = safeTile - 1;
  const rowFromBottom = Math.floor(zeroIndex / 10);
  const remainder = zeroIndex % 10;
  const col = rowFromBottom % 2 === 0 ? remainder : 9 - remainder;
  const rowFromTop = 9 - rowFromBottom;
  return { col, rowFromTop, rowFromBottom };
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerId,
  activeTurnPlayerId,
  targetTileHighlight,
  onTileClick,
}) => {
  // Track previous player positions to detect moves, ladder climbs, and snake slides
  const prevPositionsRef = useRef<Map<string, number>>(new Map());
  const [playerFx, setPlayerFx] = useState<Record<string, MoveFxState>>({});

  useEffect(() => {
    players.forEach((p) => {
      const prevPos = prevPositionsRef.current.get(p.id);

      if (prevPos !== undefined && prevPos !== p.position) {
        // Check if landed on ladder
        const ladder = LADDERS.find((l) => l.bottom === prevPos && l.top === p.position);
        // Check if slid down snake
        const snake = SNAKES.find((s) => s.head === prevPos && s.tail === p.position);

        if (ladder) {
          sounds.playLadderClimb();
          setPlayerFx((prev) => ({
            ...prev,
            [p.id]: {
              type: 'ladder',
              text: `🪜 Climbed to ${ladder.top}!`,
              timestamp: Date.now(),
            },
          }));
        } else if (snake) {
          sounds.playSnakeBite();
          setPlayerFx((prev) => ({
            ...prev,
            [p.id]: {
              type: 'snake',
              text: `🐍 Slid to ${snake.tail}!`,
              timestamp: Date.now(),
            },
          }));
        } else {
          setPlayerFx((prev) => ({
            ...prev,
            [p.id]: {
              type: 'step',
              text: `Moved to ${p.position}`,
              timestamp: Date.now(),
            },
          }));
        }

        // Clear FX after 2 seconds
        setTimeout(() => {
          setPlayerFx((prev) => {
            const next = { ...prev };
            delete next[p.id];
            return next;
          });
        }, 2200);
      }

      prevPositionsRef.current.set(p.id, p.position);
    });
  }, [players]);

  // Generate the 100 tiles array in display order
  const tiles = useMemo(() => {
    const list = [];
    for (let r = 0; r < 10; r++) {
      const rowFromTop = r;
      const rowFromBottom = 9 - r;
      for (let c = 0; c < 10; c++) {
        const col = c;
        const remainder = rowFromBottom % 2 === 0 ? col : 9 - col;
        const tileNum = rowFromBottom * 10 + remainder + 1;
        list.push({
          tileNum,
          col,
          rowFromTop,
          isEven: (rowFromTop + col) % 2 === 0,
        });
      }
    }
    return list;
  }, []);

  // Map players by tile position for footprint dots
  const playersByTile = useMemo(() => {
    const map = new Map<number, GamePlayer[]>();
    players.forEach((p) => {
      const current = map.get(p.position) || [];
      current.push(p);
      map.set(p.position, current);
    });
    return map;
  }, [players]);

  return (
    <div
      id="snake-game-board-container"
      className="relative w-full max-w-[540px] aspect-square mx-auto select-none rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl shadow-emerald-950/20"
    >
      {/* 10x10 Board Grid */}
      <div className="relative w-full h-full grid grid-cols-10 grid-rows-10 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950">
        {tiles.map(({ tileNum, isEven }) => {
          const snakeAtHead = SNAKES.find((s) => s.head === tileNum);
          const snakeAtTail = SNAKES.find((s) => s.tail === tileNum);
          const ladderAtBottom = LADDERS.find((l) => l.bottom === tileNum);
          const ladderAtTop = LADDERS.find((l) => l.top === tileNum);
          const tilePlayers = playersByTile.get(tileNum) || [];
          const isTarget = targetTileHighlight === tileNum;
          const isGoal = tileNum === 100;
          const isStart = tileNum === 1;

          let bgClass = isEven ? 'bg-slate-900/90' : 'bg-slate-800/60';
          if (snakeAtHead) bgClass = 'bg-rose-950/40 border border-rose-800/40';
          if (ladderAtBottom) bgClass = 'bg-emerald-950/40 border border-emerald-800/40';
          if (isGoal) bgClass = 'bg-amber-950/50 border-2 border-amber-500/60';

          return (
            <div
              key={tileNum}
              id={`board-tile-${tileNum}`}
              onClick={() => onTileClick && onTileClick(tileNum)}
              className={`relative flex flex-col justify-between p-0.5 sm:p-1 border border-slate-800/50 transition-colors ${bgClass} ${
                isTarget ? 'ring-2 ring-amber-400 ring-inset bg-amber-500/20 animate-pulse' : ''
              }`}
            >
              {/* Tile Number Header */}
              <div className="flex items-center justify-between w-full leading-none">
                <span
                  className={`text-[9px] sm:text-[11px] font-bold font-mono tracking-tight ${
                    isGoal
                      ? 'text-amber-400 font-extrabold'
                      : snakeAtHead
                      ? 'text-rose-400'
                      : ladderAtBottom
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {tileNum}
                </span>

                {/* Subtle Mini Tag for Special Tiles */}
                {snakeAtHead && (
                  <span className="text-[8px] sm:text-[10px] text-rose-400 drop-shadow flex items-center gap-0.5">
                    🐍<span className="hidden sm:inline font-mono">-{snakeAtHead.head - snakeAtHead.tail}</span>
                  </span>
                )}
                {ladderAtBottom && (
                  <span className="text-[8px] sm:text-[10px] text-emerald-400 drop-shadow flex items-center gap-0.5">
                    🪜<span className="hidden sm:inline font-mono">+{ladderAtBottom.top - ladderAtBottom.bottom}</span>
                  </span>
                )}
                {isGoal && (
                  <span className="text-[9px] sm:text-[11px]">🏆</span>
                )}
                {isStart && (
                  <span className="text-[8px] font-semibold text-cyan-400 uppercase tracking-wider">Start</span>
                )}
              </div>

              {/* Center Snake / Ladder Indicator Details */}
              <div className="flex-1 flex items-center justify-center pointer-events-none">
                {snakeAtHead && (
                  <div className="text-center opacity-80">
                    <span className="text-[7px] sm:text-[8px] text-rose-300 font-semibold px-0.5 py-0.2 bg-rose-950/80 rounded border border-rose-800/60">
                      Tail:{snakeAtHead.tail}
                    </span>
                  </div>
                )}
                {ladderAtBottom && (
                  <div className="text-center opacity-80">
                    <span className="text-[7px] sm:text-[8px] text-emerald-300 font-semibold px-0.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-800/60">
                      Top:{ladderAtBottom.top}
                    </span>
                  </div>
                )}
                {snakeAtTail && !snakeAtHead && (
                  <div className="text-center opacity-40">
                    <span className="text-[7px] text-slate-400">Tail</span>
                  </div>
                )}
                {ladderAtTop && !ladderAtBottom && (
                  <div className="text-center opacity-40">
                    <span className="text-[7px] text-slate-400">Top</span>
                  </div>
                )}
              </div>

              {/* Tile Footprint Dots for resident pawns */}
              <div className="h-2 flex items-center justify-center gap-0.5 pointer-events-none">
                {tilePlayers.map((p) => {
                  const pIndex = players.findIndex((pl) => pl.id === p.id);
                  const dotColors = [
                    'bg-cyan-400 ring-cyan-300 shadow-cyan-400',
                    'bg-amber-400 ring-amber-300 shadow-amber-400',
                    'bg-emerald-400 ring-emerald-300 shadow-emerald-400',
                    'bg-purple-400 ring-purple-300 shadow-purple-400',
                  ];
                  const dotClass = dotColors[(pIndex >= 0 ? pIndex : 0) % dotColors.length];
                  return (
                    <div
                      key={`footprint-${p.id}`}
                      className={`w-1.5 h-1.5 rounded-full ring-1 shadow-sm ${dotClass}`}
                      title={`${p.username}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* FLOATING PAWNS OVERLAY LAYER: Smooth Transitions across Tiles, Ladders & Snakes */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
          {players.map((p) => {
            const isTurn = p.id === activeTurnPlayerId;
            const isMe = p.id === currentPlayerId;
            const fx = playerFx[p.id];

            const { col, rowFromTop } = getTileCoordinates(p.position);

            // Stagger multiple players on the same tile
            const playersOnSameTile = players.filter((other) => other.position === p.position);
            const indexOnTile = playersOnSameTile.findIndex((other) => other.id === p.id);
            const totalOnTile = playersOnSameTile.length;

            let offsetXPercent = 0;
            let offsetYPercent = 0;
            if (totalOnTile === 2) {
              offsetXPercent = indexOnTile === 0 ? -1.8 : 1.8;
              offsetYPercent = indexOnTile === 0 ? -1.5 : 1.5;
            } else if (totalOnTile >= 3) {
              const angle = (indexOnTile / totalOnTile) * 2 * Math.PI;
              offsetXPercent = Math.cos(angle) * 2.2;
              offsetYPercent = Math.sin(angle) * 2.2;
            }

            const targetX = (col + 0.5) * 10 + offsetXPercent;
            const targetY = (rowFromTop + 0.5) * 10 + offsetYPercent;

            // Motion characteristics customized per movement type
            const isLadder = fx?.type === 'ladder';
            const isSnake = fx?.type === 'snake';

            const transitionConfig = isLadder
              ? {
                  duration: 1.1,
                  ease: [0.25, 1, 0.5, 1], // Upward soar
                }
              : isSnake
              ? {
                  duration: 1.3,
                  ease: 'easeInOut', // Slither slide
                }
              : {
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                };

            return (
              <motion.div
                key={p.id}
                initial={false}
                animate={{
                  left: `${targetX}%`,
                  top: `${targetY}%`,
                  scale: isLadder ? [1, 1.4, 1] : isSnake ? [1, 0.85, 1.2, 1] : isTurn ? [1, 1.12, 1] : 1,
                  rotate: isSnake ? [0, -20, 20, -14, 14, 0] : isLadder ? [0, -8, 8, 0] : 0,
                  zIndex: isTurn ? 40 : 30,
                }}
                transition={{
                  left: transitionConfig,
                  top: transitionConfig,
                  scale: {
                    duration: isLadder ? 1.1 : isSnake ? 1.3 : 1.6,
                    repeat: isTurn && !isLadder && !isSnake ? Infinity : 0,
                  },
                  rotate: {
                    duration: isSnake ? 1.3 : 0.8,
                  },
                }}
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-auto flex flex-col items-center cursor-pointer"
                title={`${p.username} (Tile ${p.position})`}
              >
                {/* Floating Special Move Banner (Ladder Climb / Snake Slide) */}
                <AnimatePresence>
                  {fx && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.7 }}
                      animate={{ opacity: 1, y: -26, scale: 1 }}
                      exit={{ opacity: 0, y: -34, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border shadow-xl flex items-center gap-1 z-50 ${
                        isLadder
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-amber-500/50'
                          : isSnake
                          ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white border-rose-300 shadow-rose-600/50'
                          : 'bg-slate-900/90 text-cyan-300 border-cyan-500/50'
                      }`}
                    >
                      {isLadder && <Sparkles className="w-2.5 h-2.5 animate-spin" />}
                      {isSnake && <AlertTriangle className="w-2.5 h-2.5 animate-bounce" />}
                      <span>{fx.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avatar with Glow Rings */}
                {(() => {
                  const pIndex = players.findIndex((pl) => pl.id === p.id);
                  const playerColors = [
                    { ring: 'ring-cyan-400', shadow: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]', label: 'bg-cyan-950/90 text-cyan-300 border-cyan-800' },
                    { ring: 'ring-amber-400', shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]', label: 'bg-amber-950/90 text-amber-300 border-amber-800' },
                    { ring: 'ring-emerald-400', shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]', label: 'bg-emerald-950/90 text-emerald-300 border-emerald-800' },
                    { ring: 'ring-purple-400', shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]', label: 'bg-purple-950/90 text-purple-300 border-purple-800' },
                  ];
                  const pStyle = playerColors[(pIndex >= 0 ? pIndex : 0) % playerColors.length];

                  return (
                    <>
                      <div
                        className={`relative rounded-full transition-shadow ${
                          isLadder
                            ? 'shadow-[0_0_25px_rgba(251,191,36,0.9)] ring-2 ring-amber-400'
                            : isSnake
                            ? 'shadow-[0_0_25px_rgba(244,63,94,0.9)] ring-2 ring-rose-500 animate-pulse'
                            : isTurn
                            ? 'shadow-[0_0_18px_rgba(251,191,36,0.8)] ring-2 ring-amber-400 animate-pulse'
                            : `ring-1.5 ${pStyle.ring} ${pStyle.shadow}`
                        }`}
                      >
                        <SnakeSkinAvatar skinId={p.skinId} size="sm" />

                        {/* Active Turn Dice Floating Badge */}
                        {isTurn && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute -top-1.5 -right-1.5 text-[8px] bg-amber-400 text-slate-950 font-black rounded-full w-3.5 h-3.5 flex items-center justify-center border border-amber-200 shadow-md"
                          >
                            🎲
                          </motion.div>
                        )}
                      </div>

                      {/* Player Mini Name Label */}
                      <span
                        className={`mt-0.5 px-1 py-0.2 rounded text-[7px] font-bold font-mono tracking-tight shadow truncate max-w-[50px] border ${
                          isTurn
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                            : pStyle.label
                        }`}
                      >
                        {isMe ? 'You' : p.username}
                      </span>
                    </>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>

        {/* SVG Overlay: Smooth Curved Serpents & Golden Ladders */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradients for snakes */}
            {SNAKES.map((snake) => (
              <linearGradient
                key={`grad-${snake.id}`}
                id={`grad-${snake.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={snake.color} stopOpacity="0.95" />
                <stop offset="50%" stopColor={snake.color} stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.6" />
              </linearGradient>
            ))}

            {/* Filter for glowing serpents */}
            <filter id="snake-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            {/* Filter for golden ladders */}
            <filter id="ladder-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Draw Ladders First */}
          {LADDERS.map((ladder) => {
            const start = getTileCoordinates(ladder.bottom);
            const end = getTileCoordinates(ladder.top);

            const x1 = (start.col + 0.5) * 100;
            const y1 = (start.rowFromTop + 0.5) * 100;
            const x2 = (end.col + 0.5) * 100;
            const y2 = (end.rowFromTop + 0.5) * 100;

            // Compute perpendicular offset for two rails
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = (-dy / len) * 7;
            const ny = (dx / len) * 7;

            // Rungs count
            const rungs = Math.max(3, Math.floor(len / 18));

            return (
              <g key={`ladder-svg-${ladder.id}`} filter="url(#ladder-shadow)">
                {/* Left Rail */}
                <line
                  x1={x1 + nx}
                  y1={y1 + ny}
                  x2={x2 + nx}
                  y2={y2 + ny}
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Right Rail */}
                <line
                  x1={x1 - nx}
                  y1={y1 - ny}
                  x2={x2 - nx}
                  y2={y2 - ny}
                  stroke="#d97706"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Wooden / Golden Rungs */}
                {Array.from({ length: rungs }).map((_, idx) => {
                  const t = (idx + 1) / (rungs + 1);
                  const rx = x1 + dx * t;
                  const ry = y1 + dy * t;
                  return (
                    <line
                      key={`rung-${ladder.id}-${idx}`}
                      x1={rx + nx}
                      y1={ry + ny}
                      x2={rx - nx}
                      y2={ry - ny}
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Draw Serpents with Slithering Bezier Curves */}
          {SNAKES.map((snake, index) => {
            const head = getTileCoordinates(snake.head);
            const tail = getTileCoordinates(snake.tail);

            const hx = (head.col + 0.5) * 100;
            const hy = (head.rowFromTop + 0.5) * 100;
            const tx = (tail.col + 0.5) * 100;
            const ty = (tail.rowFromTop + 0.5) * 100;

            // Create curved spine for serpent
            const midX = (hx + tx) / 2 + (index % 2 === 0 ? 35 : -35);
            const midY = (hy + ty) / 2;

            const pathD = `M ${hx} ${hy} Q ${midX} ${midY} ${tx} ${ty}`;

            return (
              <g key={`snake-svg-${snake.id}`} filter="url(#snake-glow)">
                {/* Outer Shadow Border */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#020617"
                  strokeWidth="11"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Body Spine */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={`url(#grad-${snake.id})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Decorative Serpent Scale Spots */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                  strokeDasharray="4 8"
                  strokeLinecap="round"
                  opacity="0.65"
                />

                {/* Snake Head with Eyes */}
                <circle cx={hx} cy={hy} r="9" fill={snake.color} stroke="#fef08a" strokeWidth="1.5" />
                <circle cx={hx - 3} cy={hy - 2} r="1.8" fill="#ffffff" />
                <circle cx={hx + 3} cy={hy - 2} r="1.8" fill="#ffffff" />
                <circle cx={hx - 3} cy={hy - 2} r="0.9" fill="#0f172a" />
                <circle cx={hx + 3} cy={hy - 2} r="0.9" fill="#0f172a" />

                {/* Snake Tail Tip */}
                <circle cx={tx} cy={ty} r="4" fill={snake.color} opacity="0.9" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
