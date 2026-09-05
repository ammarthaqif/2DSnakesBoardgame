import { MathChallenge } from '../types';

function generateOptions(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);
  
  // Generate plausible distractors close to the correct answer
  const deltas = [-3, -2, -1, 1, 2, 3, -10, 10, -5, 5];
  deltas.sort(() => Math.random() - 0.5);

  for (const delta of deltas) {
    const candidate = correctAnswer + delta;
    if (candidate >= 0 && candidate !== correctAnswer) {
      options.add(candidate);
    }
    if (options.size >= 4) break;
  }

  // If still fewer than 4 options
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
  timeLimit: number = 10
): MathChallenge {
  const targetTile = Math.min(100, currentTile + rolledDice);
  const correctAnswer = currentTile + rolledDice;
  const options = generateOptions(correctAnswer);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'dice_move',
    title: 'Dice Roll Math Challenge',
    description: 'Solve correctly within the timer to advance your snake to the tile!',
    prompt: `Current Tile (${currentTile}) + Rolled Dice (${rolledDice})`,
    questionText: `${currentTile} + ${rolledDice} = ?`,
    operand1: currentTile,
    operand2: rolledDice,
    operator: '+',
    correctAnswer,
    options,
    timeLimit,
    startedAt: Date.now(),
    forPlayerId: playerId,
    targetTileIfCorrect: targetTile,
    targetTileIfWrong: currentTile,
    rolledValue: rolledDice,
  };
}

export function createSnakeBiteChallenge(
  playerId: string,
  snakeHead: number,
  snakeTail: number,
  timeLimit: number = 10
): MathChallenge {
  const diff = snakeHead - snakeTail;
  const correctAnswer = diff;
  const options = generateOptions(correctAnswer);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'snake_bite',
    title: 'Snake Bite Escape Challenge!',
    description: 'Bitten by the snake! Solve the difference between Head and Tail to unlock a Bonus Question for an EXTRA DICE THROW!',
    prompt: `Snake Head (${snakeHead}) - Snake Tail (${snakeTail})`,
    questionText: `${snakeHead} - ${snakeTail} = ?`,
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
  };
}

export function createBonusThrowChallenge(
  playerId: string,
  timeLimit: number = 8
): MathChallenge {
  // Generate engaging bonus challenge (multiplication or mental addition)
  const types: ('mult' | 'add' | 'sub')[] = ['mult', 'add', 'sub'];
  const chosenType = types[Math.floor(Math.random() * types.length)];
  let op1: number;
  let op2: number;
  let op: '+' | '-' | '×';
  let ans: number;

  if (chosenType === 'mult') {
    op1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    op2 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    op = '×';
    ans = op1 * op2;
  } else if (chosenType === 'add') {
    op1 = Math.floor(Math.random() * 40) + 15;
    op2 = Math.floor(Math.random() * 40) + 15;
    op = '+';
    ans = op1 + op2;
  } else {
    op1 = Math.floor(Math.random() * 50) + 40;
    op2 = Math.floor(Math.random() * 30) + 10;
    op = '-';
    ans = op1 - op2;
  }

  const options = generateOptions(ans);

  return {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'bonus_extra_throw',
    title: 'BONUS QUESTION: Extra Dice Throw!',
    description: 'Solve this bonus challenge to earn an IMMEDIATE FREE EXTRA DICE THROW!',
    prompt: `Bonus Power Question`,
    questionText: `${op1} ${op} ${op2} = ?`,
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
  };
}
