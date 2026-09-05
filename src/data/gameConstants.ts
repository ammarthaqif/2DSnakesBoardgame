import { BoardLadder, BoardSnake, SnakeSkin, TournamentEvent, LeaderboardEntry } from '../types';

export const SNAKES: BoardSnake[] = [
  { id: 's1', head: 98, tail: 78, color: '#ef4444', name: 'Crimson Viper' },
  { id: 's2', head: 95, tail: 56, color: '#f97316', name: 'Molten Anaconda' },
  { id: 's3', head: 92, tail: 73, color: '#eab308', name: 'Golden Asp' },
  { id: 's4', head: 83, tail: 19, color: '#ec4899', name: 'Dread Colossus' },
  { id: 's5', head: 73, tail: 51, color: '#8b5cf6', name: 'Abyssal Cobra' },
  { id: 's6', head: 64, tail: 36, color: '#10b981', name: 'Emerald Mamba' },
  { id: 's7', head: 52, tail: 11, color: '#06b6d4', name: 'Glacial Python' },
  { id: 's8', head: 48, tail: 26, color: '#f43f5e', name: 'Ruby Krait' },
  { id: 's9', head: 44, tail: 22, color: '#d946ef', name: 'Neon Serpent' },
  { id: 's10', head: 16, tail: 6, color: '#6366f1', name: 'Baby Adder' },
];

export const LADDERS: BoardLadder[] = [
  { id: 'l1', bottom: 4, top: 14, color: '#22c55e' },
  { id: 'l2', bottom: 9, top: 31, color: '#10b981' },
  { id: 'l3', bottom: 20, top: 38, color: '#14b8a6' },
  { id: 'l4', bottom: 28, top: 84, color: '#eab308' },
  { id: 'l5', bottom: 40, top: 59, color: '#3b82f6' },
  { id: 'l6', bottom: 51, top: 67, color: '#8b5cf6' },
  { id: 'l7', bottom: 63, top: 81, color: '#a855f7' },
  { id: 'l8', bottom: 71, top: 91, color: '#ec4899' },
];

export const SNAKE_SKINS: SnakeSkin[] = [
  {
    id: 'emerald_viper',
    name: 'Emerald Viper',
    title: 'Verdant Forest Hunter',
    headColor: '#10b981',
    bodyGradient: ['#10b981', '#059669', '#047857'],
    pattern: 'scales',
    eyeColor: '#fef08a',
    tongueColor: '#ef4444',
    unlockedByDefault: true,
    requiredTrophies: 0,
    rarity: 'Common',
    flavorText: 'Agile and sharp-witted serpent of the jade canopy.'
  },
  {
    id: 'neon_cyber',
    name: 'Cyber Neon',
    title: 'Arcade Grid Runner',
    headColor: '#06b6d4',
    bodyGradient: ['#06b6d4', '#3b82f6', '#8b5cf6'],
    pattern: 'neon',
    eyeColor: '#f43f5e',
    tongueColor: '#22d3ee',
    unlockedByDefault: true,
    requiredTrophies: 0,
    rarity: 'Rare',
    flavorText: 'Charged with synthetic luminescence and instant calculations.'
  },
  {
    id: 'golden_python',
    name: 'Golden Python',
    title: 'Gilded Sun Monarch',
    headColor: '#f59e0b',
    bodyGradient: ['#fbbf24', '#d97706', '#b45309'],
    pattern: 'gold',
    eyeColor: '#ffffff',
    tongueColor: '#b91c1c',
    unlockedByDefault: false,
    requiredTrophies: 200,
    rarity: 'Epic',
    flavorText: 'Shines brightly on the leaderboard podium with imperial prestige.'
  },
  {
    id: 'coral_striker',
    name: 'Coral Serpent',
    title: 'Reef Ambush Specialist',
    headColor: '#ef4444',
    bodyGradient: ['#ef4444', '#18181b', '#fbbf24'],
    pattern: 'stripes',
    eyeColor: '#fef08a',
    tongueColor: '#000000',
    unlockedByDefault: false,
    requiredTrophies: 350,
    rarity: 'Epic',
    flavorText: 'Banded warning stripes that intimidate calculation rivals.'
  },
  {
    id: 'frost_wyrm',
    name: 'Frost Wyrm',
    title: 'Glacial Chill Drake',
    headColor: '#38bdf8',
    bodyGradient: ['#e0f2fe', '#38bdf8', '#0284c7'],
    pattern: 'frost',
    eyeColor: '#67e8f9',
    tongueColor: '#93c5fd',
    unlockedByDefault: false,
    requiredTrophies: 500,
    rarity: 'Legendary',
    flavorText: 'Freezes mistakes in their tracks with sub-zero calculation speed.'
  },
  {
    id: 'magma_drake',
    name: 'Magma Drake',
    title: 'Volcanic Core Fiend',
    headColor: '#f97316',
    bodyGradient: ['#fb923c', '#ea580c', '#7c2d12'],
    pattern: 'flame',
    eyeColor: '#fef08a',
    tongueColor: '#ffedd5',
    unlockedByDefault: false,
    requiredTrophies: 800,
    rarity: 'Legendary',
    flavorText: 'Formed in geothermal rifts, fueled by streak multipliers.'
  },
  {
    id: 'cosmic_serpent',
    name: 'Cosmic Serpent',
    title: 'Astral Constellation God',
    headColor: '#c084fc',
    bodyGradient: ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e'],
    pattern: 'cosmic',
    eyeColor: '#fef08a',
    tongueColor: '#38bdf8',
    unlockedByDefault: false,
    requiredTrophies: 1200,
    rarity: 'Mythic',
    flavorText: 'Slithers across event horizons beyond mathematical bounds.'
  },
  {
    id: 'shadow_obsidian',
    name: 'Obsidian Shadow',
    title: 'Void Phantom Python',
    headColor: '#6b21a8',
    bodyGradient: ['#1e1b4b', '#3b0764', '#09090b'],
    pattern: 'scales',
    eyeColor: '#a855f7',
    tongueColor: '#d946ef',
    unlockedByDefault: false,
    requiredTrophies: 1500,
    rarity: 'Mythic',
    flavorText: 'Silent and untraceable in competitive tournament halls.'
  }
];

export const CURRENT_TOURNAMENT: TournamentEvent = {
  id: 'season_1_arithmetic_cup',
  season: 1,
  title: 'Season 1: Serpent Arithmetics Cup',
  subtitle: 'Grand Mathematical Board Championship',
  description: 'Climb the global boardgame rankings by solving speed math on dice throws & snake encounters. Bonus question streaks award 2x Season Points!',
  endDate: 'In 6 Days 14 Hours',
  bonusRule: 'Snake Bite Escape + Bonus Question awards +50 Season Points & extra turn!',
  grandPrize: 'Exclusive Cosmic Serpent Skin + Master Serpent Trophy',
  prizeSkinId: 'cosmic_serpent',
  userRank: 12,
  currentPoints: 840,
  targetPoints: 1200
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, id: 'u1', username: 'PythagorasRex', skinId: 'cosmic_serpent', trophies: 2840, matchesWon: 142, winRate: 88, mathAccuracy: 99, seasonPoints: 3420, tier: 'Diamond' },
  { rank: 2, id: 'u2', username: 'ViperCountess', skinId: 'shadow_obsidian', trophies: 2610, matchesWon: 128, winRate: 84, mathAccuracy: 97, seasonPoints: 3150, tier: 'Diamond' },
  { rank: 3, id: 'u3', username: 'MathStrike99', skinId: 'golden_python', trophies: 2390, matchesWon: 110, winRate: 81, mathAccuracy: 96, seasonPoints: 2890, tier: 'Diamond' },
  { rank: 4, id: 'u4', username: 'ApexConstrictor', skinId: 'magma_drake', trophies: 2150, matchesWon: 95, winRate: 77, mathAccuracy: 94, seasonPoints: 2450, tier: 'Platinum' },
  { rank: 5, id: 'u5', username: 'CobraCipher', skinId: 'frost_wyrm', trophies: 1980, matchesWon: 89, winRate: 74, mathAccuracy: 93, seasonPoints: 2210, tier: 'Platinum' },
  { rank: 6, id: 'u6', username: 'QuickAdder', skinId: 'coral_striker', trophies: 1820, matchesWon: 82, winRate: 72, mathAccuracy: 92, seasonPoints: 2040, tier: 'Platinum' },
  { rank: 7, id: 'u7', username: 'NeonTail', skinId: 'neon_cyber', trophies: 1650, matchesWon: 74, winRate: 69, mathAccuracy: 90, seasonPoints: 1890, tier: 'Gold' },
  { rank: 8, id: 'u8', username: 'LadderRunner', skinId: 'emerald_viper', trophies: 1490, matchesWon: 66, winRate: 68, mathAccuracy: 88, seasonPoints: 1680, tier: 'Gold' },
  { rank: 9, id: 'u9', username: 'DeltaSerpent', skinId: 'golden_python', trophies: 1320, matchesWon: 58, winRate: 65, mathAccuracy: 86, seasonPoints: 1490, tier: 'Gold' },
  { rank: 10, id: 'u10', username: 'BoaCalculator', skinId: 'frost_wyrm', trophies: 1180, matchesWon: 52, winRate: 63, mathAccuracy: 85, seasonPoints: 1320, tier: 'Silver' },
];

export const RANDOM_BOT_NAMES = [
  'SwiftViper',
  'ZenithAdder',
  'MatrixPython',
  'QuantCobra',
  'TurboKrait',
  'ApexBoa',
  'VectorMamba',
  'NovaSerpent'
];
