/**
 * Error handling tests for blockchain operations
 * Tests for error parsing, user rejection detection, and error message humanization
 */

import {
  parseTransactionError,
  UserRejectedError,
  InsufficientFundsError,
  BlockchainError,
  InsufficientAllowanceError,
  ContractExecutionError
} from '@/lib/blockchain/errors'

describe('Error Handling', () => {
  describe('User Rejection Detection', () => {
    it('should detect UserRejectedRequestError', () => {
      const error = new Error('User rejected the request')
      error.name = 'UserRejectedRequestError'

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(UserRejectedError)
      expect(parsed.message).toBe('User rejected the transaction')
      expect(parsed.code).toBe('USER_REJECTED')
    })

    it('should detect rejection from error message', () => {
      const error = new Error('User rejected transaction in wallet')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(UserRejectedError)
    })

    it('should detect rejection with "User rejected" substring', () => {
      const error = new Error('Something went wrong. User rejected.')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(UserRejectedError)
    })

    it('should detect cancellation with "User cancelled" substring', () => {
      const error = new Error('User cancelled the operation')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(UserRejectedError)
    })

    it('should detect cancellation with "User denied" substring', () => {
      const error = new Error('User denied transaction signature')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(UserRejectedError)
    })
  })

  describe('Insufficient Funds Detection', () => {
    it('should detect "insufficient funds" in message', () => {
      const error = new Error('insufficient funds for transfer')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(InsufficientFundsError)
      expect(parsed.message).toContain('funds')
    })

    it('should detect "exceeds balance" in message', () => {
      const error = new Error('transfer amount exceeds balance')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(InsufficientFundsError)
    })

    it('should detect "insufficient balance" in message', () => {
      const error = new Error('insufficient balance for operation')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(InsufficientFundsError)
    })
  })

  describe('Insufficient Allowance Detection', () => {
    it('should detect "insufficient allowance" in message', () => {
      const error = new Error('insufficient allowance for spending')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(InsufficientAllowanceError)
      expect(parsed.message).toContain('approve')
    })

    it('should detect "allowance" substring in message', () => {
      const error = new Error('allowance too low')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(BlockchainError)
      expect(parsed.code).toBe('INSUFFICIENT_ALLOWANCE')
    })
  })

  describe('Network Error Detection', () => {
    it('should detect NetworkError by name', () => {
      const error = new Error('Network error')
      error.name = 'NetworkError'

      const parsed = parseTransactionError(error)

      expect(parsed.code).toBe('NETWORK_ERROR')
    })

    it('should detect "timeout" in message', () => {
      const error = new Error('Request timeout after 30s')

      const parsed = parseTransactionError(error)

      expect(parsed.code).toBe('NETWORK_ERROR')
    })

    it('should detect "rate limit" in message', () => {
      const error = new Error('Too many requests - rate limited')

      const parsed = parseTransactionError(error)

      expect(parsed.code).toBe('NETWORK_ERROR')
    })
  })

  describe('Contract Execution Errors', () => {
    it('should detect "reverted" in message', () => {
      const error = new Error('Transaction reverted')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(ContractExecutionError)
      expect(parsed.message).toContain('failed')
    })

    it('should extract revert reason when available', () => {
      const error = new Error('execution reverted: "Insufficient allowance"')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(ContractExecutionError)
      expect(parsed.message).toBe('Transaction failed: Insufficient allowance')
    })

    it('should detect "gas required exceeds" in message', () => {
      const error = new Error('gas required exceeds allowance')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(ContractExecutionError)
    })

    it('should detect "execution reverted" in message', () => {
      const error = new Error('Contract execution reverted')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(ContractExecutionError)
    })
  })

  describe('Unknown Error Handling', () => {
    it('should handle unknown errors gracefully', () => {
      const error = new Error('Unknown blockchain error occurred')

      const parsed = parseTransactionError(error)

      expect(parsed).toBeInstanceOf(BlockchainError)
      expect(parsed.message).toBe('Unknown blockchain error occurred')
    })

    it('should handle non-Error objects', () => {
      const parsed = parseTransactionError('string error')

      expect(parsed).toBeInstanceOf(BlockchainError)
      expect(parsed.message).toBe('string error')
    })

    it('should handle null/undefined', () => {
      const parsed = parseTransactionError(null)

      expect(parsed).toBeInstanceOf(BlockchainError)
      expect(parsed.message).toBe('An unknown error occurred')
    })
  })

  describe('Error Message Mapping', () => {
    it('should map network errors to user-friendly messages', () => {
      const error = new Error('network error while connecting')

      const parsed = parseTransactionError(error)

      expect(parsed.message).toContain('connection')
    })

    it('should map contract errors to action-oriented messages', () => {
      const error = new Error('call revert exception')

      const parsed = parseTransactionError(error)

      expect(parsed.message).toContain('failed')
    })

    it('should provide actionable messages for allowance errors', () => {
      const error = new Error('allowance exceeded')

      const parsed = parseTransactionError(error)

      expect(parsed.message).toContain('approve')
    })
  })
})
