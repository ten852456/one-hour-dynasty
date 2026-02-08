# ⛓️ BLOCKCHAIN AGENT - Smart Contracts

> Focus: Validity, Security, and Gas Optimization

## Project Overview

We are building the on-chain infrastructure for **One Hour Dynasty**, a strategy game for AI agents.
The goal is to support the **Agent+Token Track** for the Monad Hackathon.

## Core Contracts

### 1. 🪙 Token Economy (`WuxiaToken.sol` + `ItemStore.sol`)

- **Token:** $WUXIA (ERC-20), 100M Fixed Supply, Burnable.
- **ItemStore:**
  - Sell pre-game boosts (Burn WUXIA).
  - Sell subscriptions (Send WUXIA to Treasury).
  - Sell cosmetics (Burn WUXIA).

### 2. 🎮 Game Logic (`GameRegistry.sol`)

- **Entry Fee:** Accepts **MON** only.
- **Matchmaking:** Assigns agents to Game IDs.
- **Prizes:** Distributes MON to winners.
- **State:** Stores game results (winner, score hash).

### 3. 🤖 Identity & Stats (`AgentRegistry.sol`)

- **Registration:** Map wallet address to Agent Name.
- **Stats:** Track games played, wins, ELO rating.
- **Uniqueness:** Prevent Sybil attacks (1 wallet = 1 agent).

### 4. 🏦 Staking (`Staking.sol`)

- **Lock:** Users lock WUXIA for X duration.
- **Benefits:**
  - Priority Queue (skip wait).
  - Governance rights.
  - Revenue share (future).

## Development Stack

- **Framework:** Hardhat
- **Language:** Solidity ^0.8.20
- **Network:** Monad Verify Testnet / Mainnet
- **Libraries:** OpenZeppelin (ERC20, Ownable, ReentrancyGuard)

## Directory Structure

```
packages/contracts/
├── contracts/
│   ├── WuxiaToken.sol      # ERC-20
│   ├── GameRegistry.sol    # Entry/Prizes
│   ├── AgentRegistry.sol   # Identity/Stats
│   ├── ItemStore.sol       # Shop (Boost/Subs)
│   ├── Staking.sol         # Locking
│   └── mocks/              # For testing
├── scripts/
│   ├── deploy.ts
│   └── verify.ts
├── test/
│   └── GameRegistry.test.ts
└── hardhat.config.ts
```

## Implementation Steps

1.  **Setup Hardhat Project:** Initialize in `packages/contracts`
2.  **Create WuxiaToken:** Standard ERC-20 with burn function.
3.  **Create AgentRegistry:** Basic mapping of address -> stats.
4.  **Create GameRegistry:** Integrate with AgentRegistry, handle MON payments.
5.  **Create ItemStore:** Handle WUXIA payments for items (burn/treasury).
6.  **Create Staking:** Simple locking mechanism for priority status.
7.  **Test:** Extensive unit tests for all flows.
8.  **Deploy:** Script to deploy all contracts and link them.

## Key Design Decisions

- **Gas Optimization:** Use `uint256` for packing where possible, but prioritize readability.
- **Security:** Use `ReentrancyGuard` for all payment functions.
- **Upgradability:** Consider UUPS for GameRegistry if rules might change (optional for Hackathon).
- **Owner:** Use `Ownable` for admin functions (start game, set fees).

## Environment Variables

```
MONAD_RPC_URL="https://testnet-rpc.monad.xyz/"
PRIVATE_KEY="0x..."
ETHERSCAN_API_KEY="Monitor API Key"
```

## Reference Docs

- `../../docs/TOKENOMICS.md` - Token details
- `../../docs/WHITEPAPER.md` - Game rules
