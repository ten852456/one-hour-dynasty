/**
 * Error handling utilities for blockchain operations
 * Pure error handling functions that don't depend on wagmi or blockchain state
 */

// ============================================
// Error Classes
// ============================================

/**
 * Base class for blockchain-related errors
 */
export class BlockchainError extends Error {
  code: string

  constructor(message: string, code: string = 'BLOCKCHAIN_ERROR') {
    super(message)
    this.name = 'BlockchainError'
    this.code = code
  }
}

/**
 * Error when user rejects a transaction in their wallet
 */
export class UserRejectedError extends BlockchainError {
  constructor(message: string = 'User rejected the transaction') {
    super(message, 'USER_REJECTED')
    this.name = 'UserRejectedError'
  }
}

/**
 * Error when account has insufficient funds
 */
export class InsufficientFundsError extends BlockchainError {
  constructor(message: string = "You don't have enough funds to complete this transaction") {
    super(message, 'INSUFFICIENT_FUNDS')
    this.name = 'InsufficientFundsError'
  }
}

/**
 * Error when token allowance is insufficient
 */
export class InsufficientAllowanceError extends BlockchainError {
  constructor(message: string = 'Please approve the contract to spend your tokens first') {
    super(message, 'INSUFFICIENT_ALLOWANCE')
    this.name = 'InsufficientAllowanceError'
  }
}

/**
 * Error when contract execution reverts
 */
export class ContractExecutionError extends BlockchainError {
  constructor(message: string = 'Transaction failed. The contract execution reverted') {
    super(message, 'CONTRACT_EXECUTION_FAILED')
    this.name = 'ContractExecutionError'
  }
}

// ============================================
// Error Message Mapping
// ============================================

const ERROR_MESSAGE_MAP: Record<string, string> = {
  'User rejected': 'Transaction was cancelled in your wallet.',
  'user rejected': 'Transaction was cancelled in your wallet.',
  'user cancelled': 'Transaction was cancelled in your wallet.',
  'user denied': 'Transaction was cancelled in your wallet.',
  'insufficient funds': "You don't have enough tokens to complete this transaction.",
  'exceeds balance': "You don't have enough tokens to complete this transaction.",
  'insufficient balance': "You don't have enough tokens to complete this transaction.",
  'insufficient allowance': 'Please approve the contract to spend your tokens first.',
  'allowance': 'Please approve the contract to spend your tokens first.',
  'network': 'Network error. Please check your connection and try again.',
  'timeout': 'Network error. Please check your connection and try again.',
  'rate limit': 'Network error. Please check your connection and try again.',
  'reverted': 'Transaction failed. The contract execution reverted.',
  'execution reverted': 'Transaction failed. The contract execution reverted.',
  'gas required exceeds': 'Transaction failed. Gas limit too low.',
}

// ============================================
// Error Parsing Functions
// ============================================

/**
 * Parse blockchain transaction errors and return user-friendly messages
 * Detects common error patterns and returns appropriate error types
 *
 * @param error - Error object from transaction
 * @returns Parsed error with user-friendly message
 */
export function parseTransactionError(error: unknown): BlockchainError {
  // Handle null/undefined
  if (!error) {
    return new BlockchainError('An unknown error occurred')
  }

  // Convert to Error if string
  const err = typeof error === 'string' ? new Error(error) : error as Error

  const errorMessage = err.message || err.toString() || ''

  // Check for user rejection (error name or message)
  if (
    err.name === 'UserRejectedRequestError' ||
    errorMessage.toLowerCase().includes('user rejected') ||
    errorMessage.toLowerCase().includes('user cancelled') ||
    errorMessage.toLowerCase().includes('user denied')
  ) {
    return new UserRejectedError()
  }

  // Check for insufficient funds
  if (
    errorMessage.toLowerCase().includes('insufficient funds') ||
    errorMessage.toLowerCase().includes('exceeds balance') ||
    errorMessage.toLowerCase().includes('insufficient balance')
  ) {
    return new InsufficientFundsError()
  }

  // Check for contract execution errors (before allowance check to avoid false positives)
  if (
    errorMessage.toLowerCase().includes('reverted') ||
    errorMessage.toLowerCase().includes('execution reverted') ||
    errorMessage.toLowerCase().includes('gas required exceeds') ||
    errorMessage.toLowerCase().includes('revert')
  ) {
    // Try to extract revert reason
    const revertMatch = errorMessage.match(/execution reverted:?\s*"([^"]+)"/)
    if (revertMatch) {
      const reason = revertMatch[1]
      return new ContractExecutionError(`Transaction failed: ${reason}`)
    }

    // Use friendly message from map
    const friendlyMessage = Object.entries(ERROR_MESSAGE_MAP).find(([key]) =>
      errorMessage.toLowerCase().includes(key.toLowerCase())
    )?.[1]

    return new ContractExecutionError(
      friendlyMessage || 'Transaction failed. The contract execution reverted'
    )
  }

  // Check for insufficient allowance (after reverted check to avoid false positives)
  if (
    errorMessage.toLowerCase().includes('insufficient allowance') ||
    (errorMessage.toLowerCase().includes('allowance') &&
     !errorMessage.toLowerCase().includes('reverted') &&
     !errorMessage.toLowerCase().includes('gas required exceeds'))
  ) {
    return new InsufficientAllowanceError()
  }

  // Check for network errors
  if (
    err.name === 'NetworkError' ||
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('network')
  ) {
    return new BlockchainError('Network error. Please check your connection and try again.', 'NETWORK_ERROR')
  }

  // Map error message to friendly message
  const friendlyMessage = Object.entries(ERROR_MESSAGE_MAP).find(([key]) =>
    errorMessage.toLowerCase().includes(key.toLowerCase())
  )?.[1]

  if (friendlyMessage) {
    return new BlockchainError(friendlyMessage)
  }

  // Return generic error with original message
  return new BlockchainError(errorMessage || 'An unknown error occurred')
}
