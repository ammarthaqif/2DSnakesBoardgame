import { MathChallenge, MathDifficulty } from '../types';

function generateOptions(correctAnswer: number, difficulty: MathDifficulty = 'medium'): number[] {
  const options = new Set<number>([correctAnswer]);

  let deltas: number[];
  if (difficulty === 'easy') {
    // Distinct, clearly spaced distractors
    deltas = [-10, 10, -5, 5, -8, 8, -12, 12, 4, -4];
  } else if (difficulty === 'hard') {
    // Very tight, tricky distractors (off-by-one, transposition, common mental arithmetic traps)
    deltas = [-1, 1, -2, 2, -10, 10, -9, 9, -11, 11];
  } else {
    // Medium: standard balanced distractors
    deltas = [-3, -2, -1, 1, 2, 3, -10, 10, -5, 5];
  }

  deltas.sort(() => Math.random() - 0.5);

  for (const delta of deltas) {
    const candidate = correctAnswer + delta;
    if (candidate >= 0 && candidate !== correctAnswer) {
      options.add(candidate);
    }
    if (options.size >= 4) break;
  }

  // Fallback if not enough unique options
  let fallback = 1;
  while (options.size < 4) {
    const candidate = Math.max(1, correctAnswer + fallback);
    if (!options.has(candidate)) {
      options.add(candidate);
    }
    fallback++;
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

export function createDiceRollChallenge(
  playerId: string,
  currentTile: number,
  rolledDice: number,
  timeLimit: number = 10,
  difficulty: MathDifficulty = 'medium'
): MathChallenge {
  const targetTile = Math.min(100, currentTile + rolledDice);

  let questionText = `${currentTile} + ${rolledDice} = ?`;
  let promptText = `Current Tile (${currentTile}) + Rolled Dice (${rolledDice})`;
  let correctAnswer = currentTile + rolledDice;
  let op1 = currentTile;
  let op2 = rolledDice;
  let operator: '+' | '-' | '×' = '+';

  if (difficulty === 'easy') {
    // Easy: standard clean addition with friendly numbers
    questionText = `${currentTile} + ${rolledDice} = ?`;
    promptText = `Tile ${currentTile} + Roll ${rolledDice}`;
    correctAnswer = currentTile + rolledDice;
  } else if (difficulty === 'hard') {
    // Hard: multi-term mental arithmetic challenge to test speed
    const hardVariants = ['extra_add', 'sub_mod', 'double_bonus'];
    const chosenVariant = hardVariants[Math.floor(Math.random() * hardVariants.length)];

    if (chosenVariant === 'extra_add') {
      const extra = Math.floor(Math.random() * 9) + 4; // 4 to 12
      correctAnswer = currentTile + rolledDice + extra;
      questionText = `(${currentTile} + ${rolledDice}) + ${extra} = ?`;
      promptText = `Hard Mode: Solve (${currentTile} + ${rolledDice}) + ${extra}`;
    } else if (chosenVariant === 'sub_mod' && currentTile + rolledDice > 8) {
      const sub = Math.floor(Math.random() * 6) + 2; // 2 to 7
      correctAnswer = currentTile + rolledDice - sub;
      questionText = `(${currentTile} + ${rolledDice}) - ${sub} = ?`;
      promptText = `Hard Mode: Solve (${currentTile} + ${rolledDice}) - ${sub}`;
    } else {
      const multiplier = 2;
      correctAnswer = (currentTile + rolledDice) * multiplier;
      questionText = `(${currentTile} + ${rolledDice}) × ${multiplier} = ?`;
      promptText = `Hard Mode: Double (${currentTile} + ${rolledDice})`;
    }
  }

  const options = generateOptions(correctAnswer, difficulty);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'dice_move',
    title: difficulty === 'hard' ? '⚡ Hard Mental Math Challenge' : difficulty === 'easy' ? '🌱 Easy Dice Math' : 'Dice Roll Math Challenge',
    description: 'Solve correctly within the timer to advance your snake to the tile!',
    prompt: promptText,
    questionText,
    operand1: op1,
    operand2: op2,
    operator,
    correctAnswer,
    options,
    timeLimit,
    startedAt: Date.now(),
    forPlayerId: playerId,
    targetTileIfCorrect: targetTile,
    targetTileIfWrong: currentTile,
    rolledValue: rolledDice,
    difficulty,
  };
}

export function createSnakeBiteChallenge(
  playerId: string,
  snakeHead: number,
  snakeTail: number,
  timeLimit: number = 10,
  difficulty: MathDifficulty = 'medium'
): MathChallenge {
  const baseDiff = snakeHead - snakeTail;
  let correctAnswer = baseDiff;
  let questionText = `${snakeHead} - ${snakeTail} = ?`;
  let promptText = `Snake Head (${snakeHead}) - Snake Tail (${snakeTail})`;

  if (difficulty === 'easy') {
    // Easy: straightforward difference
    questionText = `${snakeHead} - ${snakeTail} = ?`;
    promptText = `Bitten! Difference: ${snakeHead} - ${snakeTail}`;
    correctAnswer = baseDiff;
  } else if (difficulty === 'hard') {
    // Hard: scaled difference operation
    const mod = Math.floor(Math.random() * 12) + 5;
    const isMultiply = baseDiff <= 25 && Math.random() < 0.5;

    if (isMultiply) {
      correctAnswer = baseDiff * 2;
      questionText = `(${snakeHead} - ${snakeTail}) × 2 = ?`;
      promptText = `Hard Mode: Double the Bite (${snakeHead} - ${snakeTail}) × 2`;
    } else {
      correctAnswer = baseDiff + mod;
      questionText = `(${snakeHead} - ${snakeTail}) + ${mod} = ?`;
      promptText = `Hard Mode: Escape formula (${snakeHead} - ${snakeTail}) + ${mod}`;
    }
  }

  const options = generateOptions(correctAnswer, difficulty);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'snake_bite',
    title: difficulty === 'hard' ? '🔥 Hard Snake Bite Challenge!' : 'Snake Bite Escape Challenge!',
    description: 'Bitten by the snake! Solve the escape formula to unlock a Bonus Question for an EXTRA DICE THROW!',
    prompt: promptText,
    questionText,
    operand1: snakeHead,
    operand2: snakeTail,
    operator: '-',
    correctAnswer,
    options,
    timeLimit,
    startedAt: Date.now(),
    forPlayerId: playerId,
    targetTileIfCorrect: snakeTail,
    targetTileIfWrong: snakeTail,
    snakeHead,
    snakeTail,
    difficulty,
  };
}

export function createBonusThrowChallenge(
  playerId: string,
  timeLimit: number = 8,
  difficulty: MathDifficulty = 'medium'
): MathChallenge {
  let op1: number;
  let op2: number;
  let op: '+' | '-' | '×';
  let ans: number;
  let questionText: string;

  if (difficulty === 'easy') {
    // Easy: basic single-digit additions, subtractions or light multiplication
    const mode = Math.random() < 0.5 ? 'add' : 'mult';
    if (mode === 'add') {
      op1 = Math.floor(Math.random() * 12) + 3;
      op2 = Math.floor(Math.random() * 10) + 2;
      op = '+';
      ans = op1 + op2;
      questionText = `${op1} + ${op2} = ?`;
    } else {
      op1 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      op2 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      op = '×';
      ans = op1 * op2;
      questionText = `${op1} × ${op2} = ?`;
    }
  } else if (difficulty === 'hard') {
    // Hard: double-digit multiplications or chained mental calculations
    const hardMode = Math.random() < 0.6 ? 'multi_chain' : 'big_mult';
    if (hardMode === 'big_mult') {
      op1 = Math.floor(Math.random() * 9) + 11; // 11 to 19
      op2 = Math.floor(Math.random() * 8) + 4;  // 4 to 11
      op = '×';
      ans = op1 * op2;
      questionText = `${op1} × ${op2} = ?`;
    } else {
      op1 = Math.floor(Math.random() * 6) + 12; // 12 to 17
      op2 = Math.floor(Math.random() * 5) + 3;  // 3 to 7
      const offset = Math.floor(Math.random() * 15) + 10;
      op = '×';
      ans = op1 * op2 - offset;
      questionText = `(${op1} × ${op2}) - ${offset} = ?`;
    }
  } else {
    // Medium: standard grade-school operations
    const types: ('mult' | 'add' | 'sub')[] = ['mult', 'add', 'sub'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    if (chosenType === 'mult') {
      op1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
      op2 = Math.floor(Math.random() * 8) + 3; // 3 to 10
      op = '×';
      ans = op1 * op2;
      questionText = `${op1} × ${op2} = ?`;
    } else if (chosenType === 'add') {
      op1 = Math.floor(Math.random() * 40) + 15;
      op2 = Math.floor(Math.random() * 40) + 15;
      op = '+';
      ans = op1 + op2;
      questionText = `${op1} + ${op2} = ?`;
    } else {
      op1 = Math.floor(Math.random() * 50) + 40;
      op2 = Math.floor(Math.random() * 30) + 10;
      op = '-';
      ans = op1 - op2;
      questionText = `${op1} - ${op2} = ?`;
    }
  }

  const options = generateOptions(ans, difficulty);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'bonus_extra_throw',
    title: difficulty === 'hard' ? '⚡ HARD BONUS: Extra Dice Throw!' : 'BONUS QUESTION: Extra Dice Throw!',
    description: 'Solve this bonus challenge to earn an IMMEDIATE FREE EXTRA DICE THROW!',
    prompt: `Bonus Power Question (${difficulty.toUpperCase()})`,
    questionText,
    operand1: op1,
    operand2: op2,
    operator: op,
    correctAnswer: ans,
    options,
    timeLimit,
    startedAt: Date.now(),
    forPlayerId: playerId,
    targetTileIfCorrect: 0,
    targetTileIfWrong: 0,
    difficulty,
  };
}
