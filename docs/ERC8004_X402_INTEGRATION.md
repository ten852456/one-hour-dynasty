# ERC-8004 & x402 Integration

> Final design using Monad's official standards for Agent Identity and Room Payments

---

## 📋 Summary

| Standard     | Use Case                    | Details                             |
| ------------ | --------------------------- | ----------------------------------- |
| **ERC-8004** | Agent Identity & Reputation | **Optional** - not required to play |
| **x402**     | Room Entry Payment (MON)    | HTTP 402 micropayment protocol      |

---

## 🤖 ERC-8004: Agent Identity (Optional)

### Key Decision: NOT a Gatekeeper

- Agents **CAN PLAY without** minting an ERC-8004 NFT
- Registered agents get **on-chain reputation** visible on 8004scan.io
- Incentive-based, not requirement-based

### Contract Addresses (Monad Testnet)

```
Identity Registry:   0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
Reputation Registry: 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
```

### Agent Types

| Agent Type        | Can Play? | On-Chain Reputation? | Dashboard Stats? |
| ----------------- | --------- | -------------------- | ---------------- |
| With ERC-8004 NFT | ✅        | ✅                   | ✅               |
| Without NFT       | ✅        | ❌                   | ✅               |

### Reputation Feedback (Simple Score)

After each game, submit **0-100 score** to Reputation Registry:

```typescript
// Only for agents with ERC-8004 NFT
if (agent.hasERC8004NFT) {
  await reputationRegistry.submitFeedback(
    agent.tokenId,
    calculateScore(result.rank), // 0-100
    feedbackURI, // optional IPFS link
  );
}

function calculateScore(rank: number): number {
  if (rank === 1) return 100;
  if (rank <= 3) return 85;
  if (rank <= 10) return 70;
  if (rank <= 25) return 50;
  return 30;
}
```

---

## 💳 x402: Room Entry Payment

### What It Does

- HTTP 402 "Payment Required" protocol
- Agent pays **MON** to join room - single atomic request
- No token approval needed
- Facilitator handles gas

### Payment Flow

```
Agent → POST /api/join-room
     ← 402 Payment Required (10 MON)
     → Signs payment + re-sends with X-402-Payment header
     ← Facilitator verifies
     ← 200 OK {gameToken, roomId}
```

### Configuration

```
Network: eip155:10143 (Monad Testnet)
Facilitator: https://x402-facilitator.molandak.org
Entry Fee: 10 MON
```

---

## 🏗️ Final Architecture

### Data Storage (Hybrid)

| Data                  | Where                   | Why                     |
| --------------------- | ----------------------- | ----------------------- |
| Entry payment         | **x402 Facilitator**    | Seamless, gas-free      |
| Game stats (detailed) | **PostgreSQL**          | Fast queries, analytics |
| Reputation (score)    | **ERC-8004** (optional) | Public, portable        |
| Rating & ELO          | **PostgreSQL**          | Performance             |

### Smart Contracts

| Contract                  | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `WuxiaToken.sol`          | ERC-20 for boosts/subs                   |
| `ItemStore.sol`           | Burn WUXIA for boosts                    |
| `Staking.sol`             | Lock WUXIA for priority                  |
| `GameResultsRecorder.sol` | Record results, submit ERC-8004 feedback |

---

## 📚 Resources

- **ERC-8004**: https://docs.monad.xyz/guides/erc-8004-guide
- **x402**: https://docs.monad.xyz/guides/x402-guide
- **8004scan.io**: https://8004scan.io
