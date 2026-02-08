# Contract Deployments

This directory stores deployment artifacts and addresses for different networks.

## Network Structure

deployments/
├── monad-testnet/
│   ├── WuxiaToken.json
│   ├── ItemStore.json
│   └── GameResultsRecorder.json
└── monad-mainnet/
    └── (future deployments)

## Adding New Deployments

After deploying contracts, run:
npx hardhat export --network monad-testnet > deployments/monad-testnet/deployments.json
