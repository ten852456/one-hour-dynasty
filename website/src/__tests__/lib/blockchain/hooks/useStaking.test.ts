/**
 * Tests for useStaking hook
 * Tests staking operations with proper wagmi mocking
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { parseUnits, formatUnits } from 'viem'
import { useStaking } from '@/lib/blockchain/hooks/useStaking'

// Mock the entire blockchain config module
jest.mock('@/lib/blockchain/config', () => ({
  CONTRACTS: {
    WUXIA_TOKEN: '0xF423ae72e96991F11F1836dAaC5A8b18dD592370' as `0x${string}`,
    ITEM_STORE: '0xB4e79Bf1342E040e1EF505281DB045bfB465F426' as `0x${string}`,
    STAKING: '0x7af53FAf81068905A0b3e96B43848D440BcaFF98' as `0x${string}`,
    GAME_RESULTS_RECORDER: '0x22054c0065f5F97FFB39F08Aa31669f5c8156522' as `0x${string}`,
  } as const,
  TOKEN_DECIMALS: 18,
  STAKING_LIMITS: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 1_000_000,
  },
  getGasLimit: jest.fn(() => 100_000n),
  parseUnits,
  formatUnits,
  getTransactionReceipt: jest.fn(),
  getExplorerUrl: jest.fn((hash) => `https://monadvision.xyz/tx/${hash}`),
  STAKING_SAFETY_BUFFER: 300,
}))

// Mock wagmi hooks
import { useReadContract, useWriteContract } from 'wagmi'

const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>
const mockUseWriteContract = useWriteContract as jest.MockedFunction<typeof useWriteContract>

describe('useStaking Hook', () => {
  const mockAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`
  const mockStakeAmount = parseUnits('1000', 18)
  const mockLockDuration = 86400 // 1 day

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: jest.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  describe('Stake Tier Reading', () => {
    it('should return default tier amounts when contract data unavailable', () => {
      const { result } = renderHook(() => useStaking(mockAddress))

      expect(result.current.stakingTiers).toHaveLength(3)
      expect(result.current.stakingTiers[0].name).toBe('Priority Queue')
      expect(result.current.stakingTiers[1].name).toBe('Grand War')
      expect(result.current.stakingTiers[2].name).toBe('Governance')
    })

    it('should use contract tier amounts when available', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'PRIORITY_STAKE'
          ? parseUnits('2000', 18)
          : props?.functionName === 'GRAND_WAR_STAKE'
          ? parseUnits('10000', 18)
          : props?.functionName === 'GOVERNANCE_STAKE'
          ? parseUnits('20000', 18)
          : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.stakingTiers[0].stakeAmount).toBe(parseUnits('2000', 18))
        expect(result.current.stakingTiers[1].stakeAmount).toBe(parseUnits('10000', 18))
        expect(result.current.stakingTiers[2].stakeAmount).toBe(parseUnits('20000', 18))
      })
    })
  })

  describe('Stake Info Reading', () => {
    it('should return no stake info when not connected', () => {
      const { result } = renderHook(() => useStaking())

      expect(result.current.stakeInfo).toBeNull()
    })

    it('should return stake info when connected and staked', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'stakes'
          ? {
              amount: mockStakeAmount,
              timestamp: BigInt(Math.floor(Date.now() / 1000)),
              lockDuration: BigInt(mockLockDuration),
            }
          : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.stakeInfo).not.toBeNull()
        expect(result.current.stakeInfo?.amount).toBe(mockStakeAmount)
      })
    })
  })

  describe('canUnstake On-Chain Check', () => {
    it('should use on-chain canUnstake value when available', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'canUnstake' ? true : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.canUnstake).toBe(true)
        expect(result.current.canUnstakeOnChain).toBe(true)
      })
    })

    it('should return false when on-chain check returns false', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'canUnstake' ? false : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.canUnstake).toBe(false)
        expect(result.current.canUnstakeOnChain).toBe(false)
      })
    })

    it('should fall back to client-side calculation when on-chain data unavailable', () => {
      const { result } = renderHook(() => useStaking(mockAddress))

      // No on-chain data, should use client-side fallback
      expect(result.current.canUnstake).toBe(false) // No stake, so false
    })
  })

  describe('Stake Operation', () => {
    it('should stake tokens successfully', async () => {
      const mockWriteContract = jest.fn().mockResolvedValue('0xhash123')
      const mockReceipt = { status: 'success' as const }
      const { getTransactionReceipt } = require('@/lib/blockchain/config')
      getTransactionReceipt.mockResolvedValue(mockReceipt)

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      await act(async () => {
        const stakeResult = await result.current.stake(1000, mockLockDuration)
        expect(stakeResult.success).toBe(true)
        expect(stakeResult.hash).toBe('0xhash123')
      })
    })

    it('should handle staking errors gracefully', async () => {
      const mockError = new Error('Insufficient balance')
      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(() => Promise.reject(mockError)),
        isPending: false,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      await act(async () => {
        const stakeResult = await result.current.stake(1000, mockLockDuration)
        expect(stakeResult.success).toBe(false)
        expect(stakeResult.error).toBeDefined()
      })
    })
  })

  describe('Unstake Operation', () => {
    it('should unstake tokens successfully', async () => {
      const mockWriteContract = jest.fn().mockResolvedValue('0xhash456')
      const mockReceipt = { status: 'success' as const }
      const { getTransactionReceipt } = require('@/lib/blockchain/config')
      getTransactionReceipt.mockResolvedValue(mockReceipt)

      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      await act(async () => {
        const unstakeResult = await result.current.unstake()
        expect(unstakeResult.success).toBe(true)
        expect(unstakeResult.hash).toBe('0xhash456')
      })
    })
  })

  describe('Stake Amount Validation', () => {
    it('should reject amount below minimum', () => {
      const { result } = renderHook(() => useStaking(mockAddress))

      const validation = result.current.validateStakeAmount(0)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('at least 1')
    })

    it('should reject amount above maximum', () => {
      const { result } = renderHook(() => useStaking(mockAddress))

      const validation = result.current.validateStakeAmount(2_000_000)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('cannot exceed')
    })

    it('should accept valid amount', () => {
      const { result } = renderHook(() => useStaking(mockAddress))

      const validation = result.current.validateStakeAmount(5000)
      expect(validation.valid).toBe(true)
    })
  })

  describe('Tier Access', () => {
    it('should check priority queue access', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'hasPriorityQueue' ? true : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.hasPriorityQueue).toBe(true)
      })
    })

    it('should check grand war access', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'canAccessGrandWar' ? false : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.canAccessGrandWar).toBe(false)
      })
    })

    it('should check governance rights', async () => {
      mockUseReadContract.mockImplementation((props) => ({
        data: props?.functionName === 'hasGovernanceRights' ? false : undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any))

      const { result } = renderHook(() => useStaking(mockAddress))

      await waitFor(() => {
        expect(result.current.hasGovernanceRights).toBe(false)
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      expect(result.current.isLoading).toBe(true)
    })

    it('should handle error state', () => {
      const mockError = new Error('Network error')
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      expect(result.current.error).toBeDefined()
    })

    it('should handle isPending state', () => {
      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(),
        isPending: true,
        error: null,
      } as any)

      const { result } = renderHook(() => useStaking(mockAddress))

      expect(result.current.isPending).toBe(true)
    })
  })
})
