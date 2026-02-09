/**
 * Input validation utilities for blockchain operations
 * Pure validation functions that don't depend on wagmi or blockchain state
 */

// Constants for validation - should match config.ts
export const STAKING_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 1_000_000,
}

export const INPUT_CONSTRAINTS = {
  DECIMAL_PLACES: 6,
}

/**
 * Validate stake amount input
 * Performs comprehensive validation before sending transactions
 *
 * @param value - Input string to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateStakeAmountInput(value: string): { valid: boolean; error?: string } {
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
  // But allow common non-numeric strings that we'll catch later
  if (!/^[\d.]+$/.test(value) && value !== 'Infinity' && value !== 'NaN') {
    return {
      valid: false,
      error: 'Only numbers and decimal points are allowed',
    }
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
      return {
        valid: false,
        error: `Maximum ${INPUT_CONSTRAINTS.DECIMAL_PLACES} decimal places allowed`,
      }
    }
  }

  // Check range limits
  if (numValue < STAKING_LIMITS.MIN_AMOUNT) {
    return {
      valid: false,
      error: `Amount must be at least ${STAKING_LIMITS.MIN_AMOUNT} WUXIA`,
    }
  }
  if (numValue > STAKING_LIMITS.MAX_AMOUNT) {
    return {
      valid: false,
      error: `Amount cannot exceed ${STAKING_LIMITS.MAX_AMOUNT.toLocaleString()} WUXIA`,
    }
  }

  return { valid: true }
}
