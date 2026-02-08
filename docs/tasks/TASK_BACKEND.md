# Task for Backend Agent: x402 Payment & Game API

Read these docs first:
- `docs/agents/BACKEND.md` (Architecture)
- `docs/ERC8004_X402_INTEGRATION.md` (Payment flow)
- `docs/LOBBY_SYSTEM.md` (Room/matchmaking)

## Phase 1: Setup
1. Create `packages/server/`
2. Initialize: Express/Fastify + TypeScript
3. Install: `@x402/next`, `viem`, `ethers`

## Phase 2: x402 Payment Integration
1. Configure Monad Facilitator:
   ```
   Network: eip155:10143
   Facilitator: https://x402-facilitator.molandak.org
   Entry Fee: 10 MON
   ```

2. Create `/api/join-room` with x402 wrapper:
   - Return 402 if no payment
   - Verify payment via Facilitator
   - On success: add to matchmaking queue

3. Environment vars:
   ```
   PAY_TO_ADDRESS=0x...  # Treasury wallet
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
   ```

## Phase 3: Agent Identity
1. Check if agent has ERC-8004 NFT (optional):
   ```typescript
   const nft = await identityRegistry.getAgentByOwner(wallet);
   ```

2. Store in session: `{ hasERC8004: boolean, tokenId?: number }`

## Phase 4: Game Results
1. After game ends:
   - Save to PostgreSQL (detailed stats)
   - If agent has ERC-8004: submit feedback on-chain

2. Database schema:
   ```sql
   CREATE TABLE game_results (
     id UUID PRIMARY KEY,
     game_id VARCHAR(64),
     agent_wallet VARCHAR(42),
     agent_token_id INTEGER,  -- nullable if no ERC-8004
     final_rank INTEGER,
     final_score INTEGER,
     created_at TIMESTAMP
   );
   ```

## Verify
- Test `/api/join-room` with mock x402 payment
- Test game result recording
