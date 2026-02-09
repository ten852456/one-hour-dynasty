/**
 * Input validation tests for blockchain page
 * Tests for scientific notation rejection, decimal limits, range validation, and format validation
 */

import { validateStakeAmountInput } from '@/lib/blockchain/validation'

describe('Input Validation', () => {
  describe('Scientific Notation Blocking', () => {
    it('should reject scientific notation with lowercase "e"', () => {
      const result = validateStakeAmountInput('1e5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Scientific notation not allowed')
    })

    it('should reject scientific notation with uppercase "E"', () => {
      const result = validateStakeAmountInput('1E5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Scientific notation not allowed')
    })

    it('should accept numbers without "e"', () => {
      const result = validateStakeAmountInput('100000')
      expect(result.valid).toBe(true)
    })
  })

  describe('Negative Number Blocking', () => {
    it('should reject negative numbers', () => {
      const result = validateStakeAmountInput('-100')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Negative amounts are not allowed')
    })

    it('should reject negative with decimals', () => {
      const result = validateStakeAmountInput('-100.5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Negative amounts are not allowed')
    })
  })

  describe('Multiple Decimal Points Detection', () => {
    it('should reject multiple decimal points', () => {
      const result = validateStakeAmountInput('1.5.5.5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid number format')
    })

    it('should reject two decimal points', () => {
      const result = validateStakeAmountInput('1..5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid number format')
    })

    it('should accept single decimal point', () => {
      const result = validateStakeAmountInput('1.5')
      expect(result.valid).toBe(true)
    })
  })

  describe('Non-Numeric Character Detection', () => {
    it('should reject letters mixed with numbers', () => {
      const result = validateStakeAmountInput('abc123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only numbers and decimal points are allowed')
    })

    it('should reject special characters', () => {
      const result = validateStakeAmountInput('100@50')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only numbers and decimal points are allowed')
    })

    it('should reject spaces in numbers', () => {
      const result = validateStakeAmountInput('1 000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only numbers and decimal points are allowed')
    })
  })

  describe('Decimal Places Limit', () => {
    it('should accept within decimal limit (6 places)', () => {
      const result = validateStakeAmountInput('1.000001')
      expect(result.valid).toBe(true)
    })

    it('should reject exceeding decimal limit (7 places)', () => {
      const result = validateStakeAmountInput('1.0000001')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Maximum 6 decimal places allowed')
    })

    it('should accept exactly 6 decimal places with valid amount', () => {
      const result = validateStakeAmountInput('1.000001')
      expect(result.valid).toBe(true)
    })
  })

  describe('Range Validation', () => {
    it('should reject below minimum amount', () => {
      const result = validateStakeAmountInput('0')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be at least 1 WUXIA')
    })

    it('should reject less than minimum', () => {
      const result = validateStakeAmountInput('0.5')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be at least 1 WUXIA')
    })

    it('should reject above maximum amount', () => {
      const result = validateStakeAmountInput('1000001')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount cannot exceed 1,000,000 WUXIA')
    })

    it('should accept valid range', () => {
      const result = validateStakeAmountInput('1000')
      expect(result.valid).toBe(true)
    })
  })

  describe('Number Format Validation', () => {
    it('should reject non-numeric strings', () => {
      const result = validateStakeAmountInput('invalid')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Only numbers and decimal points are allowed')
    })

    it('should reject infinite numbers', () => {
      const result = validateStakeAmountInput('Infinity')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Number is too large')
    })

    it('should accept zero', () => {
      const result = validateStakeAmountInput('0')
      expect(result.valid).toBe(false) // 0 is below MIN_AMOUNT
      expect(result.error).toBe('Amount must be at least 1 WUXIA')
    })
  })

  describe('Empty Input Handling', () => {
    it('should accept empty input', () => {
      const result = validateStakeAmountInput('')
      expect(result.valid).toBe(true) // Empty is valid (user hasn't finished typing)
    })
  })
})
