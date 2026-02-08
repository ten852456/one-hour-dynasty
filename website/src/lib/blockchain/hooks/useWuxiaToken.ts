'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS } from '../config'
import WuxiaTokenAbi from '../abis/WuxiaToken.json'
import type { BoostType, SubscriptionTier } from '../types'

/**
 * Hook for WuxiaToken operations
 */
export function useWuxiaToken(address?: string) {
  // Read contract state
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'totalSupply',
    config,
  }) as { data: bigint | undefined }

  const { data: maxSupply } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'MAX_SUPPLY',
    config,
  }) as { data: bigint | undefined }

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: bigint | undefined; refetch: () => void }

  // Write contract operations
  const { data: hash, writeContract: _writeContract, isPending, error } = useWriteContract({ config })

  /**
   * Mint tokens (owner only)
   */
  const mint = async (to: string, amount: number) => {
    const amountInWei = parseUnits(amount.toString(), 18)
    return _writeContract({
      address: CONTRACTS.WUXIA_TOKEN,
      abi: WuxiaTokenAbi.abi,
      functionName: 'mint',
      args: [to as `0x${string}`, amountInWei],
    })
  }

  /**
   * Burn tokens
   */
  const burn = async (amount: number) => {
    if (!address) throw new Error('No address connected')
    const amountInWei = parseUnits(amount.toString(), 18)
    return _writeContract({
      address: CONTRACTS.WUXIA_TOKEN,
      abi: WuxiaTokenAbi.abi,
      functionName: 'burn',
      args: [amountInWei],
    })
  }

  /**
   * Transfer tokens
   */
  const transfer = async (to: string, amount: number) => {
    if (!address) throw new Error('No address connected')
    const amountInWei = parseUnits(amount.toString(), 18)
    return _writeContract({
      address: CONTRACTS.WUXIA_TOKEN,
      abi: WuxiaTokenAbi.abi,
      functionName: 'transfer',
      args: [to as `0x${string}`, amountInWei],
    })
  }

  return {
    // Read state
    totalSupply: totalSupply ?? 0n,
    maxSupply: maxSupply ?? 0n,
    balance: balance ?? 0n,
    balanceFormatted: balance && totalSupply ? Number(formatUnits(balance, 18)).toFixed(2) : '0.00',
    totalSupplyFormatted: totalSupply ? Number(formatUnits(totalSupply, 18)).toFixed(0) : '0',

    // Write operations
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
