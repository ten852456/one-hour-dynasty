/**
 * Type definitions for One Hour Dynasty smart contracts
 */

// ============================================
// ENUMS
// ============================================

export enum BoostType {
  SPEED_START = 0,
  VISION_PLUS = 1,
  LUCKY_SPAWN = 2,
  DOUBLE_XP = 3,
}

export enum SubscriptionTier {
  BRONZE = 0,
  SILVER = 1,
  GOLD = 2,
}

// ============================================
// CONTRACT INTERFACES
// ============================================

export interface WuxiaToken {
  name: string
  symbol: string
  totalSupply: bigint
  MAX_SUPPLY: bigint
  balanceOf: (owner: string) => Promise<bigint>
  transfer: (to: string, amount: bigint) => Promise<void>
  burn: (amount: bigint) => Promise<void>
  mint: (to: string, amount: bigint) => Promise<void>
}

export interface ItemStore {
  wuxiaToken: string
  treasury: string
  boostPrices: [bigint, bigint, bigint, bigint]
  subscriptionPrices: [bigint, bigint, bigint]
  subscriptionExpiry: (user: string) => Promise<bigint>
  hasActiveSubscription: (user: string) => Promise<boolean>
  buyBoost: (boostType: BoostType) => Promise<void>
  buySubscription: (tier: SubscriptionTier) => Promise<void>
  getAllBoostPrices: () => Promise<[bigint, bigint, bigint, bigint]>
  getAllSubscriptionPrices: () => Promise<[bigint, bigint, bigint, bigint]>
  getSubscriptionTimeRemaining: (user: string) => Promise<bigint>
}

export interface Staking {
  wuxiaToken: string
  PRIORITY_STAKE: bigint
  GRAND_WAR_STAKE: bigint
  GOVERNANCE_STAKE: bigint
  stakes: (user: string) => Promise<{
    amount: bigint
    timestamp: bigint
    lockDuration: bigint
  }>
  hasPriorityQueue: (user: string) => Promise<boolean>
  canAccessGrandWar: (user: string) => Promise<boolean>
  hasGovernanceRights: (user: string) => Promise<boolean>
  stake: (amount: bigint, lockDuration: bigint) => Promise<void>
  unstake: () => Promise<void>
  increaseStake: (additionalAmount: bigint) => Promise<void>
}

export interface GameResultsRecorder {
  prizeToken: string
  reputationRegistry: string
  MAX_AGENTS_PER_GAME: bigint
  games: (gameId: bigint) => Promise<{
    gameId: bigint
    agents: string[]
    recorded: boolean
    prizesDistributed: boolean
  }>
  getAgentRank: (gameId: bigint, agent: string) => Promise<bigint>
  getAgentScore: (gameId: bigint, agent: string) => Promise<bigint>
  recordGameResult: (
    gameId: bigint,
    agents: string[],
    ranks: bigint[],
    scores: bigint[]
  ) => Promise<void>
  submitERC8004Feedback: (
    gameId: bigint,
    agent: string,
    tokenId: bigint,
    feedbackURI: string
  ) => Promise<void>
  distributePrize: (
    gameId: bigint,
    winners: string[],
    amounts: bigint[]
  ) => Promise<void>
  batchDistributePrizes: (
    gameId: bigint,
    winners: string[],
    amounts: bigint[]
  ) => Promise<void>
}

// ============================================
// COMMON TYPES
// ============================================

export interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  totalSupply: bigint
  balance: bigint
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  expiry: bigint
  timeRemaining: bigint
  isActive: boolean
}

export interface StakeInfo {
  amount: bigint
  timestamp: bigint
  lockDuration: bigint
  canUnstake: boolean
  hasPriorityQueue: boolean
  canAccessGrandWar: boolean
  hasGovernanceRights: boolean
}

export interface GameResult {
  gameId: bigint
  agents: string[]
  recorded: boolean
  prizesDistributed: boolean
}

export interface BoostPrice {
  boostType: BoostType
  name: string
  price: bigint
  description: string
}

export interface SubscriptionPrice {
  tier: SubscriptionTier
  name: string
  price: bigint
  benefits: string[]
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionState = 'idle' | 'loading' | 'success' | 'error'

export interface TransactionOptions {
  onSuccess?: (receipt: any) => void
  onError?: (error: Error) => void
  onConfirm?: (hash: string) => void
}

// ============================================
// ERROR TYPES
// ============================================

export class BlockchainError extends Error {
  constructor(
    message: string,
    public code?: string,
    public txHash?: string
  ) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class UserRejectedError extends BlockchainError {
  constructor() {
    super('User rejected the transaction', 'USER_REJECTED')
    this.name = 'UserRejectedError'
  }
}

// ============================================
// UTILITY TYPES
// ============================================

export type Address = `0x${string}`

export type ContractReadParams<T extends any[]> = {
  functionName: string
  args?: T
  enabled?: boolean
}

export type ContractWriteParams<T extends any[]> = {
  functionName: string
  args?: T
  value?: bigint
  enabled?: boolean
}
