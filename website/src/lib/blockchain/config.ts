import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'

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

/**
 * Monad Testnet configuration with proper RPC endpoints
 */
export const monadTestnetConfig = {
  id: 10_143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz']
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://monadvision.xyz'
    },
  },
  testnet: true,
}

// Export as MONAD_TESTNET for convenience
export const MONAD_TESTNET = monadTestnetConfig

/**
 * Wagmi configuration optimized for Monad
 */
export const config = createConfig({
  chains: [monadTestnetConfig],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
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
    [monadTestnetConfig.id]: http('https://testnet-rpc.monad.xyz'),
  },
})

/**
 * Deployed contract addresses on Monad Testnet
 */
export const CONTRACTS = {
  WUXIA_TOKEN: '0xF423ae72e96991F11F1836dAaC5A8b18dD592370' as const,
  ITEM_STORE: '0xB4e79Bf1342E040eE1EF505281DB045bfB465F26' as const,
  STAKING: '0x7af53FAf81068905A0b3e96B43848D440BcaFF98' as const,
  GAME_RESULTS_RECORDER: '0x22054c0065f5F97FFB39F08Aa31669f5c81565' as const,
} as const

/**
 * ERC-8004 addresses on Monad (agent identity & reputation)
 */
export const ERC8004 = {
  IDENTITY_REGISTRY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
  REPUTATION_REGISTRY: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
} as const

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
}

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
}

/**
 * Monad faucet URL for testnet
 */
export const MONAD_FAUCET = 'https://faucet.monad.xyz'

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
export const AGENT_FAUCET = 'https://agents.devnads.com/v1/faucet'

/**
 * Helper to get testnet MON from faucet
 */
export async function getFaucetFunds(address: string): Promise<{
  txHash: string
  amount: string
  chain: string
}> {
  const response = await fetch('https://agents.devnads.com/v1/faucet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainId: 10143,
      address: address,
    }),
  })

  if (!response.ok) {
    throw new Error(`Faucet request failed: ${response.statusText}`)
  }

  return response.json()
}

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
