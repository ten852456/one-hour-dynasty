import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get network-specific reputation registry address
  const network = await ethers.provider.getNetwork();
  let reputationRegistry: string;

  if (network.chainId === 10143n) {
    // Monad Testnet
    reputationRegistry = process.env.REPUTATION_REGISTRY || "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    console.log("Using Monad Testnet Reputation Registry");
  } else if (network.chainId === 143n) {
    // Monad Mainnet (when available)
    reputationRegistry = process.env.REPUTATION_REGISTRY || "0x0000000000000000000000000000000000000000";
    console.log("Using Monad Mainnet Reputation Registry (TODO: verify)");
  } else {
    throw new Error("Unsupported network. Please set REPUTATION_REGISTRY environment variable.");
  }

  // Deploy WuxiaToken
  console.log("\n1. Deploying WuxiaToken...");
  const WuxiaToken = await ethers.getContractFactory("WuxiaToken");
  const wuxia = await WuxiaToken.deploy(deployer.address);
  await wuxia.waitForDeployment();
  const wuxiaAddress = await wuxia.getAddress();
  console.log("   WuxiaToken deployed to:", wuxiaAddress);

  // Deploy ItemStore
  console.log("\n2. Deploying ItemStore...");
  const ItemStore = await ethers.getContractFactory("ItemStore");
  const itemStore = await ItemStore.deploy(wuxiaAddress, deployer.address);
  await itemStore.waitForDeployment();
  const itemStoreAddress = await itemStore.getAddress();
  console.log("   ItemStore deployed to:", itemStoreAddress);

  // Deploy Staking
  console.log("\n3. Deploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(wuxiaAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("   Staking deployed to:", stakingAddress);

  // Deploy GameResultsRecorder
  console.log("\n4. Deploying GameResultsRecorder...");
  console.log("   Reputation Registry:", reputationRegistry);

  const GameResultsRecorder = await ethers.getContractFactory("GameResultsRecorder");
  const recorder = await GameResultsRecorder.deploy(wuxiaAddress, reputationRegistry);
  await recorder.waitForDeployment();
  const recorderAddress = await recorder.getAddress();
  console.log("   GameResultsRecorder deployed to:", recorderAddress);

  // Deployment summary
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", chainId.toString());
  console.log("WuxiaToken:", wuxiaAddress);
  console.log("ItemStore:", itemStoreAddress);
  console.log("Staking:", stakingAddress);
  console.log("GameResultsRecorder:", recorderAddress);
  console.log("Deployer:", deployer.address);

  // Verification commands
  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network monad-testnet ${wuxiaAddress}`);
  console.log(`npx hardhat verify --network monad-testnet ${itemStoreAddress} ${wuxiaAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network monad-testnet ${stakingAddress} ${wuxiaAddress}`);
  console.log(`npx hardhat verify --network monad-testnet ${recorderAddress} ${wuxiaAddress} ${reputationRegistry}`);

  // Save deployment info
  const deployment = {
    chainId: chainId.toString(),
    wuxiaToken: wuxiaAddress,
    itemStore: itemStoreAddress,
    staking: stakingAddress,
    gameResultsRecorder: recorderAddress,
    reputationRegistry: reputationRegistry,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${chainId.toString()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment info saved to:", deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
