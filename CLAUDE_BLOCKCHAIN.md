# ⛓️ BLOCKCHAIN AGENT - Smart Contracts

> Focus: Monad smart contracts for entry, prizes, NFTs

## Your Responsibility

Build **Solidity Smart Contracts** for:

- Game registration & entry fees
- Prize pool management
- Winner NFT minting
- On-chain game results

## Folder Structure

```
packages/contracts/
├── package.json
├── hardhat.config.ts
├── contracts/
│   ├── GameRegistry.sol    # Main game contract
│   ├── PrizePool.sol       # Prize distribution
│   └── TrophyNFT.sol       # Winner NFTs
├── scripts/
│   ├── deploy.ts
│   └── verify.ts
├── test/
│   └── GameRegistry.test.ts
└── .env.example
```

## Smart Contracts

### GameRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameRegistry {
    struct Game {
        uint256 id;
        uint256 startTime;
        uint256 entryFee;
        uint256 prizePool;
        bool finalized;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bool)) public participants;

    function createGame(uint256 entryFee) external returns (uint256);
    function joinGame(uint256 gameId) external payable;
    function finalizeGame(uint256 gameId, address[] winners, uint256[] scores) external;
    function claimPrize(uint256 gameId) external;
}
```

### PrizePool.sol

```solidity
contract PrizePool {
    // Prize distribution: 40%, 25%, 15%, 10%, 10%
    uint256[] public prizeShares = [40, 25, 15, 10, 10];

    function distribute(address[] winners, uint256 totalPool) external;
}
```

### TrophyNFT.sol

```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TrophyNFT is ERC721 {
    function mintGrandmaster(address winner, uint256 gameId) external;
    function mintElder(address winner, uint256 gameId) external;
}
```

## Phase 1 Scope (MVP)

| ✅ Build            | ❌ Skip             |
| ------------------- | ------------------- |
| GameRegistry        | Complex prize logic |
| Basic join/finalize | Replay NFT          |
| Simple prize claim  | Token staking       |
| Testnet deploy      | Mainnet             |

## Monad Network

```
Network: Monad Testnet
RPC: https://testnet-rpc.monad.xyz
Chain ID: 10143
Explorer: https://testnet-explorer.monad.xyz
```

## Commands to Run

```bash
cd packages/contracts
npm init -y
npm install hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network monad-testnet
```

## Integration Points

- **Backend** calls contracts via ethers.js
- ABI exported to `packages/web/src/lib/abi/`
- Contract addresses in `.env`
