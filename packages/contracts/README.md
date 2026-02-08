# One Hour Dynasty - Smart Contracts

Smart contracts for the One Hour Dynasty game on Monad blockchain.

## Contracts

### WuxiaToken (ERC-20)
- **Total Supply:** 100,000,000 WUXIA
- **Features:** Burnable, Ownable with mint function
- **Purpose:** Game utility token for boosts, subscriptions, and staking

### ItemStore
- **Purpose:** Sell boosts (burn) and subscriptions (treasury revenue)
- **Boosts:**
  - SPEED_START: 10 WUXIA (+20% starting resources)
  - VISION_PLUS: 15 WUXIA (+1 vision range)
  - LUCKY_SPAWN: 20 WUXIA (Guaranteed Spirit Vein)
  - DOUBLE_XP: 25 WUXIA (Rating gain x2)
- **Subscriptions:**
  - BRONZE: 100 WUXIA (Unlimited TRAINING)
  - SILVER: 300 WUXIA (BRONZE + 50% ARENA discount)
  - GOLD: 500 WUXIA (SILVER + Priority Queue + Beta)

### Staking
- **Purpose:** Lock WUXIA for priority access and governance
- **Tiers:**
  - 1,000 WUXIA: Priority Queue
  - 5,000 WUXIA: Grand War access
  - 10,000 WUXIA: Governance rights

### GameResultsRecorder
- **Purpose:** Record game results, submit ERC-8004 feedback, distribute prizes
- **ERC-8004 Integration:** Optional reputation for agents
- **Reputation Scoring:**
  - Rank 1: 100 points
  - Rank 2-3: 85 points
  - Rank 4-10: 70 points
  - Rank 11-25: 50 points
  - Rank 26+: 30 points

## Development

### Installation
\`\`\`bash
npm install
\`\`\`

### Compile
\`\`\`bash
npm run compile
\`\`\`

### Test
\`\`\`bash
npm test
\`\`\`

### Deploy to Monad Testnet
\`\`\`bash
npm run deploy:testnet
\`\`\`

### Verify Contracts
\`\`\`bash
npm run verify:testnet
\`\`\`

## Environment Variables

Create a \`.env\` file:
\`\`\`env
MONAD_RPC_URL="https://testnet-rpc.monad.xyz/"
PRIVATE_KEY="0x..."
ETHERSCAN_API_KEY="monitor_api_key"
\`\`\`

## Monad Testnet Details

- **Chain ID:** 10143
- **RPC:** https://testnet-rpc.monad.xyz
- **Explorer:** https://monadvision.com
- **Faucet:** https://faucet.monad.xyz

## ERC-8004 Integration

### Contract Addresses (Monad Testnet)
- **Identity Registry:** \`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432\`
- **Reputation Registry:** \`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63\`

### Reputation Scoring
- Rank 1: 100 points
- Rank 2-3: 85 points
- Rank 4-10: 70 points
- Rank 11-25: 50 points
- Rank 26+: 30 points

## License

MIT
