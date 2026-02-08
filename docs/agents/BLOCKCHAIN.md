# ⛓️ BLOCKCHAIN AGENT - Smart Contracts

> Focus: Validity, Security, and Gas Optimization

## Project Overview

We are building the on-chain infrastructure for **One Hour Dynasty**, a strategy game for AI agents.
The goal is to support the **Agent+Token Track** for the Monad Hackathon.

**Key Standards Used:**

- **ERC-8004**: Trustless Agent Identity & Reputation (Monad native)
- **x402**: HTTP 402 Micropayments for room entry

## Core Contracts

### 1. 🪙 Token Economy (`WuxiaToken.sol` + `ItemStore.sol`)

- **Token:** $WUXIA (ERC-20), 100M Fixed Supply, Burnable.
- **ItemStore:**
  - Sell pre-game boosts (Burn WUXIA).
  - Sell subscriptions (Send WUXIA to Treasury).
  - Sell cosmetics (Burn WUXIA).

### 2. 🤖 Agent Identity (ERC-8004 - USE EXISTING)

- **DO NOT CREATE custom AgentRegistry** - use Monad's ERC-8004!
- **Identity Registry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Reputation Registry:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- See: https://docs.monad.xyz/guides/erc-8004-guide

### 3. 💳 Room Payment (x402 - Backend Integration)

- **DO NOT CREATE payment contract** - use x402 HTTP protocol!
- **Facilitator:** `https://x402-facilitator.molandak.org`
- Backend wraps `/api/join-room` with `@x402/next`
- See: https://docs.monad.xyz/guides/x402-guide

### 4. 🎮 Game Results (`GameResultsRecorder.sol`)

- Records game outcomes on-chain
- Submits feedback to ERC-8004 Reputation Registry
- Distributes MON prizes to winners

### 5. 🏦 Staking (`Staking.sol`)

- **Lock:** Users lock WUXIA for X duration.
- **Benefits:**
  - Priority Queue (skip wait).
  - Governance rights.
  - Revenue share (future).

## Development Stack

- **Framework:** Hardhat
- **Language:** Solidity ^0.8.20
- **Network:** Monad Testnet (eip155:10143) / Mainnet
- **Libraries:** OpenZeppelin (ERC20, Ownable, ReentrancyGuard)

## Directory Structure

```
packages/contracts/
├── contracts/
│   ├── WuxiaToken.sol          # ERC-20 + Burn
│   ├── ItemStore.sol           # Shop (Boost/Subs)
│   ├── GameResultsRecorder.sol # Game outcomes + reputation
│   ├── Staking.sol             # Priority queue
│   └── mocks/                  # For testing
├── scripts/
│   ├── deploy.ts
│   └── verify.ts
├── test/
│   └── WuxiaToken.test.ts
└── hardhat.config.ts
```

## Implementation Steps

1.  **Setup Hardhat Project:** Initialize in `packages/contracts`
2.  **Create WuxiaToken:** Standard ERC-20 with burn function.
3.  **Create ItemStore:** Handle WUXIA payments for items (burn/treasury).
4.  **Create GameResultsRecorder:** Record results, submit ERC-8004 feedback.
5.  **Create Staking:** Simple locking mechanism for priority status.
6.  **Test:** Extensive unit tests for all flows.
7.  **Deploy:** Script to deploy all contracts.

## Key Design Decisions

- **No Custom AgentRegistry:** Use ERC-8004 Identity Registry instead.
- **No Payment Contract:** Use x402 HTTP protocol instead.
- **Gas Optimization:** Use `uint256` for packing where possible.
- **Security:** Use `ReentrancyGuard` for all payment functions.
- **Owner:** Use `Ownable` for admin functions.

## Environment Variables

```
MONAD_RPC_URL="https://testnet-rpc.monad.xyz/"
PRIVATE_KEY="0x..."
ETHERSCAN_API_KEY="Monitor API Key"
ERC8004_IDENTITY="0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
ERC8004_REPUTATION="0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
```

## Reference Docs

- `../../docs/TOKENOMICS.md` - Token details
- `../../docs/WHITEPAPER.md` - Game rules
- `../../docs/ERC8004_X402_INTEGRATION.md` - Integration guide
