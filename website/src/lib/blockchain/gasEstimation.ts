/**
 * Gas Estimation Utilities for Monad Testnet
 *
 * IMPORTANT: On Monad, gas is charged on gas-limit (not gas-used)
 * This means setting gas limits too high wastes user funds!
 *
 * Before deploying to production:
 * 1. Deploy contracts to Monad testnet
 * 2. Execute each transaction type
 * 3. Check actual gas usage in explorer: https://monadvision.xyz
 * 4. Update GAS_LIMITS in config.ts with actual usage + 10% buffer
 */

import { estimateGas } from 'viem/actions'
import { config, CONTRACTS, getGasLimit } from './config'
import WuxiaTokenAbi from './abis/WuxiaToken.json'
import StakingAbi from './abis/Staking.json'
import ItemStoreAbi from './abis/ItemStore.json'

/**
 * Gas estimation result
 */
export interface GasEstimate {
  transactionType: string
  estimatedGas: bigint
  currentLimit: bigint
  recommendedLimit: bigint
  difference: bigint
  differencePercent: number
  recommendation: 'OK' | 'TOO_HIGH' | 'TOO_LOW'
}

/**
 * Estimate gas for a transaction and compare with current limits
 *
 * @param transactionType - Type of transaction to estimate
 * @param account - Address executing the transaction
 * @param args - Transaction arguments
 * @returns Gas estimation result with recommendations
 */
export async function estimateTransactionGas(
  transactionType: keyof ReturnType<typeof getGasLimit>,
  account: `0x${string}`,
  args?: unknown[]
): Promise<GasEstimate> {
  let estimatedGas = 0n

  try {
    switch (transactionType) {
      case 'TOKEN_TRANSFER': {
        const [to, amount] = (args || []) as [`0x${string}`, bigint]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.WUXIA_TOKEN,
          abi: WuxiaTokenAbi.abi,
          functionName: 'transfer',
          args: [to, amount],
        })
        break
      }

      case 'TOKEN_MINT': {
        const [to, amount] = (args || []) as [`0x${string}`, bigint]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.WUXIA_TOKEN,
          abi: WuxiaTokenAbi.abi,
          functionName: 'mint',
          args: [to, amount],
        })
        break
      }

      case 'BOOST_PURCHASE': {
        const [boostType] = (args || []) as [number]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.ITEM_STORE,
          abi: ItemStoreAbi.abi,
          functionName: 'purchaseBoost',
          args: [boostType],
        })
        break
      }

      case 'SUBSCRIPTION_PURCHASE': {
        const [tier] = (args || []) as [number]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.ITEM_STORE,
          abi: ItemStoreAbi.abi,
          functionName: 'purchaseSubscription',
          args: [tier],
        })
        break
      }

      case 'STAKE': {
        const [amount, lockDuration] = (args || []) as [bigint, number]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.STAKING,
          abi: StakingAbi.abi,
          functionName: 'stake',
          args: [amount, lockDuration],
        })
        break
      }

      case 'UNSTAKE': {
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.STAKING,
          abi: StakingAbi.abi,
          functionName: 'unstake',
          args: [],
        })
        break
      }

      case 'INCREASE_STAKE': {
        const [additionalAmount] = (args || []) as [bigint]
        estimatedGas = await estimateGas(config, {
          account,
          to: CONTRACTS.STAKING,
          abi: StakingAbi.abi,
          functionName: 'increaseStake',
          args: [additionalAmount],
        })
        break
      }

      default:
        throw new Error(`Unknown transaction type: ${transactionType}`)
    }
  } catch (error) {
    console.error(`Failed to estimate gas for ${transactionType}:`, error)
    // Return current limit as fallback
    estimatedGas = getGasLimit(transactionType)
  }

  const currentLimit = getGasLimit(transactionType)
  const recommendedLimit = estimatedGas + (estimatedGas / 10n) // Add 10% buffer
  const difference = currentLimit - estimatedGas
  const differencePercent = Number((difference * 100n) / currentLimit)

  let recommendation: GasEstimate['recommendation'] = 'OK'
  if (differencePercent > 50) {
    recommendation = 'TOO_HIGH'
  } else if (difference < 0n || differencePercent < 5) {
    recommendation = 'TOO_LOW'
  }

  return {
    transactionType,
    estimatedGas,
    currentLimit,
    recommendedLimit,
    difference,
    differencePercent,
    recommendation,
  }
}

/**
 * Estimate all transaction types and return report
 * Useful for testing gas limits on testnet
 *
 * @param account - Address to test with
 * @returns Array of gas estimates for all transaction types
 */
export async function estimateAllTransactionTypes(
  account: `0x${string}`
): Promise<GasEstimate[]> {
  const estimates: GasEstimate[] = []

  // Define test parameters
  const testTo = account
  const testAmount = 1000000000000000000n // 1 token
  const testLockDuration = 86400 // 1 day
  const testBoostType = 0 // First boost type
  const testTier = 0 // First subscription tier

  // Test all transaction types
  const transactionTypes = [
    { type: 'TOKEN_TRANSFER' as const, args: [testTo, testAmount] },
    { type: 'TOKEN_MINT' as const, args: [testTo, testAmount] },
    { type: 'BOOST_PURCHASE' as const, args: [testBoostType] },
    { type: 'SUBSCRIPTION_PURCHASE' as const, args: [testTier] },
    { type: 'STAKE' as const, args: [testAmount, testLockDuration] },
    { type: 'INCREASE_STAKE' as const, args: [testAmount] },
  ]

  for (const { type, args } of transactionTypes) {
    try {
      const estimate = await estimateTransactionGas(type, account, args)
      estimates.push(estimate)
    } catch (error) {
      console.error(`Failed to estimate ${type}:`, error)
    }
  }

  // Test UNSTAKE separately (requires actual stake)
  try {
    const unstakeEstimate = await estimateTransactionGas('UNSTAKE', account, [])
    estimates.push(unstakeEstimate)
  } catch (error) {
    console.error('Failed to estimate UNSTAKE (may require active stake):', error)
  }

  return estimates
}

/**
 * Format gas estimate for display
 */
export function formatGasEstimate(estimate: GasEstimate): string {
  const { transactionType, estimatedGas, currentLimit, recommendedLimit, difference, differencePercent, recommendation } = estimate

  return `
${transactionType}
  Estimated: ${estimatedGas.toLocaleString()} gas
  Current Limit: ${currentLimit.toLocaleString()} gas
  Recommended: ${recommendedLimit.toLocaleString()} gas
  Difference: ${difference.toLocaleString()} gas (${differencePercent.toFixed(1)}%)
  Status: ${recommendation}
`
}

/**
 * Generate gas optimization report
 */
export function generateGasReport(estimates: GasEstimate[]): string {
  let report = '=== GAS OPTIMIZATION REPORT ===\n'
  report += 'Generated: ' + new Date().toISOString() + '\n\n'

  const needsUpdate = estimates.filter(e => e.recommendation !== 'OK')

  report += `Summary: ${needsUpdate.length} of ${estimates.length} transaction types need gas limit updates\n\n`

  if (needsUpdate.length > 0) {
    report += 'TRANSACTIONS REQUIRING UPDATES:\n\n'
    for (const estimate of needsUpdate) {
      report += formatGasEstimate(estimate)
    }
  }

  report += '\nALL TRANSACTIONS:\n\n'
  for (const estimate of estimates) {
    report += formatGasEstimate(estimate)
  }

  report += '\n=== RECOMMENDATIONS ===\n\n'
  report += '1. For transactions marked TOO_HIGH: Reduce gas limit to recommended value\n'
  report += '2. For transactions marked TOO_LOW: Increase gas limit to recommended value\n'
  report += '3. Update GAS_LIMITS in src/lib/blockchain/config.ts\n'
  report += '4. Test again after updating to verify\n'
  report += '\nRemember: On Monad, gas is charged on gas-limit (not gas-used).\n'
  report += 'Setting accurate limits saves user funds!\n'

  return report
}
