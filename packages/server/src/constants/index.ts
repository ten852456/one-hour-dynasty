/**
 * Game constants for One Hour Dynasty
 */

export const GAME_DURATION_SECONDS = 3600; // 1 hour
export const GAME_TICKS_PER_SECOND = 1;
export const TOTAL_GAME_TICKS = GAME_DURATION_SECONDS * GAME_TICKS_PER_SECOND;

export const AGENT_TIERS = {
  ARENA: 'arena',
  TRAINING: 'training',
} as const;

export type AgentTier = (typeof AGENT_TIERS)[keyof typeof AGENT_TIERS];

export const TIER_ENTRY_FEES = {
  arena: 10, // MON
  training: 0, // Free
} as const;

export const GAME_STATES = {
  WAITING: 'waiting',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ABORTED: 'aborted',
} as const;

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

export const AGENT_ROLES = {
  EMPEROR: 'emperor',
  MINISTER: 'minister',
  GENERAL: 'general',
  SPY: 'spy',
  MERCHANT: 'merchant',
  ASSASSIN: 'assassin',
  MONK: 'monk',
  REBEL: 'rebel',
} as const;

export type AgentRole = (typeof AGENT_ROLES)[keyof typeof AGENT_ROLES];

export const ACTION_TYPES = {
  MOVE: 'move',
  ATTACK: 'attack',
  DEFEND: 'defend',
  HEAL: 'heal',
  TRADE: 'trade',
  SPY: 'spy',
  ASSASSINATE: 'assassinate',
  MEDITATE: 'meditate',
  RECRUIT: 'recruit',
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

export const STATS = {
  HEALTH: 'health',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SPEED: 'speed',
  INTELLECT: 'intellect',
  WEALTH: 'wealth',
  INFLUENCE: 'influence',
} as const;

export type Stat = (typeof STATS)[keyof typeof STATS];

export const ERROR_CODES = {
  // Queue errors
  QUEUE_FULL: 'QUEUE_FULL',
  QUEUE_TIMEOUT: 'QUEUE_TIMEOUT',
  ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',

  // Game errors
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_FULL: 'GAME_FULL',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  GAME_ALREADY_ENDED: 'GAME_ALREADY_ENDED',

  // Agent errors
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_NOT_IN_GAME: 'AGENT_NOT_IN_GAME',
  AGENT_ALREADY_ACTED: 'AGENT_ALREADY_ACTED',

  // Payment errors
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_INVALID: 'PAYMENT_INVALID',
  PAYMENT_INSUFFICIENT: 'PAYMENT_INSUFFICIENT',

  // Auth errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation errors
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_PARAMS: 'INVALID_PARAMS',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
