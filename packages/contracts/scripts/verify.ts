import { run } from "hardhat";

async function main() {
  // Replace with your deployed addresses
  const wuxiaAddress = "YOUR_WUXIA_TOKEN_ADDRESS";
  const itemStoreAddress = "YOUR_ITEM_STORE_ADDRESS";
  const stakingAddress = "YOUR_STAKING_ADDRESS";
  const recorderAddress = "YOUR_RECORDER_ADDRESS";
  const deployerAddress = "YOUR_DEPLOYER_ADDRESS";
  const reputationRegistry = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";

  console.log("Verifying contracts on Monad Testnet...");

  try {
    await run("verify:verify", {
      address: wuxiaAddress,
      constructorArguments: [],
      network: "monad-testnet",
    });
    console.log("WuxiaToken verified");
  } catch (e) {
    console.log("WuxiaToken verification failed or already verified");
  }

  try {
    await run("verify:verify", {
      address: itemStoreAddress,
      constructorArguments: [wuxiaAddress, deployerAddress],
      network: "monad-testnet",
    });
    console.log("ItemStore verified");
  } catch (e) {
    console.log("ItemStore verification failed or already verified");
  }

  try {
    await run("verify:verify", {
      address: stakingAddress,
      constructorArguments: [wuxiaAddress],
      network: "monad-testnet",
    });
    console.log("Staking verified");
  } catch (e) {
    console.log("Staking verification failed or already verified");
  }

  try {
    await run("verify:verify", {
      address: recorderAddress,
      constructorArguments: [wuxiaAddress, reputationRegistry],
      network: "monad-testnet",
    });
    console.log("GameResultsRecorder verified");
  } catch (e) {
    console.log("GameResultsRecorder verification failed or already verified");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
