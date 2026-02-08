'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { config } from '@/lib/blockchain/config'

/**
 * Hook for wallet connection and basic account info
 */
export function useWalletConnection() {
  const { address, isConnected, chain } = useAccount({ config })
  const { connect, connectors, isPending } = useConnect({ config })
  const { disconnect } = useDisconnect({ config })
  const { data: balance } = useBalance({
    address,
    config,
  }) as { data: { decimals: number; symbol: string; value: bigint } | undefined }

  /**
   * Connect to a specific wallet
   */
  const connectWallet = async (connectorId?: string) => {
    if (connectorId) {
      const connector = connectors.find((c) => c.id === connectorId)
      if (connector) {
        await connect({ connector })
      }
    } else {
      // Try to connect with injected connector (MetaMask, etc.)
      const injected = connectors.find((c) => c.id === 'injected')
      if (injected) {
        await connect({ connector: injected })
      }
    }
  }

  /**
   * Disconnect wallet
   */
  const disconnectWallet = async () => {
    await disconnect()
  }

  /**
   * Check if on correct chain (Monad Testnet)
   */
  const MONAD_TESTNET_ID = 10_143 // Monad Testnet Chain ID
  const isCorrectChain = chain?.id === MONAD_TESTNET_ID

  /**
   * Format address for display
   */
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return {
    address: address ?? undefined,
    shortAddress: formatAddress(address ?? undefined),
    isConnected,
    isPending,
    balance: balance?.value,
    balanceFormatted: balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : undefined,
    chain,
    isCorrectChain,
    chainId: MONAD_TESTNET_ID,
    connectWallet,
    disconnectWallet,
    connectors: connectors.map((c) => ({
      id: c.id,
      name: c.name,
    })),
  }
}
