'use client'

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'
import { config, monadTestnetConfig } from '@/lib/blockchain/config'

/**
 * Hook for wallet connection and basic account info
 * Enhanced with network switching functionality
 */
export function useWalletConnection() {
  const { address, isConnected, chain } = useAccount({ config })
  const { connect, connectors, isPending } = useConnect({ config })
  const { disconnect } = useDisconnect({ config })
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain({ config })

  const { data: balance } = useBalance({
    address,
    config,
  })

  /**
   * Connect to a specific wallet
   */
  const connectWallet = async (connectorId?: string) => {
    try {
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
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  /**
   * Disconnect wallet
   */
  const disconnectWallet = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  /**
   * Switch to Monad Testnet
   * Uses wallet_switchEthereumChain or falls back to wallet_addEthereumChain
   */
  const switchToMonad = async () => {
    try {
      // Try to switch to the chain
      await switchChain({ chainId: monadTestnetConfig.id })
    } catch (error: unknown) {
      // If chain doesn't exist in wallet, we need to add it
      // This is handled by wagmi's useSwitchChain internally
      // but we can provide a better error message here
      if (error instanceof Error) {
        if (error.message.includes('chain') || error.message.includes('0x')) {
          // Chain not added to wallet, try to add it
          try {
            await window.ethereum?.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${monadTestnetConfig.id.toString(16)}`,
                chainName: monadTestnetConfig.name,
                nativeCurrency: monadTestnetConfig.nativeCurrency,
                rpcUrls: monadTestnetConfig.rpcUrls.default.http,
                blockExplorerUrls: [monadTestnetConfig.blockExplorers.default.url],
              }],
            })
          } catch (addError) {
            console.error('Failed to add Monad Testnet:', addError)
            throw new Error('Please add Monad Testnet to your wallet manually')
          }
        } else {
          throw error
        }
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  /**
   * Check if on correct chain (Monad Testnet)
   */
  const isCorrectChain = chain?.id === monadTestnetConfig.id

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
    isSwitchingChain,
    balance: balance?.value,
    balanceFormatted: balance
      ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
      : undefined,
    chain,
    isCorrectChain,
    chainId: monadTestnetConfig.id,
    connectWallet,
    disconnectWallet,
    switchToMonad,
    connectors: connectors.map((c) => ({
      id: c.id,
      name: c.name,
    })),
  }
}
