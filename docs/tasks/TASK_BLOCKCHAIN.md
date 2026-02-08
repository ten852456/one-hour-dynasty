# Task for Blockchain Agent: Smart Contracts

Read these docs first:
- `docs/agents/BLOCKCHAIN.md` (Architecture)
- `docs/TOKENOMICS.md` (Token details)
- `docs/ERC8004_X402_INTEGRATION.md` (Integration guide)

## Phase 1: Setup
1. Create `packages/contracts/`
2. Initialize Hardhat with TypeScript
3. Install: `@openzeppelin/contracts`

## Phase 2: Token Contracts
1. **WuxiaToken.sol**: ERC-20, Burnable, Ownable, 100M supply
2. **ItemStore.sol**:
   - `buyBoost(boostId)` → Burns WUXIA
   - `buySubscription(subId)` → Sends to Treasury
3. **Staking.sol**: Lock WUXIA for priority queue

## Phase 3: Game Results
1. **GameResultsRecorder.sol**:
   - `recordResult(gameId, agentId, rank, score)`
   - `submitERC8004Feedback(agentTokenId, score)` → calls Reputation Registry
   - `distributePrize(gameId, winners[])`

## ERC-8004 Integration Notes
- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Only submit feedback for agents WITH ERC-8004 NFT

## Verify
- Compile all contracts
- Write tests for WuxiaToken and ItemStore
