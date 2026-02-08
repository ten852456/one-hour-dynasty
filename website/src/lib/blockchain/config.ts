import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { parseUnits } from 'viem'

/**
 * Monad-specific blockchain configuration
 *
 * Based on Monad Testnet specifications:
 * - Chain ID: 10143
 * - RPC: https://testnet-rpc.monad.xyz
 * - Explorer: https://monadvision.com
 * - Currency: MON
 *
 * Key Monad differences from Ethereum:
 * - Gas charged on gas-limit (not gas-used)
 * - Max contract size: 128kb (vs 24.5kb on Ethereum)
 * - Storage reads repriced (SLOAD-cold: 8100 gas vs 2100 on Ethereum)
 * - Block time: 400ms
 * - Finality: 800ms (2 blocks)
 */

// ============================================
// Environment Validation
// ============================================

const requiredEnvVars = {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS,
  NEXT_PUBLIC_ITEM_STORE_ADDRESS: process.env.NEXT_PUBLIC_ITEM_STORE_ADDRESS,
  NEXT_PUBLIC_STAKING_ADDRESS: process.env.NEXT_PUBLIC_STAKING_ADDRESS,
  NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS: process.env.NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
} as const

// Validate required environment variables at build time
const validateEnv = () => {
  const missing: string[] = []

  if (!requiredEnvVars.NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS) missing.push('NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_ITEM_STORE_ADDRESS) missing.push('NEXT_PUBLIC_ITEM_STORE_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_STAKING_ADDRESS) missing.push('NEXT_PUBLIC_STAKING_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS) missing.push('NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS')

  if (missing.length > 0 && typeof window !== 'undefined') {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

validateEnv()

// ============================================
// Chain Configuration
// ============================================

/**
 * Monad Testnet configuration with proper RPC endpoints
 */
export const monadTestnetConfig = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 10_143,
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz']
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://monadvision.xyz'
    },
  },
  testnet: true,
}

// Export as MONAD_TESTNET for convenience
export const MONAD_TESTNET = monadTestnetConfig

// ============================================
// Wagmi Configuration
// ============================================

/**
 * Wagmi configuration optimized for Monad
 */
export const config = createConfig({
  chains: [monadTestnetConfig],
  connectors: [
    injected(),
    walletConnect({
      projectId: requiredEnvVars.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'One Hour Dynasty',
        description: 'AI Agent Strategy Game on Monad',
        url: 'https://onehourdynasty.com',
        icons: ['https://onehourdynasty.com/icon.png'],
      },
    }),
  ],
  ssr: true,
  syncConnectedChain: true,
  transports: {
    [monadTestnetConfig.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz'),
  },
})

// ============================================
// Contract Addresses
// ============================================

/**
 * Deployed contract addresses on Monad Testnet
 * All addresses are loaded from environment variables to avoid magic numbers
 */
export const CONTRACTS = {
  WUXIA_TOKEN: (requiredEnvVars.NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS || '0xF423ae72e96991F11F1836dAaC5A8b18dD592370') as `0x${string}`,
  ITEM_STORE: (requiredEnvVars.NEXT_PUBLIC_ITEM_STORE_ADDRESS || '0xB4e79Bf1342E040eE1EF505281DB045bfB465F26') as `0x${string}`,
  STAKING: (requiredEnvVars.NEXT_PUBLIC_STAKING_ADDRESS || '0x7af53FAf81068905A0b3e96B43848D440BcaFF98') as `0x${string}`,
  GAME_RESULTS_RECORDER: (requiredEnvVars.NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS || '0x22054c0065f5F97FFB39F08Aa31669f5c8156522') as `0x${string}`,
} as const

/**
 * ERC-8004 addresses on Monad (agent identity & reputation)
 */
export const ERC8004 = {
  IDENTITY_REGISTRY: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS || '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432') as `0x${string}`,
  REPUTATION_REGISTRY: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS || '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63') as `0x${string}`,
} as const

// ============================================
// Token Configuration
// ============================================

/**
 * Token decimals configuration
 */
export const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS) || 18

/**
 * Token unit helpers
 */
export const ONE_TOKEN = parseUnits('1', TOKEN_DECIMALS)
export const ZERO_TOKEN = 0n

// ============================================
// Validation Constants
// ============================================

/**
 * Staking validation limits (loaded from env vars)
 */
export const STAKING_LIMITS = {
  MIN_AMOUNT: Number(process.env.NEXT_PUBLIC_MIN_STAKE_AMOUNT) || 1,
  MAX_AMOUNT: Number(process.env.NEXT_PUBLIC_MAX_STAKE_AMOUNT) || 1_000_000,
  LOCK_DURATIONS: (process.env.NEXT_PUBLIC_LOCK_DURATIONS || '0,7,30,90,365').split(',').map(Number),
} as const

// ============================================
// Gas Settings
// ============================================

/**
 * Monad-specific gas settings
 *
 * IMPORTANT: On Monad, gas is charged on gas-limit (not gas-used)
 * Set gas limits accurately to avoid overpaying
 */
export const GAS_SETTINGS = {
  // Conservative gas limits for different transaction types
  TOKEN_TRANSFER: 100_000n,
  TOKEN_MINT: 200_000n,
  BOOST_PURCHASE: 300_000n,
  SUBSCRIPTION_PURCHASE: 350_000n,
  STAKE: 250_000n,
  UNSTAKE: 200_000n,
  INCREASE_STAKE: 200_000n,

  // Gas price multiplier (Monad can handle higher gas prices)
  GAS_PRICE_MULTIPLIER: 1.2,
} as const

/**
 * Get gas limit for a specific transaction type
 */
export function getGasLimit(type: keyof typeof GAS_SETTINGS): bigint {
  return GAS_SETTINGS[type]
}

// ============================================
// Block Finality Times
// ============================================

/**
 * Block finality times for transaction confirmation
 *
 * Monad finality: 800ms (2 blocks)
 * - Voted: 400ms (speculative, 2/3+ votes)
 * - Finalized: 800ms (economic finality)
 * - Verified: 1200ms (state root verified)
 */
export const FINALITY = {
  VOTED: 400, // ms - Safe for UI updates (balances, ownership)
  FINALIZED: 800, // ms - Safe for financial logic
  VERIFIED: 1200, // ms - Safe for state verification
} as const

// ============================================
// Faucet URLs
// ============================================

/**
 * Monad faucet URL for testnet
 */
export const MONAD_FAUCET = process.env.NEXT_PUBLIC_FAUCET_URL || 'https://faucet.monad.xyz'

/**
 * Agent Faucet API endpoint (for AI agents)
 *
 * Usage:
 * ```bash
 * curl -X POST https://agents.devnads.com/v1/faucet \
 *   -H "Content-Type: application/json" \
 *   -d '{"chainId": 10143, "address": "0xYOUR_ADDRESS"}'
 * ```
 */
export const AGENT_FAUCET = process.env.NEXT_PUBLIC_AGENT_FAUCET_URL || 'https://agents.devnads.com/v1/faucet'

/**
 * Helper to get testnet MON from faucet
 */
export async function getFaucetFunds(address: string): Promise<{
  txHash: string
  amount: string
  chain: string
}> {
  const response = await fetch(AGENT_FAUCET, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainId: monadTestnetConfig.id,
      address: address,
    }),
  })

  if (!response.ok) {
    throw new Error(`Faucet request failed: ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// Transaction Confirmation
// ============================================

/**
 * Monad-specific block confirmation wait times
 *
 * Based on MonadBFT consensus:
 * - Block proposal: immediate
 * - Block voting: 400ms (speculative finality)
 * - Block finalization: 800ms (economic finality)
 * - Block verification: 1200ms (state root verified)
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 1
): Promise<void> {
  // Wait 2 blocks per confirmation (800ms each)
  const waitTime = confirmations * 800 * 2
  await new Promise(resolve => setTimeout(resolve, waitTime))
}

// ============================================
// Error Types
// ============================================

/**
 * Custom error types for better error handling
 */
export class BlockchainError extends Error {
  constructor(message: string, public code?: string) {
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

export class InsufficientFundsError extends BlockchainError {
  constructor() {
    super('Insufficient funds to complete the transaction', 'INSUFFICIENT_FUNDS')
    this.name = 'InsufficientFundsError'
  }
}

export class NetworkError extends BlockchainError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

/**
 * Parse and categorize blockchain errors
 */
export function parseTransactionError(error: unknown): BlockchainError {
  if (error instanceof BlockchainError) {
    return error
  }

  if (error instanceof Error) {
    // Check for user rejection
    if (error.name === 'UserRejectedRequestError' || error.message.includes('User rejected')) {
      return new UserRejectedError()
    }

    // Check for insufficient funds
    if (error.message.includes('insufficient funds') || error.message.includes('exceeds balance')) {
      return new InsufficientFundsError()
    }

    return new BlockchainError(error.message)
  }

  return new BlockchainError('Unknown error occurred')
}
