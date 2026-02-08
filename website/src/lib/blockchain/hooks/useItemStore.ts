'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS, TOKEN_DECIMALS, getGasLimit, parseTransactionError } from '../config'
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
}

/**
 * Hook for ItemStore operations (boosts and subscriptions)
 * Enhanced with proper error handling
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

  // Write operations
  const { data: hash, writeContract: _writeContract, isPending, error } = useWriteContract({ config })

  /**
   * Buy a boost
   */
  const buyBoost = async (boostType: BoostType): Promise<ItemStoreOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      const txHash = await _writeContract({
        address: CONTRACTS.ITEM_STORE,
        abi: ItemStoreAbi.abi,
        functionName: 'buyBoost',
        args: [boostType],
        gas: getGasLimit('BOOST_PURCHASE'),
      })

      // Refetch prices after purchase
      await refetchBoostPrices()

      return { hash: txHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Buy a subscription
   */
  const buySubscription = async (tier: SubscriptionTier): Promise<ItemStoreOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      const txHash = await _writeContract({
        address: CONTRACTS.ITEM_STORE,
        abi: ItemStoreAbi.abi,
        functionName: 'buySubscription',
        args: [tier],
        gas: getGasLimit('SUBSCRIPTION_PURCHASE'),
      })

      // Store the purchased tier in localStorage for later retrieval
      // TODO: This is a workaround. The contract should store the tier.
      // Consider adding a getUserTier() function to the contract.
      try {
        const userTiers = JSON.parse(localStorage.getItem('subscriptionTiers') || '{}')
        userTiers[address.toLowerCase()] = {
          tier,
          timestamp: Date.now(),
        }
        localStorage.setItem('subscriptionTiers', JSON.stringify(userTiers))
      } catch (e) {
        console.warn('Failed to store subscription tier:', e)
      }

      // Refetch subscription info after purchase
      await refetchSubscription()

      return { hash: txHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Get all boosts with pricing
   */
  const getAllBoosts = (): Boost[] => {
    if (!boostPrices || boostPrices.length === 0) return []
    return Object.values(BoostType)
      .filter((k): k is BoostType => typeof k === 'number')
      .map((type) => {
        const price = boostPrices[type] || 0n
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
    if (!subscriptionPrices || subscriptionPrices.length === 0) return []
    return Object.values(SubscriptionTier)
      .filter((k): k is SubscriptionTier => typeof k === 'number')
      .map((tier) => {
        const price = subscriptionPrices[tier] || 0n
        return {
          tier,
          ...SUBSCRIPTIONS[tier],
          price,
          priceFormatted: `${Number(formatUnits(price, TOKEN_DECIMALS)).toFixed(2)} WUXIA`,
        }
      })
  }

  /**
   * Get user's subscription tier from localStorage
   * This is a workaround until the contract is updated to store the tier
   */
  const getUserTier = (): SubscriptionTier => {
    if (!address) return SubscriptionTier.BRONZE

    try {
      const userTiers = JSON.parse(localStorage.getItem('subscriptionTiers') || '{}')
      const stored = userTiers[address.toLowerCase()]
      if (stored && stored.timestamp) {
        // Check if the stored tier is still valid (within the subscription period)
        const expiryTime = Number(subscriptionExpiry || 0n) * 1000
        if (Date.now() < expiryTime) {
          return stored.tier
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve subscription tier:', e)
    }

    return SubscriptionTier.BRONZE
  }

  /**
   * Get subscription info for current user
   */
  const getSubscriptionInfo = () => {
    if (!subscriptionExpiry || !subscriptionTimeRemaining) return null
    const expiry = subscriptionExpiry
    const timeRemaining = subscriptionTimeRemaining
    const isActive = hasActiveSubscription ?? false

    // Get tier from localStorage (workaround)
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

    // Transaction state
    isPending,
    error,
    txHash: hash,
  }
}
