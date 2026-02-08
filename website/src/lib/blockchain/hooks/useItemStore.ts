'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS } from '../config'
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
 * Hook for ItemStore operations (boosts and subscriptions)
 */
export function useItemStore(address?: string) {
  // Read boost prices
  const { data: boostPrices, refetch: refetchBoostPrices } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'boostPrices',
    config,
  }) as { data: readonly bigint[] | undefined; refetch: () => void }

  // Read subscription prices
  const { data: subscriptionPrices, refetch: refetchSubscriptionPrices } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'subscriptionPrices',
    config,
  }) as { data: readonly bigint[] | undefined; refetch: () => void }

  // Check subscription status
  const { data: hasActiveSubscription, refetch: refetchSubscription } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'hasActiveSubscription',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: boolean | undefined; refetch: () => void }

  // Get subscription time remaining
  const { data: subscriptionTimeRemaining } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'getSubscriptionTimeRemaining',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: bigint | undefined }

  // Get subscription expiry
  const { data: subscriptionExpiry } = useReadContract({
    address: CONTRACTS.ITEM_STORE,
    abi: ItemStoreAbi.abi,
    functionName: 'subscriptionExpiry',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: bigint | undefined }

  // Write operations
  const { data: hash, writeContract: _writeContract, isPending, error } = useWriteContract({ config })

  /**
   * Buy a boost
   */
  const buyBoost = async (boostType: BoostType) => {
    if (!address) throw new Error('No address connected')
    return _writeContract({
      address: CONTRACTS.ITEM_STORE,
      abi: ItemStoreAbi.abi,
      functionName: 'buyBoost',
      args: [boostType],
    })
  }

  /**
   * Buy a subscription
   */
  const buySubscription = async (tier: SubscriptionTier) => {
    if (!address) throw new Error('No address connected')
    return _writeContract({
      address: CONTRACTS.ITEM_STORE,
      abi: ItemStoreAbi.abi,
      functionName: 'buySubscription',
      args: [tier],
    })
  }

  /**
   * Get all boosts with pricing
   */
  const getAllBoosts = (): Boost[] => {
    if (!boostPrices || boostPrices.length === 0) return []
    return Object.values(BoostType).filter((k): k is BoostType => typeof k === 'number').map((type) => {
      const price = boostPrices[type] || 0n
      return {
        type,
        ...BOOSTS[type],
        price,
        priceFormatted: `${Number(formatUnits(price, 18)).toFixed(2)} WUXIA`,
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
          priceFormatted: `${Number(formatUnits(price, 18)).toFixed(2)} WUXIA`,
        }
      })
  }

  /**
   * Get subscription info for current user
   */
  const getSubscriptionInfo = () => {
    if (!subscriptionExpiry || !subscriptionTimeRemaining) return null
    const expiry = subscriptionExpiry
    const timeRemaining = subscriptionTimeRemaining
    const isActive = hasActiveSubscription ?? false

    // Determine tier from expiry (approximate logic)
    let tier = SubscriptionTier.BRONZE
    if (isActive && expiry > 0n) {
      // In a real app, you'd store the tier or query it differently
      tier = SubscriptionTier.BRONZE // Default
    }

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
