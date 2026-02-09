# Gas Limit Testing Guide for Monad Testnet

## Why This Matters

⚠️ **CRITICAL**: On Monad, gas is charged on **gas-limit** (not gas-used like on Ethereum).

This means:
- Setting gas limits too high → Wastes user funds
- Setting gas limits too low → Transactions fail
- Current limits are based on Ethereum patterns and likely inaccurate

## Testing Process

### 1. Deploy to Monad Testnet

```bash
# Ensure you're on Monad testnet
CHAIN_ID=10143
RPC_URL=https://testnet-rpc.monad.xyz

# Deploy contracts
cd packages/contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network monad
```

### 2. Fund Your Wallet

Get testnet MON from:
- Monad Discord faucet
- https://faucet.monad.xyz

### 3. Run Gas Estimation

Create a test script in your browser console or Node.js:

```javascript
import { estimateAllTransactionTypes, generateGasReport } from '@/lib/blockchain/gasEstimation'

// Test with your connected wallet address
const account = '0x...' // Your wallet address

// Estimate all transaction types
const estimates = await estimateAllTransactionTypes(account)

// Generate report
const report = generateGasReport(estimates)
console.log(report)
```

### 4. Execute Real Transactions

For accurate estimates, execute real transactions:

1. **Transfer Tokens**
   - Send 1 WUXIA to another address
   - Note gas used in explorer: https://monadvision.xyz

2. **Stake Tokens**
   - Stake 1000 WUXIA for 7 days
   - Note gas used

3. **Unstake Tokens**
   - Wait for lock period to expire
   - Unstake tokens
   - Note gas used

4. **Purchase Boost**
   - Buy a boost from ItemStore
   - Note gas used

5. **Increase Stake**
   - Add more tokens to existing stake
   - Note gas used

### 5. Check Gas Usage in Explorer

For each transaction:
1. Copy transaction hash
2. Open in Monad explorer: https://monadvision.xyz/tx/{hash}
3. Find "Gas Used" field
4. Compare with current limits

### 6. Update Gas Limits

Edit `src/lib/blockchain/config.ts`:

```typescript
export const GAS_LIMITS = {
  TOKEN_TRANSFER: 100_000n, // Update with actual + 10% buffer
  TOKEN_MINT: 200_000n,     // Update with actual + 10% buffer
  BOOST_PURCHASE: 300_000n, // Update with actual + 10% buffer
  SUBSCRIPTION_PURCHASE: 350_000n, // Update with actual + 10% buffer
  STAKE: 250_000n,          // Update with actual + 10% buffer
  UNSTAKE: 200_000n,        // Update with actual + 10% buffer
  INCREASE_STAKE: 200_000n, // Update with actual + 10% buffer
} as const
```

**Formula**: `actual_gas_used * 1.1` (add 10% buffer)

## Example Output

```
=== GAS OPTIMIZATION REPORT ===
Generated: 2025-02-09T12:00:00.000Z

Summary: 3 of 7 transaction types need gas limit updates

TRANSACTIONS REQUIRING UPDATES:

TOKEN_TRANSFER
  Estimated: 45,000 gas
  Current Limit: 100,000 gas
  Recommended: 49,500 gas
  Difference: 55,000 gas (55.0%)
  Status: TOO_HIGH

BOOST_PURCHASE
  Estimated: 120,000 gas
  Current Limit: 300,000 gas
  Recommended: 132,000 gas
  Difference: 180,000 gas (60.0%)
  Status: TOO_HIGH

STAKE
  Estimated: 85,000 gas
  Current Limit: 250,000 gas
  Recommended: 93,500 gas
  Difference: 165,000 gas (66.0%)
  Status: TOO_HIGH

=== RECOMMENDATIONS ===

1. For transactions marked TOO_HIGH: Reduce gas limit to recommended value
2. For transactions marked TOO_LOW: Increase gas limit to recommended value
3. Update GAS_LIMITS in src/lib/blockchain/config.ts
4. Test again after updating to verify

Remember: On Monad, gas is charged on gas-limit (not gas-used).
Setting accurate limits saves user funds!
```

## Testing Checklist

- [ ] Deploy contracts to Monad testnet
- [ ] Fund wallet with testnet MON
- [ ] Execute TOKEN_TRANSFER transaction
- [ ] Execute TOKEN_MINT transaction
- [ ] Execute STAKE transaction
- [ ] Execute UNSTAKE transaction
- [ ] Execute BOOST_PURCHASE transaction
- [ ] Execute SUBSCRIPTION_PURCHASE transaction
- [ ] Execute INCREASE_STAKE transaction
- [ ] Check gas usage for all transactions in explorer
- [ ] Update GAS_LIMITS in config.ts
- [ ] Re-test to verify new limits work
- [ ] Document findings in this file

## Current Limits (Pre-Test)

Based on Ethereum patterns - **NEED TESTING ON MONAD**:

```typescript
TOKEN_TRANSFER: 100,000 gas
TOKEN_MINT: 200,000 gas
BOOST_PURCHASE: 300,000 gas
SUBSCRIPTION_PURCHASE: 350,000 gas
STAKE: 250,000 gas
UNSTAKE: 200,000 gas
INCREASE_STAKE: 200,000 gas
```

## Expected Monad Gas Usage

Monad has:
- Lower storage costs than Ethereum
- Faster block times (400ms)
- Different gas scheduling

**Hypothesis**: Actual usage will be 30-50% lower than current limits.

## Tools & Resources

- **RPC**: https://testnet-rpc.monad.xyz
- **Explorer**: https://monadvision.xyz
- **Faucet**: Check Monad Discord
- **Chain ID**: 10143
- **Gas Estimation**: `src/lib/blockchain/gasEstimation.ts`

## Notes

- Gas estimation is free (doesn't execute transaction)
- Real transactions required for accurate measurements
- Re-test after any contract changes
- Document actual gas used for future reference

## Post-Test Updates

After testing, update this section with actual findings:

```
## Actual Gas Usage (Post-Test)

DATE: [Fill in after testing]

TOKEN_TRANSFER: [actual] gas (was: 100,000)
TOKEN_MINT: [actual] gas (was: 200,000)
BOOST_PURCHASE: [actual] gas (was: 300,000)
SUBSCRIPTION_PURCHASE: [actual] gas (was: 350,000)
STAKE: [actual] gas (was: 250,000)
UNSTAKE: [actual] gas (was: 200,000)
INCREASE_STAKE: [actual] gas (was: 200,000)

Savings: [% reduction from original limits]
```
