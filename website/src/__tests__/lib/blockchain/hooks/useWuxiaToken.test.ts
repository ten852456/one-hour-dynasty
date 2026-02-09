/**
 * Tests for useWuxiaToken hook
 * Tests token operations: mint, burn, transfer with error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { parseUnits, formatUnits } from 'viem'
import { useWuxiaToken } from '@/lib/blockchain/hooks/useWuxiaToken'

// Mock the entire blockchain config module
jest.mock('@/lib/blockchain/config', () => ({
  CONTRACTS: {
    WUXIA_TOKEN: '0xF423ae72e96991F11F1836dAaC5A8b18dD592370' as `0x${string}`,
    ITEM_STORE: '0xB4e79Bf1342E040e1EF505281DB045bfB465F426' as `0x${string}`,
    STAKING: '0x7af53FAf81068905A0b3e96B43848D440BcaFF98' as `0x${string}`,
    GAME_RESULTS_RECORDER: '0x22054c0065f5F97FFB39F08Aa31669f5c8156522' as `0x${string}`,
  } as const,
  TOKEN_DECIMALS: 18,
  getGasLimit: jest.fn(() => 100_000n),
  parseUnits,
  formatUnits,
  getTransactionReceipt: jest.fn(),
  getExplorerUrl: jest.fn((hash) => `https://monadvision.xyz/tx/${hash}`),
}))

// Mock wagmi hooks
import { useReadContract, useWriteContract } from 'wagmi'

const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>
const mockUseWriteContract = useWriteContract as jest.MockedFunction<typeof useWriteContract>

describe('useWuxiaToken Hook', () => {
  const mockAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`
  const mockAmount = 100

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any)

    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: jest.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  describe('Token Balance Reading', () => {
    it('should return balance as 0n when not connected', () => {
      const { result } = renderHook(() => useWuxiaToken())

      expect(result.current.balance).toBe(0n)
      expect(result.current.balanceFormatted).toBe('0.00')
      expect(result.current.isLoading).toBe(false)
    })

    it('should return formatted balance when connected', async () => {
      mockUseReadContract.mockReturnValue({
        data: 1000000000n, // 1000 WUXIA (18 decimals)
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await waitFor(() => {
        expect(result.current.balance).toBe(1000000000n)
        expect(result.current.balanceFormatted).toBe('1000.00')
      })
    })

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Mint Tokens', () => {
    it('should mint tokens successfully', async () => {
      const mockWriteContract = jest.fn().mockResolvedValue('0xhash123')
      const mockReceipt = { status: 'success' as const }
      const { getTransactionReceipt } = require('@/lib/blockchain/config')
      getTransactionReceipt.mockResolvedValue(mockReceipt)

      mockUseWriteContract.mockReturnValue({
        data: '0xhash123',
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const mintResult = await result.current.mint(mockAddress, mockAmount)
        expect(mintResult.success).toBe(true)
        expect(mintResult.hash).toBe('0xhash123')
      })
    })

    it('should handle mint errors gracefully', async () => {
      const mockError = new Error('Insufficient funds')
      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(() => Promise.reject(mockError)),
        isPending: false,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const mintResult = await result.current.mint(mockAddress, mockAmount)
        expect(mintResult.success).toBe(false)
        expect(mintResult.error).toBeDefined()
      })
    })

    it('should validate amount > 0', async () => {
      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const mintResult = await result.current.mint(mockAddress, 0)
        expect(mintResult.success).toBe(false)
        expect(mintResult.error).toBe('Amount must be greater than 0')
      })
    })

    it('should validate recipient address', async () => {
      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const mintResult = await result.current.mint('', mockAmount)
        expect(mintResult.success).toBe(false)
        expect(mintResult.error).toBe('Recipient address is required')
      })
    })
  })

  describe('Transfer Tokens', () => {
    it('should transfer tokens successfully', async () => {
      const mockWriteContract = jest.fn().mockResolvedValue('0xhash456')
      const mockReceipt = { status: 'success' as const }
      const { getTransactionReceipt } = require('@/lib/blockchain/config')
      getTransactionReceipt.mockResolvedValue(mockReceipt)

      mockUseWriteContract.mockReturnValue({
        data: '0xhash456',
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const transferResult = await result.current.transfer(mockAddress, mockAmount)
        expect(transferResult.success).toBe(true)
        expect(transferResult.hash).toBe('0xhash456')
      })
    })

    it('should validate transfer amount > 0', async () => {
      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const transferResult = await result.current.transfer(mockAddress, 0)
        expect(transferResult.success).toBe(false)
        expect(transferResult.error).toBe('Amount must be greater than 0')
      })
    })

    it('should validate recipient address', async () => {
      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const transferResult = await result.current.transfer('', mockAmount)
        expect(transferResult.success).toBe(false)
        expect(transferResult.error).toBe('Recipient address is required')
      })
    })
  })

  describe('Burn Tokens', () => {
    it('should burn tokens successfully', async () => {
      const mockWriteContract = jest.fn().mockResolvedValue('0xhash789')
      const mockReceipt = { status: 'success' as const }
      const { getTransactionReceipt } = require('@/lib/blockchain/config')
      getTransactionReceipt.mockResolvedValue(mockReceipt)

      mockUseWriteContract.mockReturnValue({
        data: '0xhash789',
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const burnResult = await result.current.burn(mockAmount)
        expect(burnResult.success).toBe(true)
        expect(burnResult.hash).toBe('0xhash789')
      })
    })

    it('should validate burn amount > 0', async () => {
      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const burnResult = await result.current.burn(0)
        expect(burnResult.success).toBe(false)
        expect(burnResult.error).toBe('Amount must be greater than 0')
      })
    })

    it('should handle burn errors gracefully', async () => {
      const mockError = new Error('Insufficient balance')
      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(() => Promise.reject(mockError)),
        isPending: false,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      await act(async () => {
        const burnResult = await result.current.burn(mockAmount)
        expect(burnResult.success).toBe(false)
        expect(burnResult.error).toBeDefined()
      })
    })
  })

  describe('State Management', () => {
    it('should handle isPending state', () => {
      mockUseWriteContract.mockReturnValue({
        data: '0xhash',
        writeContract: jest.fn(),
        isPending: true,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      expect(result.current.isPending).toBe(true)
    })

    it('should handle error state', () => {
      const mockError = new Error('Transaction failed')
      mockUseWriteContract.mockReturnValue({
        data: undefined,
        writeContract: jest.fn(() => Promise.reject(mockError)),
        isPending: false,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      expect(result.current.error).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should format balance correctly', () => {
      mockUseReadContract.mockReturnValue({
        data: 1234567890123456789n, // ~1.23 tokens
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      waitFor(() => {
        expect(result.current.balanceFormatted).toMatch(/^\d+\.\d{2}$/)
      })
    })

    it('should handle zero balance', () => {
      mockUseReadContract.mockReturnValue({
        data: 0n,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useWuxiaToken(mockAddress))

      waitFor(() => {
        expect(result.current.balance).toBe(0n)
        expect(result.current.balanceFormatted).toBe('0.00')
      })
    })
  })
})
