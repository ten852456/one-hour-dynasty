/// <reference path="../../../types/abi.d.ts" />

'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { config, CONTRACTS, TOKEN_DECIMALS, STAKING_LIMITS, getGasLimit, parseTransactionError, getTransactionReceipt, STAKING_SAFETY_BUFFER } from '../config'
import StakingAbi from '../abis/Staking.json'
import WuxiaTokenAbi from '../abis/WuxiaToken.json'

/**
 * Type definition for stake info returned from contract
 */
type StakeInfoData = {
  amount: bigint
  timestamp: bigint
  lockDuration: bigint
}

/**
 * Type guard for stake info structure
 * Validates that the data has the required properties
 */
function isStakeInfo(data: unknown): data is StakeInfoData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'amount' in data &&
    'timestamp' in data &&
    'lockDuration' in data
  )
}

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

/**
 * Staking operation result type
 */
export interface StakingOperationResult {
  hash?: string
  success: boolean
  error?: string
  receipt?: { status: 'success' | 'reverted' }
}

/**
 * Hook for Staking contract operations
 * Enhanced with transaction receipt waiting and approval flow
 */
export function useStaking(address?: string) {
  // Read stake tier thresholds from contract
  const { data: priorityStake } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'PRIORITY_STAKE',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  const { data: grandWarStake } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'GRAND_WAR_STAKE',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  const { data: governanceStake } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'GOVERNANCE_STAKE',
    config,
    query: {
      staleTime: 60_000,
    },
  })

  // Build staking tiers from contract data
  const stakingTiers: StakingTier[] = [
    {
      name: 'Priority Queue',
      stakeAmount: (priorityStake as bigint | undefined) || parseUnits('1000', TOKEN_DECIMALS),
      stakeAmountFormatted: Number(formatUnits((priorityStake as bigint | undefined) || parseUnits('1000', TOKEN_DECIMALS), TOKEN_DECIMALS)).toLocaleString(),
      stakeAmountRaw: formatUnits((priorityStake as bigint | undefined) || parseUnits('1000', TOKEN_DECIMALS), TOKEN_DECIMALS),
      benefits: ['Skip matchmaking queue'],
    },
    {
      name: 'Grand War',
      stakeAmount: (grandWarStake as bigint | undefined) || parseUnits('5000', TOKEN_DECIMALS),
      stakeAmountFormatted: Number(formatUnits((grandWarStake as bigint | undefined) || parseUnits('5000', TOKEN_DECIMALS), TOKEN_DECIMALS)).toLocaleString(),
      stakeAmountRaw: formatUnits((grandWarStake as bigint | undefined) || parseUnits('5000', TOKEN_DECIMALS), TOKEN_DECIMALS),
      benefits: ['Skip matchmaking queue', 'Access to Grand War tier'],
    },
    {
      name: 'Governance',
      stakeAmount: (governanceStake as bigint | undefined) || parseUnits('10000', TOKEN_DECIMALS),
      stakeAmountFormatted: Number(formatUnits((governanceStake as bigint | undefined) || parseUnits('10000', TOKEN_DECIMALS), TOKEN_DECIMALS)).toLocaleString(),
      stakeAmountRaw: formatUnits((governanceStake as bigint | undefined) || parseUnits('10000', TOKEN_DECIMALS), TOKEN_DECIMALS),
      benefits: [
        'Skip matchmaking queue',
        'Access to Grand War tier',
        'Governance voting rights',
      ],
    },
  ]

  // Check token allowance for staking contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.WUXIA_TOKEN,
    abi: WuxiaTokenAbi.abi,
    functionName: 'allowance',
    args: address ? [address as `0x${string}`, CONTRACTS.STAKING] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Read stake info
  const { data: stakeInfo, refetch: refetchStake, isLoading: isLoadingStake } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'stakes',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  // Check tier access
  const { data: hasPriorityQueue } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'hasPriorityQueue',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  const { data: canAccessGrandWar } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'canAccessGrandWar',
    args: address ? [address as `0x${string}`] : undefined,
    config,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  })

  const { data: hasGovernanceRights } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: StakingAbi.abi,
    functionName: 'hasGovernanceRights',
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
   * Validate stake amount
   */
  const validateStakeAmount = (amount: number): { valid: boolean; error?: string } => {
    if (isNaN(amount) || amount < STAKING_LIMITS.MIN_AMOUNT) {
      return { valid: false, error: `Amount must be at least ${STAKING_LIMITS.MIN_AMOUNT} WUXIA` }
    }
    if (amount > STAKING_LIMITS.MAX_AMOUNT) {
      return { valid: false, error: `Amount cannot exceed ${STAKING_LIMITS.MAX_AMOUNT.toLocaleString()} WUXIA` }
    }
    return { valid: true }
  }

  /**
   * Approve staking contract to spend tokens
   * SECURITY: Approves MAX_STAKE_AMOUNT instead of unlimited (MaxUint256)
   * This is safer as it limits the contract's access to your tokens
   */
  const approveStaking = async (): Promise<StakingOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      // SECURITY: Approve a reasonable maximum instead of unlimited
      // This limits potential damage if contract is compromised
      const maxApproval = parseUnits(STAKING_LIMITS.MAX_AMOUNT.toString(), TOKEN_DECIMALS)

      await writeContract({
        address: CONTRACTS.WUXIA_TOKEN,
        abi: WuxiaTokenAbi.abi,
        functionName: 'approve',
        args: [CONTRACTS.STAKING, maxApproval], // Limited approval, not unlimited
        gas: getGasLimit('TOKEN_TRANSFER'),
      })

      // Wait for state update to get current txHash
      await new Promise(resolve => setTimeout(resolve, 0))
      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation
      await getTransactionReceipt(currentTxHash)

      // Refetch allowance
      await refetchAllowance()

      return { hash: currentTxHash, success: true }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Check if approval is needed
   */
  const needsApproval = (amount: bigint): boolean => {
    const currentAllowance = (allowance as bigint | undefined) || 0n
    return currentAllowance < amount
  }

  /**
   * Stake tokens with validation and approval check
   * @param amount Amount to stake in WUXIA (human-readable, e.g., 1000)
   * @param lockDuration Lock duration in seconds (0 = no lock)
   */
  const stake = async (amount: number, lockDuration: number): Promise<StakingOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      // Validate amount
      const validation = validateStakeAmount(amount)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Validate lock duration
      if (lockDuration < 0) {
        return { success: false, error: 'Lock duration cannot be negative' }
      }

      const amountInWei = parseUnits(amount.toString(), TOKEN_DECIMALS)

      // Check if approval is needed
      if (needsApproval(amountInWei)) {
        return {
          success: false,
          error: 'Approval required. Please approve the staking contract to spend your WUXIA tokens first.'
        }
      }

      await writeContract({
        address: CONTRACTS.STAKING,
        abi: StakingAbi.abi,
        functionName: 'stake',
        args: [amountInWei, BigInt(lockDuration)],
        gas: getGasLimit('STAKE'),
      })

      // Wait for state update to get current txHash
      await new Promise(resolve => setTimeout(resolve, 0))
      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation before refetching
      const receipt = await getTransactionReceipt(currentTxHash)

      // Only refetch if transaction was successful
      if (receipt.status === 'success') {
        await refetchStake()
      }

      return { hash: currentTxHash, success: true, receipt }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Unstake tokens
   */
  const unstake = async (): Promise<StakingOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      await writeContract({
        address: CONTRACTS.STAKING,
        abi: StakingAbi.abi,
        functionName: 'unstake',
        gas: getGasLimit('UNSTAKE'),
      })

      // Wait for state update to get current txHash
      await new Promise(resolve => setTimeout(resolve, 0))
      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation before refetching
      const receipt = await getTransactionReceipt(currentTxHash)

      // Only refetch if transaction was successful
      if (receipt.status === 'success') {
        await refetchStake()
      }

      return { hash: currentTxHash, success: true, receipt }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Increase existing stake
   * @param additionalAmount Additional amount to stake in WUXIA
   */
  const increaseStake = async (additionalAmount: number): Promise<StakingOperationResult> => {
    try {
      if (!address) throw new Error('No address connected')

      // Validate amount
      const validation = validateStakeAmount(additionalAmount)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const amountInWei = parseUnits(additionalAmount.toString(), TOKEN_DECIMALS)

      // Check if approval is needed
      if (needsApproval(amountInWei)) {
        return {
          success: false,
          error: 'Approval required. Please approve the staking contract to spend your WUXIA tokens first.'
        }
      }

      await writeContract({
        address: CONTRACTS.STAKING,
        abi: StakingAbi.abi,
        functionName: 'increaseStake',
        args: [amountInWei],
        gas: getGasLimit('INCREASE_STAKE'),
      })

      // Wait for state update to get current txHash
      await new Promise(resolve => setTimeout(resolve, 0))
      const currentTxHash = txHash

      if (!currentTxHash) {
        return { success: false, error: 'Transaction failed - no hash returned' }
      }

      // Wait for transaction confirmation before refetching
      const receipt = await getTransactionReceipt(currentTxHash)

      // Only refetch if transaction was successful
      if (receipt.status === 'success') {
        await refetchStake()
      }

      return { hash: currentTxHash, success: true, receipt }
    } catch (err) {
      const parsedError = parseTransactionError(err)
      return { success: false, error: parsedError.message }
    }
  }

  /**
   * Calculate if user can unstake based on lock period
   *
   * SECURITY WARNING: This uses client-side time for UI display only.
   * The actual unstake transaction will revert if the lock period hasn't expired.
   * Users cannot bypass the blockchain's time check, but the UI may show incorrect info.
   *
   * TODO: Add canUnstake() view function to contract for authoritative answer
   *
   * Uses blockchain timestamp (from stakeInfo) with safety buffer
   */
  const canUnstake = () => {
    if (!isStakeInfo(stakeInfo)) return false
    const { amount, timestamp, lockDuration } = stakeInfo
    if (!amount || amount === 0n) return false
    if (!lockDuration || lockDuration === 0n) return true

    // Use blockchain timestamp from contract
    const lockEndTime = Number(timestamp) + Number(lockDuration)

    // Add safety buffer from config (default: 300 seconds / 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)

    return currentTime >= (lockEndTime + STAKING_SAFETY_BUFFER)
  }

  /**
   * Get time remaining until lock expires
   * Includes safety buffer
   */
  const getLockTimeRemaining = () => {
    if (!isStakeInfo(stakeInfo)) return 0
    const { timestamp, lockDuration } = stakeInfo
    if (!lockDuration || lockDuration === 0n) return 0

    const lockEndTime = Number(timestamp) + Number(lockDuration)
    const currentTime = Math.floor(Date.now() / 1000)

    const remaining = (lockEndTime + STAKING_SAFETY_BUFFER) - currentTime
    return Math.max(0, remaining)
  }

  /**
   * Get formatted stake information
   */
  const getFormattedStakeInfo = () => {
    if (!isStakeInfo(stakeInfo)) return null
    const { amount, timestamp, lockDuration } = stakeInfo
    if (!amount || amount === 0n) return null

    return {
      amount,
      amountFormatted: Number(formatUnits(amount, TOKEN_DECIMALS)).toLocaleString(),
      timestamp: Number(timestamp),
      lockDuration: Number(lockDuration),
      lockDurationDays: Math.floor(Number(lockDuration) / (24 * 60 * 60)),
      canUnstake: canUnstake(),
      lockTimeRemaining: getLockTimeRemaining(),
      lockTimeRemainingDays: Math.floor(getLockTimeRemaining() / (24 * 60 * 60)),
      stakedDate: new Date(Number(timestamp) * 1000),
      unlockDate:
        lockDuration && lockDuration > 0n
          ? new Date((Number(timestamp) + Number(lockDuration) + STAKING_SAFETY_BUFFER) * 1000) // Include safety buffer
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

    // Tiers (now read from contract)
    stakingTiers,

    // Allowance
    allowance: allowance ?? 0n,
    needsApproval,
    refetchAllowance,

    // Operations (now with proper return types)
    stake,
    unstake,
    increaseStake,
    approveStaking,

    // Validation
    validateStakeAmount,

    // Utilities
    refetchStake,
    canUnstake: canUnstake(),
    lockTimeRemaining: getLockTimeRemaining(),

    // Loading state
    isLoading: isLoadingStake,

    // Transaction state
    isPending,
    error,
  }
}
