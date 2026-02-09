/// <reference path="../../../types/abi.d.ts" />

'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS, TOKEN_DECIMALS, getGasLimit, parseTransactionError, getTransactionReceipt } from '../config'
import ItemStoreAbi from '../abis/ItemStore.json'
import { BoostType, SubscriptionTier } from '../types'

/**
 * Boost information
 */
export interface Boost {
  type: BoostType
  name: string
  price: bigint
  priceFormatted: string
  description: string
}

export interface BoostBase {
  name: string
  description: string
}

export const BOOSTS: Record<BoostType, BoostBase> = {
  [BoostType.SPEED_START]: {
    name: 'Speed Start',
    description: '+20% starting resources',
  },
  [BoostType.VISION_PLUS]: {
    name: 'Vision Plus',
    description: '+1 vision range',
  },
  [BoostType.LUCKY_SPAWN]: {
    name: 'Lucky Spawn',
    description: 'Guaranteed Spirit Vein nearby',
  },
  [BoostType.DOUBLE_XP]: {
    name: 'Double XP',
    description: 'Rating gain x2',
  },
}

/**
 * Subscription information
 */
export interface Subscription {
  tier: SubscriptionTier
  name: string
  price: bigint
  priceFormatted: string
  benefits: string[]
}

export interface SubscriptionBase {
  name: string
  benefits: string[]
}

export const SUBSCRIPTIONS: Record<SubscriptionTier, SubscriptionBase> = {
  [SubscriptionTier.BRONZE]: {
    name: 'Bronze Pass',
    benefits: ['Unlimited TRAINING games'],
  },
  [SubscriptionTier.SILVER]: {
    name: 'Silver Pass',
    benefits: ['Unlimited TRAINING games', '50% ARENA discount'],
  },
  [SubscriptionTier.GOLD]: {
    name: 'Gold Pass',
    benefits: [
      'Unlimited TRAINING games',
      '50% ARENA discount',
      'Priority Queue',
      'Beta access',
    ],
  },
}

/**
 * Item store operation result type
 */
export interface ItemStoreOperationResult {
  hash?: string
  success: boolean
  error?: string
  receipt?: { status: 'success' | 'reverted' }
}

/**
 * Type guard for bigint arrays
 * Validates that data is an array of bigint values
 */
function isBigIntArray(data: unknown): data is readonly bigint[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(item => typeof item === 'bigint')
  )
}

/**
 * Hook for ItemStore operations (boosts and subscriptions)
 * Enhanced with on-chain tier tracking (secure, not manipulatable)
 */
export function useItemStore(address?: string) {
  // Read boost prices
  const { data: boostPrices, refetch: refetchBoostPrices, isLoading: isLoadingBoostPrices } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'boostPrices',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  // Read subscription prices
  const { data: subscriptionPrices, refetch: refetchSubscriptionPrices, isLoading: isLoadingSubscriptionPrices } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'subscriptionPrices',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  // Check subscription status
  const { data: hasActiveSubscription, refetch: refetchSubscription } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'hasActiveSubscription',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Get subscription time remaining
  const { data: subscriptionTimeRemaining } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'getSubscriptionTimeRemaining',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Get subscription expiry
  const { data: subscriptionExpiry } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'subscriptionExpiry',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Get user's subscription tier from contract (SECURE - on-chain, not manipulatable)
  const { data: userTier, refetch: refetchUserTier } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'getUserTier',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Write operations
  const { writeContract, data: txHash, isPending, error } = useWriteContract({ config })

  /**
   * Buy a boost
   */
  const buyBoost = async (boostType: BoostType): Promise<ItemStoreOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      // writeContract updates txHash state upon completion
      // If it throws, transaction was rejected
      await writeContract({
        address: CONTRACTS.ITEM_STORE,
        abi: ItemStoreAbi.abi,
        functionName: 'buyBoost',
        args: [boostType],
        gas: getGasLimit('BOOST_PURCHASE'),
      })

      // Transaction submitted successfully, txHash is now available in hook state
      // Use setImmediate for reliable next-tick waiting (better than setTimeout)
      await new Promise(resolve => setImmediate(resolve))

      // Now read the current txHash from hook state (not from closure)
      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation
      await getTransactionReceipt(currentTxHash)

      // Refetch prices after purchase
      await refetchBoostPrices()

      return { hash: currentTxHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Buy a subscription
   * The tier is now stored on-chain and cannot be manipulated by users
   */
  const buySubscription = async (tier: SubscriptionTier): Promise<ItemStoreOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      await writeContract({
        address: CONTRACTS.ITEM_STORE,
        abi: ItemStoreAbi.abi,
        functionName: 'buySubscription',
        args: [tier],
        gas: getGasLimit('SUBSCRIPTION_PURCHASE'),
      })

      // Wait for state update to get current txHash (React batching)
      await new Promise(resolve => setImmediate(resolve))

      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation
      const receipt = await getTransactionReceipt(currentTxHash)

      // Refetch subscription info after successful transaction
      if (receipt.status === 'success') {
        await refetchSubscription()
        await refetchUserTier()
      }

      return { hash: currentTxHash, success: true, receipt }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Get all boosts with pricing
   */
  const getAllBoosts = (): Boost[] => {
    // Validate boostPrices is actually a bigint array
    if (!isBigIntArray(boostPrices)) return []

    return Object.values(BoostType)
      .filter((k): k is BoostType => typeof k === 'number')
      .map((type) => {
        const price = boostPrices![type] || 0n
        return {
          type,
          ...BOOSTS[type],
          price,
          priceFormatted: `${Number(formatUnits(price, TOKEN_DECIMALS)).toFixed(2)} WUXIA`,
        }
      })
  }

  /**
   * Get all subscriptions with pricing
   */
  const getAllSubscriptions = (): Subscription[] => {
    // Validate subscriptionPrices is actually a bigint array
    if (!isBigIntArray(subscriptionPrices)) return []

    return Object.values(SubscriptionTier)
      .filter((k): k is SubscriptionTier => typeof k === 'number')
      .map((tier) => {
        const price = subscriptionPrices![tier] || 0n
        return {
          tier,
          ...SUBSCRIPTIONS[tier],
          price,
          priceFormatted: `${Number(formatUnits(price, TOKEN_DECIMALS)).toFixed(2)} WUXIA`,
        }
      })
  }

  /**
   * Get user's subscription tier from contract
   *
   * SECURITY: This now reads from the on-chain `userTier` mapping which was added
   * to prevent the localStorage vulnerability. Users can no longer manipulate their
   * subscription tier to access premium features without paying.
   */
  const getUserTier = (): SubscriptionTier => {
    // Use the contract data - defaults to BRONZE (0) if not subscribed or expired
    return (userTier ?? SubscriptionTier.BRONZE) as SubscriptionTier
  }

  /**
   * Get subscription info for current user
   */
  const getSubscriptionInfo = () => {
    if (!subscriptionExpiry || !subscriptionTimeRemaining) return null
    const expiry = subscriptionExpiry
    const timeRemaining = subscriptionTimeRemaining
    const isActive = hasActiveSubscription ?? false

    // Get tier from on-chain contract (secure, not manipulatable)
    const tier = getUserTier()

    return {
      tier,
      expiry,
      timeRemaining,
      isActive,
      expiryDate: new Date(Number(expiry) * 1000),
      daysRemaining: Math.floor(Number(timeRemaining) / (24 * 60 * 60)),
    }
  }

  return {
    // Boosts
    boosts: getAllBoosts(),
    boostPrices: boostPrices ?? [0n, 0n, 0n, 0n],
    buyBoost,

    // Subscriptions
    subscriptions: getAllSubscriptions(),
    subscriptionPrices: subscriptionPrices ?? [0n, 0n, 0n],
    buySubscription,
    subscriptionInfo: getSubscriptionInfo(),
    userTier: getUserTier(),  // Expose the user's tier from contract
    hasActiveSubscription: hasActiveSubscription ?? false,
    subscriptionTimeRemaining: subscriptionTimeRemaining ?? 0n,
    subscriptionExpiry: subscriptionExpiry ?? 0n,

    // Loading states
    isLoading: isLoadingBoostPrices || isLoadingSubscriptionPrices,
    isLoadingBoostPrices,
    isLoadingSubscriptionPrices,

    // Utilities
    refetchBoostPrices,
    refetchSubscriptionPrices,
    refetchSubscription,
    refetchUserTier,

    // Transaction state
    isPending,
    error,
    txHash,
  }
}
