export interface PlayerProfile {
  id: string;
  username: string;
  skinId: string;
  avatarSeed: string;
  level: number;
  xp: number;
  trophies: number;
  matchesWon: number;
  matchesPlayed: number;
  mathCorrect: number;
  mathTotal: number;
  seasonPoints: number;
}

export interface SnakeSkin {
  id: string;
  name: string;
  title: string;
  headColor: string;
  bodyGradient: string[];
  pattern: 'scales' | 'stripes' | 'neon' | 'dots' | 'flame' | 'frost' | 'cosmic' | 'gold';
  eyeColor: string;
  tongueColor: string;
  unlockedByDefault: boolean;
  requiredTrophies: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  flavorText: string;
}

export interface BoardSnake {
  id: string;
  head: number; // e.g. 98
  tail: number; // e.g. 78
  color: string;
  name: string;
}

export interface BoardLadder {
  id: string;
  bottom: number; // e.g. 4
  top: number;    // e.g. 14
  color: string;
}

export type ChallengeType = 'dice_move' | 'snake_bite' | 'bonus_extra_throw';

export interface MathChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  prompt: string;
  questionText: string;
  operand1: number;
  operand2: number;
  operator: '+' | '-' | '×';
  correctAnswer: number;
  options: number[];
  timeLimit: number; // in seconds (e.g. 5 or 10)
  startedAt: number; // timestamp
  forPlayerId: string;
  targetTileIfCorrect: number;
  targetTileIfWrong: number;
  rolledValue?: number;
  snakeHead?: number;
  snakeTail?: number;
}

export interface GamePlayer {
  id: string;
  username: string;
  skinId: string;
  position: number; // 1 to 100 (starts at 1)
  isBot: boolean;
  score: number;
  mathStreak: number;
  consecutiveExtraTurns: number;
  avatarIndex: number;
  isHost?: boolean;
  isReady?: boolean;
}

export type GameStatus = 'waiting' | 'in_progress' | 'rolling' | 'answering_math' | 'moving' | 'answering_snake' | 'answering_bonus' | 'game_over';

export interface GameRoom {
  id: string;
  name: string;
  isTournament: boolean;
  timerDuration: 5 | 10;
  maxPlayers: number;
  status: GameStatus;
  players: GamePlayer[];
  currentTurnIndex: number;
  diceValue: number | null;
  activeChallenge: MathChallenge | null;
  actionLog: ActionLogEntry[];
  winner: GamePlayer | null;
  createdAt: number;
  isPrivate: boolean;
  extraTurnAwarded: boolean;
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  text: string;
  type: 'roll' | 'math_success' | 'math_fail' | 'snake_slide' | 'bonus_award' | 'ladder_climb' | 'win' | 'info';
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  skinId: string;
  trophies: number;
  matchesWon: number;
  winRate: number;
  mathAccuracy: number;
  seasonPoints: number;
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
}

export interface TournamentEvent {
  id: string;
  season: number;
  title: string;
  subtitle: string;
  description: string;
  endDate: string;
  bonusRule: string;
  grandPrize: string;
  prizeSkinId: string;
  userRank: number;
  currentPoints: number;
  targetPoints: number;
}
