'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS } from '../config'
import StakingAbi from '../abis/Staking.json'

/**
 * Staking tier information
 */
export interface StakingTier {
  name: string
  stakeAmount: bigint
  stakeAmountFormatted: string
  stakeAmountRaw: string  // Raw number without commas for input fields
  benefits: string[]
}

export const STAKING_TIERS: StakingTier[] = [
  {
    name: 'Priority Queue',
    stakeAmount: parseUnits('1000', 18),
    stakeAmountFormatted: '1,000',
    stakeAmountRaw: '1000',
    benefits: ['Skip matchmaking queue'],
  },
  {
    name: 'Grand War',
    stakeAmount: parseUnits('5000', 18),
    stakeAmountFormatted: '5,000',
    stakeAmountRaw: '5000',
    benefits: ['Skip matchmaking queue', 'Access to Grand War tier'],
  },
  {
    name: 'Governance',
    stakeAmount: parseUnits('10000', 18),
    stakeAmountFormatted: '10,000',
    stakeAmountRaw: '10000',
    benefits: [
      'Skip matchmaking queue',
      'Access to Grand War tier',
      'Governance voting rights',
    ],
  },
]

/**
 * Hook for Staking contract operations
 */
export function useStaking(address?: string) {
  // Read stake info
  const { data: stakeInfo, refetch: refetchStake } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'stakes',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: { amount: bigint; timestamp: bigint; lockDuration: bigint } | undefined; refetch: () => void }

  // Check tier access
  const { data: hasPriorityQueue } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'hasPriorityQueue',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: boolean | undefined }

  const { data: canAccessGrandWar } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'canAccessGrandWar',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: boolean | undefined }

  const { data: hasGovernanceRights } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'hasGovernanceRights',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
    },
  }) as { data: boolean | undefined }

  // Write operations
  const { data: hash, writeContract: _writeContract, isPending, error } = useWriteContract({ config })

  /**
   * Stake tokens
   * @param amount Amount to stake in WUXIA (human-readable, e.g., 1000)
   * @param lockDuration Lock duration in seconds (0 = no lock)
   */
  const stake = async (amount: number, lockDuration: number) => {
    if (!address) throw new Error('No address connected')
    const amountInWei = parseUnits(amount.toString(), 18)
    return _writeContract({
      address: CONTRACTS.STAKING,
      abi: StakingAbi.abi,
      functionName: 'stake',
      args: [amountInWei, BigInt(lockDuration)],
    })
  }

  /**
   * Unstake tokens
   */
  const unstake = async () => {
    if (!address) throw new Error('No address connected')
    return _writeContract({
      address: CONTRACTS.STAKING,
      abi: StakingAbi.abi,
      functionName: 'unstake',
    })
  }

  /**
   * Increase existing stake
   * @param additionalAmount Additional amount to stake in WUXIA
   */
  const increaseStake = async (additionalAmount: number) => {
    if (!address) throw new Error('No address connected')
    const amountInWei = parseUnits(additionalAmount.toString(), 18)
    return _writeContract({
      address: CONTRACTS.STAKING,
      abi: StakingAbi.abi,
      functionName: 'increaseStake',
      args: [amountInWei],
    })
  }

  /**
   * Calculate if user can unstake based on lock period
   */
  const canUnstake = () => {
    if (!stakeInfo) return false
    const { amount, timestamp, lockDuration } = stakeInfo
    if (!amount || amount === 0n) return false
    if (!lockDuration || lockDuration === 0n) return true
    const lockEndTime = Number(timestamp) + Number(lockDuration)
    return Date.now() / 1000 >= lockEndTime
  }

  /**
   * Get time remaining until lock expires
   */
  const getLockTimeRemaining = () => {
    if (!stakeInfo) return 0
    const { timestamp, lockDuration } = stakeInfo
    if (!lockDuration || lockDuration === 0n) return 0
    const lockEndTime = Number(timestamp) + Number(lockDuration)
    const remaining = lockEndTime - Date.now() / 1000
    return Math.max(0, remaining)
  }

  /**
   * Get formatted stake information
   */
  const getFormattedStakeInfo = () => {
    if (!stakeInfo) return null
    const { amount, timestamp, lockDuration } = stakeInfo
    if (!amount || amount === 0n) return null

    return {
      amount,
      amountFormatted: Number(formatUnits(amount, 18)).toLocaleString(),
      timestamp: Number(timestamp),
      lockDuration: Number(lockDuration),
      lockDurationDays: Math.floor(Number(lockDuration) / (24 * 60 * 60)),
      canUnstake: canUnstake(),
      lockTimeRemaining: getLockTimeRemaining(),
      lockTimeRemainingDays: Math.floor(getLockTimeRemaining() / (24 * 60 * 60)),
      stakedDate: new Date(Number(timestamp) * 1000),
      unlockDate:
        lockDuration && lockDuration > 0n
          ? new Date((Number(timestamp) + Number(lockDuration)) * 1000)
          : null,
      hasPriorityQueue: hasPriorityQueue ?? false,
      canAccessGrandWar: canAccessGrandWar ?? false,
      hasGovernanceRights: hasGovernanceRights ?? false,
    }
  }

  return {
    // Read state
    stakeInfo: getFormattedStakeInfo(),
    hasPriorityQueue: hasPriorityQueue ?? false,
    canAccessGrandWar: canAccessGrandWar ?? false,
    hasGovernanceRights: hasGovernanceRights ?? false,

    // Tiers
    stakingTiers: STAKING_TIERS,

    // Operations
    stake,
    unstake,
    increaseStake,

    // Utilities
    refetchStake,
    canUnstake: canUnstake(),
    lockTimeRemaining: getLockTimeRemaining(),

    // Transaction state
    isPending,
    error,
    txHash: hash,
  }
}
