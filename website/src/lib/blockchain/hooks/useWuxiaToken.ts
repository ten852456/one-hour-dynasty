'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS, TOKEN_DECIMALS, getGasLimit, parseTransactionError } from '../config'
import WuxiaTokenAbi from '../abis/WuxiaToken.json'
import type { BoostType, SubscriptionTier } from '../types'

/**
 * Token operation result type
 */
export interface TokenOperationResult {
  hash?: string
  success: boolean
  error?: string
}

/**
 * Hook for WuxiaToken operations
 * Enhanced with proper error handling and type safety
 */
export function useWuxiaToken(address?: string) {
  // Read contract state
  const { data: totalSupply, isLoading: isLoadingTotalSupply } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'totalSupply',
    config,
    query: {
      staleTime: 60_000, // Cache for 1 minute
    },
  })

  const { data: maxSupply } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'MAX_SUPPLY',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  const { data: balance, refetch: refetchBalance, isLoading: isLoadingBalance } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000, // Cache for 30 seconds
    },
  })

  // Write contract operations
  const { data: hash, writeContract: _writeContract, isPending, error } = useWriteContract({ config })

  /**
   * Mint tokens (owner only)
   */
  const mint = async (to: string, amount: number): Promise<TokenOperationResult> => {
    try {
      if (!to) throw new Error('Recipient address is required')
      if (amount <= 0) throw new Error('Amount must be greater than 0')

      const amountInWei = parseUnits(amount.toString(), TOKEN_DECIMALS)

      const txHash = await _writeContract({
        address: CONTRACTS.WUXIA_TOKEN,
        abi: WuxiaTokenAbi.abi,
        functionName: 'mint',
        args: [to as `0x${string}`, amountInWei],
        gas: getGasLimit('TOKEN_MINT'),
      })

      return { hash: txHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Burn tokens
   */
  const burn = async (amount: number): Promise<TokenOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')
      if (amount <= 0) throw new Error('Amount must be greater than 0')

      const amountInWei = parseUnits(amount.toString(), TOKEN_DECIMALS)

      const txHash = await _writeContract({
        address: CONTRACTS.WUXIA_TOKEN,
        abi: WuxiaTokenAbi.abi,
        functionName: 'burn',
        args: [amountInWei],
        gas: getGasLimit('TOKEN_TRANSFER'),
      })

      return { hash: txHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Transfer tokens
   */
  const transfer = async (to: string, amount: number): Promise<TokenOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')
      if (!to) throw new Error('Recipient address is required')
      if (amount <= 0) throw new Error('Amount must be greater than 0')

      const amountInWei = parseUnits(amount.toString(), TOKEN_DECIMALS)

      const txHash = await _writeContract({
        address: CONTRACTS.WUXIA_TOKEN,
        abi: WuxiaTokenAbi.abi,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountInWei],
        gas: getGasLimit('TOKEN_TRANSFER'),
      })

      return { hash: txHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  // Format values safely
  const safeFormatUnits = (value: bigint | undefined, decimals: number): string => {
    if (!value && value !== 0n) return '0'
    return Number(formatUnits(value, decimals)).toFixed(2)
  }

  return {
    // Read state
    totalSupply: totalSupply ?? 0n,
    maxSupply: maxSupply ?? 0n,
    balance: balance ?? 0n,
    balanceFormatted: safeFormatUnits(balance, TOKEN_DECIMALS),
    totalSupplyFormatted: safeFormatUnits(totalSupply, 0),

    // Loading states
    isLoading: isLoadingTotalSupply || isLoadingBalance,
    isLoadingBalance,

    // Write operations (now with proper return types)
    mint,
    burn,
    transfer,

    // Transaction state
    isPending,
    error,
    txHash: hash,

    // Utility
    refetchBalance,
  }
}
