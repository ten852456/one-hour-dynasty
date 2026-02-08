import { expect } from "chai";
import { ethers } from "hardhat";
import { WuxiaToken, ItemStore, Staking, GameResultsRecorder, MockERC8004Reputation } from "../typechain-types";

describe("Edge Cases and Security Tests", function () {
  let wuxia: WuxiaToken;
  let itemStore: ItemStore;
  let staking: Staking;
  let recorder: GameResultsRecorder;
  let mockReputation: MockERC8004Reputation;

  let owner: any;
  let treasury: any;
  let user: any;

  beforeEach(async function () {
    [owner, treasury, user] = await ethers.getSigners();

    const WuxiaFactory = await ethers.getContractFactory("WuxiaToken");
    wuxia = await WuxiaFactory.deploy(owner.address);
    await wuxia.waitForDeployment();

    const ItemStoreFactory = await ethers.getContractFactory("ItemStore");
    itemStore = await ItemStoreFactory.deploy(await wuxia.getAddress(), treasury.address);
    await itemStore.waitForDeployment();

    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await StakingFactory.deploy(await wuxia.getAddress());
    await staking.waitForDeployment();

    const MockReputationFactory = await ethers.getContractFactory("MockERC8004Reputation");
    mockReputation = await MockReputationFactory.deploy();
    await mockReputation.waitForDeployment();

    const RecorderFactory = await ethers.getContractFactory("GameResultsRecorder");
    recorder = await RecorderFactory.deploy(
      await wuxia.getAddress(),
      await mockReputation.getAddress()
    );
    await recorder.waitForDeployment();

    // Fund user and approve contracts
    await wuxia.connect(owner).transfer(user.address, ethers.parseEther("10000"));
    await wuxia.connect(user).approve(await itemStore.getAddress(), ethers.MaxUint256);
    await wuxia.connect(user).approve(await staking.getAddress(), ethers.MaxUint256);
  });

  describe("WuxiaToken Supply Cap", function () {
    it("Should enforce MAX_SUPPLY at exactly 100M", async function () {
      const MAX_SUPPLY = await wuxia.MAX_SUPPLY();
      expect(MAX_SUPPLY).to.equal(ethers.parseEther("100000000"));
    });

    it("Should allow minting after burning", async function () {
      const burnAmount = ethers.parseEther("1000");
      await wuxia.burn(burnAmount);

      const supplyBefore = await wuxia.totalSupply();
      await wuxia.mint(user.address, burnAmount);
      const supplyAfter = await wuxia.totalSupply();

      expect(supplyAfter).to.equal(supplyBefore + burnAmount);
      expect(supplyAfter).to.equal(ethers.parseEther("100000000"));
    });

    it("Should reject minting that would exceed cap by 1 wei", async function () {
      const burnAmount = ethers.parseEther("1000");
      await wuxia.burn(burnAmount);

      // Try to mint more than burned
      await expect(
        wuxia.mint(user.address, burnAmount + 1n)
      ).to.be.revertedWithCustomError(wuxia, "SupplyCapExceeded");
    });
  });

  describe("ItemStore Price Boundaries", function () {
    it("Should reject setting price to MAX_PRICE + 1", async function () {
      const MAX_PRICE = await itemStore.MAX_PRICE();
      await expect(
        itemStore.connect(owner).setBoostPrice(0, MAX_PRICE + 1n)
      ).to.be.revertedWithCustomError(itemStore, "PriceOutOfRange");
    });

    it("Should accept setting price to exactly MAX_PRICE", async function () {
      const MAX_PRICE = await itemStore.MAX_PRICE();
      await expect(
        itemStore.connect(owner).setBoostPrice(0, MAX_PRICE)
      ).to.not.be.reverted;
    });

    it("Should reject setting price to 0", async function () {
      await expect(
        itemStore.connect(owner).setBoostPrice(0, 0)
      ).to.be.revertedWithCustomError(itemStore, "PriceOutOfRange");
    });
  });

  describe("Staking Edge Cases", function () {
    it("Should allow staking with zero lock duration", async function () {
      await staking.connect(user).stake(ethers.parseEther("1000"), 0);

      expect(await staking.hasPriorityQueue(user.address)).to.be.true;
      // Should be able to unstake immediately with zero lock
      await staking.connect(user).unstake();
    });

    it("Should reject staking 0 amount", async function () {
      await expect(
        staking.connect(user).stake(0, 30 * 24 * 60 * 60)
      ).to.be.revertedWithCustomError(staking, "AmountMustBePositive");
    });
  });

  describe("Subscription Expiry Edge Cases", function () {
    it("Should handle subscription expiry at exact timestamp", async function () {
      await itemStore.connect(user).buySubscription(0);
      const expiry = await itemStore.subscriptionExpiry(user.address);

      // Fast forward to exactly expiry time
      const currentTimestamp = await ethers.provider.getBlock("latest").then(b => b!.timestamp);
      const secondsToExpiry = Number(expiry) - currentTimestamp;
      await ethers.provider.send("evm_increaseTime", [secondsToExpiry]);
      await ethers.provider.send("evm_mine");

      // Should no longer be active
      expect(await itemStore.hasActiveSubscription(user.address)).to.be.false;
    });

    it("Should extend expired subscription from block.timestamp", async function () {
      // Buy first subscription
      await itemStore.connect(user).buySubscription(0);
      const firstExpiry = await itemStore.subscriptionExpiry(user.address);

      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [35 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Get current block timestamp after time travel
      const block = await ethers.provider.getBlock("latest");
      const currentTime = block!.timestamp;

      // Buy second subscription
      await itemStore.connect(user).buySubscription(0);
      const secondExpiry = await itemStore.subscriptionExpiry(user.address);

      // Should be 30 days from current time, not from first expiry
      const expectedExpiry = BigInt(currentTime) + BigInt(30 * 24 * 60 * 60);
      expect(secondExpiry).to.be.closeTo(expectedExpiry, 60n);
    });
  });

  describe("GameResultsRecorder Double Distribution", function () {
    it("Should prevent distributing prizes twice for same game", async function () {
      const gameId = 1;
      const agents = [user.address];
      const ranks = [1];
      const scores = [100];

      // Record game
      await recorder.recordGameResult(gameId, agents, ranks, scores);

      // Fund recorder with tokens
      await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("100"));

      // First distribution should succeed
      await recorder.distributePrize(gameId, [user.address], [ethers.parseEther("50")]);

      // Second distribution should fail
      await expect(
        recorder.distributePrize(gameId, [user.address], [ethers.parseEther("50")])
      ).to.be.revertedWithCustomError(recorder, "PrizesAlreadyDistributed");
    });

    it("Should prevent batch distribution after single distribution", async function () {
      const gameId = 2;
      const agents = [user.address];
      const ranks = [1];
      const scores = [100];

      await recorder.recordGameResult(gameId, agents, ranks, scores);
      await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("100"));

      // First single distribution
      await recorder.distributePrize(gameId, [user.address], [ethers.parseEther("30")]);

      // Try batch distribution
      await expect(
        recorder.batchDistributePrizes(gameId, [user.address], [ethers.parseEther("70")])
      ).to.be.revertedWithCustomError(recorder, "PrizesAlreadyDistributed");
    });

    it("Should allow recording new game after previous game prizes distributed", async function () {
      // First game
      await recorder.recordGameResult(1, [user.address], [1], [100]);
      await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("100"));
      await recorder.distributePrize(1, [user.address], [ethers.parseEther("50")]);

      // Second game (should succeed)
      await recorder.recordGameResult(2, [user.address], [1], [100]);
      expect(await recorder.getAgentRank(2, user.address)).to.equal(1);
    });
  });

  describe("BoostPurchased Event Amount", function () {
    it("Should emit correct amount in BoostPurchased event", async function () {
      const boostType = 0; // SPEED_START
      const expectedAmount = ethers.parseEther("10");

      await expect(itemStore.connect(user).buyBoost(boostType))
        .to.emit(itemStore, "BoostPurchased")
        .withArgs(user.address, boostType, expectedAmount);
    });

    it("Should emit different amounts for different boost types", async function () {
      // SPEED_START = 10 WUXIA
      await expect(itemStore.connect(user).buyBoost(0))
        .to.emit(itemStore, "BoostPurchased")
        .withArgs(user.address, 0, ethers.parseEther("10"));

      // VISION_PLUS = 15 WUXIA
      await expect(itemStore.connect(user).buyBoost(1))
        .to.emit(itemStore, "BoostPurchased")
        .withArgs(user.address, 1, ethers.parseEther("15"));

      // DOUBLE_XP = 25 WUXIA
      await expect(itemStore.connect(user).buyBoost(3))
        .to.emit(itemStore, "BoostPurchased")
        .withArgs(user.address, 3, ethers.parseEther("25"));
    });
  });
});
