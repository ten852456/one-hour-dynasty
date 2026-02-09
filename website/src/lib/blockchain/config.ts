/// <reference path="../../types/abi.d.ts" />
/// <reference path="../../types/global.d.ts" />

import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { parseUnits, formatUnits, getAddress } from 'viem'
import WuxiaTokenAbi from './abis/WuxiaToken.json'

// Re-export viem utilities for use in other modules
export { parseUnits, formatUnits, getAddress }

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

// Validate required environment variables
const validateEnv = () => {
  const missing: string[] = []

  if (!requiredEnvVars.NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS) missing.push('NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_ITEM_STORE_ADDRESS) missing.push('NEXT_PUBLIC_ITEM_STORE_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_STAKING_ADDRESS) missing.push('NEXT_PUBLIC_STAKING_ADDRESS')
  if (!requiredEnvVars.NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS) missing.push('NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS')

  // Throw errors for missing required env vars in ALL environments
  // This prevents runtime errors when deploying to staging/testnet
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`
    // Always throw to catch configuration issues early
    throw new Error(errorMsg)
  }
}

validateEnv()

// ============================================
// Address Validation
// ============================================

/**
 * Validate and normalize an Ethereum address
 * Uses viem's getAddress to ensure checksummed format
 *
 * @param address - Address to validate (can be undefined)
 * @param name - Friendly name for error messages
 * @returns Validated checksummed address
 * @throws Error if address is invalid in production
 */
function validateAddress(address: string | undefined, name: string): `0x${string}` {
  if (!address) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing ${name} address`)
    }
    console.error(`Missing ${name} address`)
    return '0x0000000000000000000000000000000000000000' as `0x${string}`
  }

  try {
    return getAddress(address)
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid ${name} address: ${address}`)
    }
    if (typeof window !== 'undefined') {
      console.error(`Invalid ${name} address: ${address}`, error)
    }
    // Return a fallback address in development to prevent crashes
    return '0x0000000000000000000000000000000000000000' as `0x${string}`
  }
}

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
 *
 * SECURITY: Addresses are validated for checksum format on initialization
 */
export const CONTRACTS = {
  WUXIA_TOKEN: validateAddress(requiredEnvVars.NEXT_PUBLIC_WUXIA_TOKEN_ADDRESS, 'WUXIA_TOKEN'),
  ITEM_STORE: validateAddress(requiredEnvVars.NEXT_PUBLIC_ITEM_STORE_ADDRESS, 'ITEM_STORE'),
  STAKING: validateAddress(requiredEnvVars.NEXT_PUBLIC_STAKING_ADDRESS, 'STAKING'),
  GAME_RESULTS_RECORDER: validateAddress(requiredEnvVars.NEXT_PUBLIC_GAME_RESULTS_RECORDER_ADDRESS, 'GAME_RESULTS_RECORDER'),
} as const

/**
 * ERC-8004 addresses on Monad (agent identity & reputation)
 * Validated for checksum format
 */
export const ERC8004 = {
  IDENTITY_REGISTRY: validateAddress(
    process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS || '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    'IDENTITY_REGISTRY'
  ),
  REPUTATION_REGISTRY: validateAddress(
    process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS || '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    'REPUTATION_REGISTRY'
  ),
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

/**
 * Staking safety buffer (in seconds)
 *
 * SECURITY: This buffer is added to lock period calculations to prevent users from
 * attempting to unstake too early due to clock skew or block time differences between
 * the blockchain and the client.
 *
 * For Monad with 400ms block time, 300 seconds (5 minutes) provides sufficient buffer
 * while maintaining good UX. Adjust based on your needs:
 * - Development: 60 (1 minute) for faster testing
 * - Production: 300 (5 minutes) for safety
 */
export const STAKING_SAFETY_BUFFER = Number(process.env.NEXT_PUBLIC_STAKING_SAFETY_BUFFER) || 300

// ============================================
// Gas Settings
// ============================================

/**
 * Monad-specific gas settings
 *
 * IMPORTANT: On Monad, gas is charged on gas-limit (not gas-used)
 * Set gas limits accurately to avoid overpaying
 */
export const GAS_LIMITS = {
  TOKEN_TRANSFER: 100_000n,
  TOKEN_MINT: 200_000n,
  BOOST_PURCHASE: 300_000n,
  SUBSCRIPTION_PURCHASE: 350_000n,
  STAKE: 250_000n,
  UNSTAKE: 200_000n,
  INCREASE_STAKE: 200_000n,
} as const

// Gas price multiplier (Monad can handle higher gas prices)
export const GAS_PRICE_MULTIPLIER = 1.2

/**
 * Get gas limit for a specific transaction type
 */
export function getGasLimit(type: keyof typeof GAS_LIMITS): bigint {
  return GAS_LIMITS[type]
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

/**
 * Transaction result with receipt
 */
export interface TransactionReceipt {
  hash: string
  status: 'success' | 'reverted'
  blockNumber?: bigint
  blockHash?: string
  gasUsed?: bigint
}

/**
 * Wait for transaction receipt with proper confirmation
 * This ensures the transaction was mined and confirmed before proceeding
 *
 * @param config - Wagmi config
 * @param hash - Transaction hash
 * @param confirmations - Number of block confirmations to wait for
 * @returns Transaction receipt or throws error
 */
export async function getTransactionReceipt(
  hash: string,
  confirmations: number = 1
): Promise<{ status: 'success' | 'reverted' }> {
  // Import dynamically to avoid circular dependencies
  const { getPublicClient } = await import('wagmi/actions')
  const publicClient = await getPublicClient(config)

  if (!publicClient) {
    throw new Error('Unable to get public client')
  }

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
    confirmations,
  })

  return {
    status: receipt.status === 'success' ? 'success' : 'reverted',
  }
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

export class InsufficientAllowanceError extends BlockchainError {
  constructor() {
    super('Please approve the contract to spend your tokens first.', 'INSUFFICIENT_ALLOWANCE')
    this.name = 'InsufficientAllowanceError'
  }
}

export class ContractExecutionError extends BlockchainError {
  constructor(message: string) {
    super(message, 'CONTRACT_EXECUTION')
    this.name = 'ContractExecutionError'
  }
}

/**
 * Human-readable error message mappings
 * Maps technical blockchain errors to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // User rejection errors
  'User rejected': 'Transaction was cancelled in your wallet.',
  'User rejected the request': 'Transaction was cancelled in your wallet.',

  // Insufficient balance errors
  'insufficient funds': 'You don\'t have enough tokens to complete this transaction.',
  'exceeds balance': 'You don\'t have enough tokens to complete this transaction.',
  'insufficient balance': 'You don\'t have enough tokens to complete this transaction.',

  // Allowance errors
  'insufficient allowance': 'Please approve the contract to spend your tokens first.',
  'allowance': 'Please increase your token approval in your wallet.',

  // Network errors
  'network': 'Network error. Please check your connection and try again.',
  'timeout': 'Transaction timed out. Please try again.',
  'rate limit': 'Too many requests. Please wait a moment and try again.',

  // Contract execution errors
  'reverted': 'Transaction failed. The contract execution reverted.',
  'gas required exceeds': 'Transaction failed: Insufficient gas for execution.',
  'execution reverted': 'Transaction failed: Contract execution reverted.',
}

/**
 * Parse and categorize blockchain errors with user-friendly messages
 */
export function parseTransactionError(error: unknown): BlockchainError {
  if (error instanceof BlockchainError) {
    return error
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Check for user rejection (multiple patterns)
    if (
      error.name === 'UserRejectedRequestError' ||
      errorMessage.includes('user rejected') ||
      errorMessage.includes('user cancelled') ||
      errorMessage.includes('user denied')
    ) {
      return new UserRejectedError()
    }

    // Check for insufficient funds (multiple patterns)
    if (
      errorMessage.includes('insufficient funds') ||
      errorMessage.includes('exceeds balance') ||
      errorMessage.includes('insufficient balance') ||
      errorMessage.includes('underpriced')
    ) {
      return new InsufficientFundsError()
    }

    // Check for insufficient allowance
    if (
      errorMessage.includes('insufficient allowance') ||
      errorMessage.includes('allowance exceeded')
    ) {
      return new InsufficientAllowanceError()
    }

    // Check for network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate limit') ||
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError'
    ) {
      return new NetworkError(ERROR_MESSAGE_MAP['network'] || error.message)
    }

    // Check for contract execution errors
    if (
      errorMessage.includes('reverted') ||
      errorMessage.includes('execution reverted') ||
      errorMessage.includes('gas required')
    ) {
      // Try to extract revert reason if present
      const revertReasonMatch = error.message.match(/reason\s*["']?([^"']+)["']?/i)
      const reason = revertReasonMatch
        ? `Transaction failed: ${revertReasonMatch[1]}`
        : 'Transaction failed. Please check the contract conditions and try again.'
      return new ContractExecutionError(reason)
    }

    // Check for specific known errors and provide friendly messages
    for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (errorMessage.includes(key.toLowerCase())) {
        return new BlockchainError(friendlyMessage)
      }
    }

    // Default: return original error message if no mapping found
    return new BlockchainError(error.message)
  }

  // Fallback for non-Error objects
  if (typeof error === 'string') {
    const errorMessage = error.toLowerCase()
    for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (errorMessage.includes(key.toLowerCase())) {
        return new BlockchainError(friendlyMessage)
      }
    }
    return new BlockchainError(error)
  }

  return new BlockchainError('An unknown error occurred. Please try again.')
}

/**
 * Approve ERC-20 token spending
 * Used to approve contracts to spend tokens on behalf of user
 *
 * @param tokenAddress - Token contract address
 * @param spender - Address to approve (e.g., ItemStore contract)
 * @param amount - Amount to approve (use MaxUint256 for unlimited)
 * @returns Transaction hash
 */
export async function approveTokenSpending(
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint = 2n ** 256n - 1n // MaxUint256 for unlimited approval
): Promise<`0x${string}`> {
  const { writeContract } = await import('wagmi/actions')

  const hash = await writeContract(config, {
    address: tokenAddress,
    abi: WuxiaTokenAbi.abi,
    functionName: 'approve',
    args: [spender, amount],
    gas: getGasLimit('TOKEN_TRANSFER'),
  })

  return hash as `0x${string}`
}

/**
 * Check ERC-20 token allowance
 *
 * @param tokenAddress - Token contract address
 * @param owner - Token owner address
 * @param spender - Address to check allowance for
 * @returns Current allowance amount
 */
export async function getTokenAllowance(
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  const { readContract } = await import('wagmi/actions')

  const allowance = await readContract(config, {
    address: tokenAddress,
    abi: WuxiaTokenAbi.abi,
    functionName: 'allowance',
    args: [owner, spender],
  })

  return allowance as bigint
}
