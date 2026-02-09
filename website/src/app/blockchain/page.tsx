'use client'

import { useWalletConnection } from '@/lib/blockchain/hooks/useWalletConnection'
import { useWuxiaToken } from '@/lib/blockchain/hooks/useWuxiaToken'
import { useItemStore } from '@/lib/blockchain/hooks/useItemStore'
import { useStaking } from '@/lib/blockchain/hooks/useStaking'
import { BoostType, SubscriptionTier } from '@/lib/blockchain/types'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { STAKING_LIMITS, TOKEN_DECIMALS, parseUnits, MONAD_TESTNET } from '@/lib/blockchain/config'

/**
 * Constants for default values
 */
const DEFAULT_STAKE_AMOUNT = '1000'
const DEFAULT_LOCK_DURATION = '0'

/**
 * Input validation constraints
 */
const INPUT_CONSTRAINTS = {
  DECIMAL_PLACES: 6, // Maximum decimal places for stake amount
  MIN_STEP: '0.000001', // Minimum step for precision
} as const

export default function BlockchainPage() {
  const { address, isConnected } = useWalletConnection()
  const { balance, totalSupplyFormatted, balanceFormatted, isLoading: isLoadingToken } = useWuxiaToken(address)
  const {
    boosts,
    subscriptions,
    buyBoost,
    buySubscription,
    subscriptionInfo,
    isPending: itemStorePending,
    isLoading: isLoadingItemStore,
  } = useItemStore(address)
  const {
    stakeInfo,
    stakingTiers,
    stake,
    unstake,
    canUnstake,
    isPending: stakingPending,
    validateStakeAmount,
    isLoading: isLoadingStaking,
    allowance,
    approveStaking,
    needsApproval,
    refetchAllowance,
  } = useStaking(address)

  const [selectedStakeAmount, setSelectedStakeAmount] = useState(DEFAULT_STAKE_AMOUNT)
  const [selectedLockDuration, setSelectedLockDuration] = useState(DEFAULT_LOCK_DURATION)
  const [stakeError, setStakeError] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [txSuccess, setTxSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'enhancements' | 'memberships' | 'offerings'>('overview')
  const [showApproval, setShowApproval] = useState(false)

  // Quick action to switch tabs
  const goToMemberships = () => setActiveTab('memberships')
  const goToEnhancements = () => setActiveTab('enhancements')
  const goToOfferings = () => setActiveTab('offerings')

  // Auto-fill stake amount from tier (raw number without commas)
  const selectTier = useCallback((amountRaw: string) => {
    setSelectedStakeAmount(amountRaw)
    setActiveTab('offerings')
  }, [])

  /**
   * Validate stake amount with comprehensive checks
   * Blocks unsafe inputs, validates range, precision, and format
   */
  const validateStakeAmountInput = useCallback((value: string): { valid: boolean; error?: string } => {
    // Empty input is valid (user hasn't finished typing)
    if (!value) return { valid: true }

    // Check for scientific notation (block before number conversion)
    if (value.toLowerCase().includes('e')) {
      return { valid: false, error: 'Scientific notation not allowed' }
    }

    // Check for negative numbers
    if (value.startsWith('-')) {
      return { valid: false, error: 'Negative amounts are not allowed' }
    }

    // Check for multiple decimal points
    if ((value.match(/\./g) || []).length > 1) {
      return { valid: false, error: 'Invalid number format' }
    }

    // Check for non-numeric characters (except decimal point)
    if (!/^[\d.]+$/.test(value)) {
      return { valid: false, error: 'Only numbers and decimal points are allowed' }
    }

    // Now it's safe to convert to number
    const numValue = Number(value)

    // Check if conversion resulted in valid number
    if (isNaN(numValue)) {
      return { valid: false, error: 'Please enter a valid number' }
    }

    // Check for numbers that are too large (beyond safe integer range)
    if (!Number.isFinite(numValue)) {
      return { valid: false, error: 'Number is too large' }
    }

    // Check decimal places precision
    if (value.includes('.')) {
      const decimalPlaces = value.split('.')[1]?.length || 0
      if (decimalPlaces > INPUT_CONSTRAINTS.DECIMAL_PLACES) {
        return { valid: false, error: `Maximum ${INPUT_CONSTRAINTS.DECIMAL_PLACES} decimal places allowed` }
      }
    }

    // Check range limits
    if (numValue < STAKING_LIMITS.MIN_AMOUNT) {
      return { valid: false, error: `Amount must be at least ${STAKING_LIMITS.MIN_AMOUNT} WUXIA` }
    }
    if (numValue > STAKING_LIMITS.MAX_AMOUNT) {
      return { valid: false, error: `Amount cannot exceed ${STAKING_LIMITS.MAX_AMOUNT.toLocaleString()} WUXIA` }
    }

    return { valid: true }
  }, [])

  // Validate stake amount on change
  const handleStakeAmountChange = useCallback((value: string) => {
    setSelectedStakeAmount(value)
    setStakeError(null)

    const validation = validateStakeAmountInput(value)
    if (!validation.valid && value) {
      setStakeError(validation.error || null)
    }
  }, [validateStakeAmountInput])

  // Handle stake transaction with error handling and approval flow
  const handleStake = useCallback(async () => {
    setTxError(null)
    setTxSuccess(null)
    setTxHash(null)

    const amount = Number(selectedStakeAmount)
    const validation = validateStakeAmount(amount)

    if (!validation.valid) {
      setStakeError(validation.error || null)
      return
    }

    // Check if approval is needed first
    const amountInWei = parseUnits(amount.toString(), TOKEN_DECIMALS)
    if (needsApproval(amountInWei)) {
      setShowApproval(true)
      return
    }

    const result = await stake(amount, Number(selectedLockDuration) * 24 * 60 * 60)

    if (result.success) {
      setTxSuccess('Staking transaction submitted!')
      setTxHash(result.hash || null)
      setSelectedStakeAmount(DEFAULT_STAKE_AMOUNT)
      setSelectedLockDuration(DEFAULT_LOCK_DURATION)
      setStakeError(null)
    } else {
      setTxError(result.error || 'Transaction failed')
    }
  }, [selectedStakeAmount, selectedLockDuration, stake, validateStakeAmount, needsApproval])

  /**
   * Handle approval with proper async handling
   * FIXED: Remove stale needsApproval check after refetch
   */
  const handleApprove = useCallback(async () => {
    setTxError(null)
    setTxSuccess(null)
    setTxHash(null)

    const result = await approveStaking()

    if (result.success) {
      // Refetch allowance to update hook state
      // Note: We DON'T re-check needsApproval here to avoid race condition
      // The allowance will be updated by the time user tries to stake
      await refetchAllowance()

      setTxSuccess('Contract approved! You can now stake your tokens.')
      setTxHash(result.hash || null)
      setShowApproval(false)
    } else {
      setTxError(result.error || 'Approval failed')
    }
  }, [approveStaking, refetchAllowance])

  /**
   * Handle buy boost with error handling
   */
  const handleBuyBoost = useCallback(async (boostType: BoostType) => {
    setTxError(null)
    setTxSuccess(null)
    setTxHash(null)

    const result = await buyBoost(boostType)

    if (result.success) {
      setTxSuccess('Boost purchased successfully!')
      setTxHash(result.hash || null)
    } else {
      setTxError(result.error || 'Transaction failed')
    }
  }, [buyBoost])

  /**
   * Handle buy subscription with error handling
   */
  const handleBuySubscription = useCallback(async (tier: SubscriptionTier) => {
    setTxError(null)
    setTxSuccess(null)
    setTxHash(null)

    const result = await buySubscription(tier)

    if (result.success) {
      setTxSuccess('Subscription purchased successfully!')
      setTxHash(result.hash || null)
    } else {
      setTxError(result.error || 'Transaction failed')
    }
  }, [buySubscription])

  /**
   * Handle unstake with error handling
   */
  const handleUnstake = useCallback(async () => {
    setTxError(null)
    setTxSuccess(null)
    setTxHash(null)

    const result = await unstake()

    if (result.success) {
      setTxSuccess('Unstake transaction submitted!')
      setTxHash(result.hash || null)
    } else {
      setTxError(result.error || 'Transaction failed')
    }
  }, [unstake])

  /**
   * Get explorer URL for transaction
   */
  const getExplorerUrl = useCallback((hash: string) => {
    return `${MONAD_TESTNET.blockExplorers.default.url}/tx/${hash}`
  }, [])

  // Optimize animation positions with useMemo
  const animationParticles = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${10 + Math.random() * 10}s`,
    }))
  }, [])

  // Loading state
  const isLoading = isLoadingToken || isLoadingItemStore || isLoadingStaking
  const isTxPending = itemStorePending || stakingPending

  // Clear success message after 5 seconds
  useEffect(() => {
    if (txSuccess) {
      const timer = setTimeout(() => setTxSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [txSuccess])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-red-950/10 to-black overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            {animationParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 bg-yellow-500/20 rounded-full animate-float"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animationDelay: particle.animationDelay,
                  animationDuration: particle.animationDuration,
                }}
              />
            ))}
          </div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-32">
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="text-7xl animate-float" style={{ animationDuration: '6s' }}>⛓️</span>
                </div>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-red-500 to-yellow-600 blur-2xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
              <h1 className="relative text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                Imperial Treasury
              </h1>
            </div>

            <p className="relative text-xl md:text-2xl text-gray-400 mb-12">
              Connect your wallet to access the <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">Sect Treasury</span>
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-500/50" />
              <span className="text-yellow-500/50 text-2xl">✦</span>
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-500/50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950/10 to-black overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          {animationParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-yellow-500/20 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
              }}
            />
          ))}
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-red-500 to-yellow-600 blur-2xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                <h1 className="relative text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                  Imperial Treasury
                </h1>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Manage your sect's resources
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-gradient-to-br from-red-950/50 to-black border border-red-900/50 rounded-lg px-4 py-2 text-center min-w-[120px]">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-lg font-bold text-yellow-400">{isLoading ? '...' : balanceFormatted}</p>
              </div>
              {subscriptionInfo?.isActive && (
                <div className="bg-gradient-to-br from-red-950/50 to-black border border-green-900/50 rounded-lg px-4 py-2 text-center min-w-[120px]">
                  <p className="text-xs text-gray-400">Member</p>
                  <p className="text-sm font-bold text-green-400">{subscriptionInfo.daysRemaining}d</p>
                </div>
              )}
              {stakeInfo && (
                <div className="bg-gradient-to-br from-red-950/50 to-black border border-yellow-900/50 rounded-lg px-4 py-2 text-center min-w-[120px]">
                  <p className="text-xs text-gray-400">Staked</p>
                  <p className="text-sm font-bold text-yellow-400">{stakeInfo.amountFormatted}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Error/Success Messages */}
          {txError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg" role="alert">
              <p className="text-red-400 text-sm">{txError}</p>
            </div>
          )}
          {txSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg" role="status">
              <p className="text-green-400 text-sm mb-2">{txSuccess}</p>
              {txHash && (
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-300 text-xs hover:text-green-200 underline"
                >
                  View transaction →
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-red-900/30">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'overview'
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('enhancements')}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'enhancements'
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Enhancements
            </button>
            <button
              onClick={() => setActiveTab('memberships')}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'memberships'
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Memberships
            </button>
            <button
              onClick={() => setActiveTab('offerings')}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'offerings'
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Offerings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gradient-to-br from-red-950/50 to-black border-2 border-red-900/50 rounded-xl p-6 backdrop-blur-sm">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Balance Card */}
              <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <h3 className="text-sm font-semibold text-yellow-400">WUXIA Balance</h3>
                </div>
                <p className="text-2xl font-bold text-white">{isLoading ? '...' : balanceFormatted}</p>
                <p className="text-xs text-gray-500 mt-1">Total: {totalSupplyFormatted}</p>
              </div>

              {/* Subscription Card */}
              <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👑</span>
                  <h3 className="text-sm font-semibold text-yellow-400">Membership</h3>
                </div>
                {subscriptionInfo?.isActive ? (
                  <>
                    <p className="text-lg font-bold text-green-400">Active</p>
                    <p className="text-xs text-gray-400">{subscriptionInfo.daysRemaining} days left</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-400">None</p>
                    <button
                      onClick={goToMemberships}
                      className="text-xs text-yellow-400 hover:text-yellow-300 underline mt-1"
                    >
                      View memberships →
                    </button>
                  </>
                )}
              </div>

              {/* Staking Card */}
              <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏔️</span>
                  <h3 className="text-sm font-semibold text-yellow-400">Sect Offering</h3>
                </div>
                {stakeInfo ? (
                  <>
                    <p className="text-lg font-bold text-white">{stakeInfo.amountFormatted}</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {stakeInfo.hasPriorityQueue && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">Priority</span>}
                      {stakeInfo.canAccessGrandWar && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Grand War</span>}
                      {stakeInfo.hasGovernanceRights && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded">Governance</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-400">0</p>
                    <button
                      onClick={goToOfferings}
                      className="text-xs text-yellow-400 hover:text-yellow-300 underline mt-1"
                    >
                      Make offering →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Enhancements Tab */}
          {activeTab === 'enhancements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {boosts.map((boost) => (
                <div
                  key={boost.type}
                  className="bg-black/50 border border-red-900/30 rounded-lg p-4 hover:border-yellow-500/60 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">✦</span>
                    <h4 className="text-sm font-semibold text-white">{boost.name}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{boost.description}</p>
                  <button
                    onClick={() => handleBuyBoost(boost.type)}
                    disabled={isTxPending}
                    className="w-full px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded text-sm font-medium transition-all hover:scale-105 disabled:scale-100"
                  >
                    {boost.priceFormatted}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Memberships Tab */}
          {activeTab === 'memberships' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptions.map((sub, idx) => (
                <div
                  key={sub.tier}
                  className={`bg-black/50 border rounded-lg p-4 transition-all hover:border-yellow-500/60 ${
                    idx === 0
                      ? 'border-amber-900/50'
                      : idx === 1
                      ? 'border-gray-600/50'
                      : 'border-yellow-600/50'
                  }`}
                >
                  <h4 className="text-lg font-bold text-white mb-2">{sub.name}</h4>
                  <ul className="text-xs text-gray-400 space-y-1 mb-3">
                    {sub.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleBuySubscription(sub.tier)}
                    disabled={isTxPending}
                    className="w-full px-3 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded text-sm font-medium transition-all hover:scale-105 disabled:scale-100"
                  >
                    {sub.priceFormatted}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Offerings Tab */}
          {activeTab === 'offerings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tiers */}
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <span>✦</span>
                  Offering Tiers
                  <span className="text-xs text-gray-500 font-normal">(Click to select)</span>
                </h3>
                <div className="space-y-2">
                  {stakingTiers.map((tier, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectTier(tier.stakeAmountRaw)}
                      className="w-full bg-black/50 border border-red-900/30 rounded-lg p-3 text-left hover:border-yellow-500/60 hover:bg-red-950/30 transition-all group"
                    >
                      <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">{tier.name}</h4>
                      <p className="text-yellow-400 text-sm font-medium">{tier.stakeAmountFormatted} WUXIA</p>
                      <ul className="text-xs text-gray-400 space-y-0.5 mt-2">
                        {tier.benefits.map((benefit, bidx) => (
                          <li key={bidx} className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Form */}
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <span>✦</span>
                  Make Offering
                </h3>
                <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
                  <div className="space-y-3">
                    {/* Approval Notice */}
                    {showApproval && (
                      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <p className="text-yellow-400 text-sm font-medium mb-2">
                          Approval Required
                        </p>
                        <p className="text-yellow-400/80 text-xs mb-3">
                          You need to approve the staking contract to spend your WUXIA tokens. This is a one-time approval.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleApprove}
                            disabled={isTxPending}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded text-sm font-medium transition-all hover:scale-105 disabled:scale-100"
                            aria-label="Approve staking contract to spend WUXIA tokens"
                          >
                            {isTxPending ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setShowApproval(false)}
                            className="px-3 py-2 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 rounded text-sm transition-all"
                            aria-label="Cancel approval"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1" htmlFor="stake-amount">
                        Amount (WUXIA)
                      </label>
                      <input
                        id="stake-amount"
                        type="number"
                        min={STAKING_LIMITS.MIN_AMOUNT}
                        max={STAKING_LIMITS.MAX_AMOUNT}
                        step="any"
                        value={selectedStakeAmount}
                        onChange={(e) => handleStakeAmountChange(e.target.value)}
                        aria-describedby="stake-amount-error"
                        aria-invalid={!!stakeError}
                        className={`w-full px-3 py-2 bg-gray-900/50 border ${stakeError ? 'border-red-500' : 'border-red-900/50'} rounded text-white text-sm focus:outline-none focus:border-yellow-500/60`}
                        placeholder="1000"
                      />
                      {stakeError && (
                        <p id="stake-amount-error" className="text-red-400 text-xs mt-1" role="alert">{stakeError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1" htmlFor="lock-duration">
                        Lock Duration (days)
                      </label>
                      <input
                        id="lock-duration"
                        type="number"
                        min="0"
                        value={selectedLockDuration}
                        onChange={(e) => setSelectedLockDuration(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/50 rounded text-white text-sm focus:outline-none focus:border-yellow-500/60"
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={handleStake}
                      disabled={isTxPending || !!stakeError}
                      className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded text-sm font-medium transition-all hover:scale-105 disabled:scale-100"
                      aria-label={`Stake ${selectedStakeAmount} WUXIA tokens`}
                    >
                      {isTxPending ? 'Processing...' : 'Offer WUXIA'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Stake */}
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <span>✦</span>
                  Current Offering
                </h3>
                {stakeInfo ? (
                  <div className="bg-black/50 border border-green-900/50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white font-medium">{stakeInfo.amountFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Locked</span>
                        <span className="text-white font-medium">{stakeInfo.lockDurationDays} days</span>
                      </div>
                      {stakeInfo.unlockDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Unlocks</span>
                          <span className="text-white font-medium">{stakeInfo.unlockDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-green-900/30">
                        {stakeInfo.canUnstake ? (
                          <button
                            onClick={handleUnstake}
                            disabled={isTxPending}
                            className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded text-sm font-medium transition-all hover:scale-105 disabled:scale-100"
                          >
                            Retrieve
                          </button>
                        ) : (
                          <div className="text-center text-yellow-400 text-xs py-2">
                            ⏳ Locked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/50 border border-gray-800/50 rounded-lg p-4 text-center text-gray-500 text-sm">
                    No active offering
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {isTxPending && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg shadow-2xl shadow-red-900/50 flex items-center gap-3 border border-red-500/50" role="status" aria-live="polite">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-medium">Processing transaction...</span>
          </div>
        )}
      </div>
    </div>
  )
}
