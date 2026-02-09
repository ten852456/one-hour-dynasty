# Blockchain Integration - Issues & Solutions

This document tracks security issues, bugs, and improvements for the blockchain integration.

## ✅ Completed Fixes

### 1. WalletConnect Project ID Documentation
**Status**: ✅ Complete
**File**: README.md

**Problem**: Placeholder WalletConnect Project ID causes app to crash on startup with unclear error.

**Solution**:
- Added detailed setup instructions in README.md
- Documented how to get Project ID from cloud.walletconnect.com
- Added example of valid vs invalid Project ID format
- App validates and throws helpful error if placeholder detected

**References**:
- README.md lines 35-58
- config.ts lines 42-86 (validation logic)

---

### 2. Error Boundary Integration
**Status**: ✅ Complete
**File**: src/app/layout.tsx

**Problem**: ErrorBoundary component existed but wasn't wrapping the app, so blockchain errors could crash the entire application.

**Solution**:
- ErrorBoundary now wraps all children in root layout
- Catches errors from blockchain operations
- Displays user-friendly error messages
- Prevents app crashes from wallet/transaction errors

**References**:
- app/layout.tsx lines 36-38
- components/ErrorBoundary.tsx

---

### 3. Unsafe Type Assertions
**Status**: ✅ Complete
**File**: src/lib/blockchain/hooks/useStaking.ts

**Problem**: Multiple `as bigint` type assertions without runtime validation.

**Solution**:
- Added `isBigInt()` type guard function
- Replaced all unsafe type assertions with proper runtime checks
- Prevents runtime errors if contract returns unexpected data types

**Before**:
```typescript
stakeAmount: (priorityStake as bigint | undefined) || parseUnits('1000', TOKEN_DECIMALS)
```

**After**:
```typescript
const isBigInt = (value: unknown): value is bigint => {
  return typeof value === 'bigint'
}
stakeAmount: isBigInt(priorityStake) ? priorityStake : parseUnits('1000', TOKEN_DECIMALS)
```

**References**:
- hooks/useStaking.ts lines 87-90 (type guard)
- hooks/useStaking.ts lines 95-110 (usage)

---

### 4. Test Coverage
**Status**: ✅ Complete (Basic Tests)
**Files**: src/__tests__/lib/blockchain/

**Problem**: No tests for critical validation and error handling logic.

**Solution**:
- Created validation.ts with pure validation functions
- Created errors.ts with pure error handling functions
- Added 45 tests covering:
  - Input validation (scientific notation, negative numbers, decimals, etc.)
  - Error parsing (user rejection, insufficient funds, contract errors, etc.)

**Test Results**:
```
Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
```

**References**:
- lib/blockchain/validation.ts (pure functions, no wagmi dependency)
- lib/blockchain/errors.ts (pure functions, no wagmi dependency)
- __tests__/lib/blockchain/validation.test.ts (17 tests)
- __tests__/lib/blockchain/errorHandling.test.ts (28 tests)

---

### 5. Gas Limits Documentation
**Status**: ✅ Documented
**File**: src/lib/blockchain/config.ts

**Problem**: Gas limits are hardcoded based on Ethereum patterns. On Monad, gas is charged on gas-limit (not gas-used), so setting limits too high wastes user funds.

**Solution**:
- Added detailed TODO comment explaining Monad's gas charging model
- Documented current limits as "based on Ethereum patterns"
- Added action items for testing on Monad testnet
- Recommended implementing dynamic gas estimation

**References**:
- config.ts lines 278-293

---

### 6. Client-Side Time Calculation
**Status**: ✅ Documented
**File**: src/lib/blockchain/hooks/useStaking.ts

**Problem**: UI calculates `canUnstake` client-side using browser time. If user's clock is skewed, UI shows incorrect information.

**Solution**:
- Added comprehensive security warning
- Documented the issue and user impact
- Provided suggested Solidity implementation for on-chain `canUnstake()` view function
- Explained that blockchain still enforces correct time (no security issue, just UX confusion)

**References**:
- hooks/useStaking.ts lines 407-435

---

## ⚠️ Known Issues (Documented, Not Fixed)

### 7. Large Blockchain Page Component
**Status**: ⚠️ Documented
**File**: src/app/blockchain/page.tsx (783 lines)

**Issue**: Component handles multiple concerns (wallet, staking, item store, transaction status).

**Recommendation**: Split into smaller components:
- StakeForm
- SubscriptionCard
- OverviewStats
- TransactionStatus

**Priority**: Medium (UX improvement, not a bug)

---

### 8. Missing ARIA Labels
**Status**: ⚠️ Documented

**Issue**: Some interactive elements lack proper ARIA labels for screen readers.

**Recommendation**:
- Add `aria-selected` to tab buttons
- Ensure all interactive elements have descriptive labels

**Priority**: Low (accessibility improvement)

---

### 9. No Loading Skeletons
**Status**: ⚠️ Documented

**Issue**: Blockchain page shows "..." while loading, which has poor perceived performance.

**Recommendation**: Implement skeleton screens for better UX.

**Priority**: Low (UX improvement)

---

## 🔒 Security Issues (All Resolved)

### 10. localStorage Vulnerability
**Status**: ✅ Fixed (Previous Work)
**File**: packages/contracts/ItemStore.sol

**Issue**: Subscription tiers stored in localStorage could be manipulated.

**Solution**: Added on-chain tier mapping in ItemStore contract.

**References**:
- ItemStore.sol lines 150-200 (tier mapping)
- docs/agents/BLOCKCHAIN.md

---

### 11. Unlimited Approval Risk
**Status**: ✅ Fixed (Previous Work)
**File**: src/lib/blockchain/hooks/useStaking.ts

**Issue**: Approving MaxUint256 gives unlimited spending access.

**Solution**: Changed to limited approval based on STAKING_LIMITS.MAX_AMOUNT.

**References**:
- hooks/useStaking.ts approval logic

---

### 12. Race Conditions
**Status**: ✅ Fixed (Previous Work)
**Files**: Multiple hooks

**Issues**:
- txHash race condition with setTimeout
- Approval flow race condition

**Solutions**:
- Replaced setTimeout with setImmediate for reliable state updates
- Removed stale needsApproval check after refetch
- Added proper async/await patterns

**References**:
- hooks/useStaking.ts (stake function)
- hooks/useWuxiaToken.ts (mint, transfer, burn functions)
- app/blockchain/page.tsx (handleApprove function)

---

## 📝 Code Quality Improvements

### Separation of Concerns
**Status**: ✅ Complete

Extracted pure functions from blockchain-dependent code:
- `validation.ts` - Input validation without wagmi
- `errors.ts` - Error parsing without wagmi

**Benefits**:
- Easier to test (no complex mocking required)
- Better code organization
- Reusable across different contexts

---

## 🚀 Recommendations for Future Work

### High Priority
1. **Implement canUnstake() View Function**: Add on-chain time checking for authoritative unstake eligibility
2. **Test Gas Limits on Monad**: Deploy to testnet and measure actual gas usage
3. **Add Hook Tests**: Implement proper mocking for React hooks (useStaking, useWuxiaToken, etc.)

### Medium Priority
4. **Split Blockchain Component**: Break down 783-line component into smaller, focused components
5. **Add Loading Skeletons**: Improve perceived performance with skeleton screens
6. **Implement ARIA Labels**: Improve accessibility for screen readers

### Low Priority
7. **Dynamic Gas Estimation**: Use eth_estimateGas instead of hardcoded limits
8. **Event Listeners**: Listen to contract events for real-time updates
9. **E2E Tests**: Add Playwright/Cypress tests for critical user flows

---

## 📊 Test Coverage

### Current State
- ✅ Validation tests: 17 tests passing
- ✅ Error handling tests: 28 tests passing
- ❌ Hook tests: Not implemented (complex mocking required)
- ❌ Component tests: Not implemented
- ❌ Integration tests: Not implemented
- ❌ E2E tests: Not implemented

**Coverage**: Critical pure functions tested. React integration tests need work.

---

## 📚 Documentation

### Updated Files
- ✅ README.md - Comprehensive setup instructions
- ✅ BLOCKCHAIN_ISSUES.md - This document
- ✅ config.ts - Detailed inline comments about Monad specifics
- ✅ hooks/useStaking.ts - Security warnings and TODOs

### Needed
- ⚠️ Setup guide for deploying contracts to Monad testnet
- ⚠️ Troubleshooting guide for common wallet/connection issues
- ⚠️ API documentation for blockchain hooks

---

## 🔗 Related Documents

- [README.md](../README.md) - Project overview and setup
- [WHITEPAPER.md](../WHITEPAPER.md) - Game rules and mechanics
- [TOKENOMICS.md](../TOKENOMICS.md) - $WUXIA token details
- [docs/agents/BLOCKCHAIN.md](../docs/agents/BLOCKCHAIN.md) - Blockchain architecture

---

**Last Updated**: 2025-02-09
**Status**: Production-ready with documented improvements
