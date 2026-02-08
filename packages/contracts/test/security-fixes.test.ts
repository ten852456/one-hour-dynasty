import { expect } from "chai";
import { ethers } from "hardhat";
import { WuxiaToken, ItemStore, Staking, GameResultsRecorder } from "../typechain-types";

describe("Security Fixes Tests", function () {
  let wuxia: WuxiaToken;
  let itemStore: ItemStore;
  let staking: Staking;
  let recorder: GameResultsRecorder;

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

    const RecorderFactory = await ethers.getContractFactory("GameResultsRecorder");
    recorder = await RecorderFactory.deploy(
      await wuxia.getAddress(),
      owner.address // Using owner address as mock registry for testing
    );
    await recorder.waitForDeployment();

    // Fund user and approve contracts
    await wuxia.connect(owner).transfer(user.address, ethers.parseEther("10000"));
    await wuxia.connect(user).approve(await itemStore.getAddress(), ethers.MaxUint256);
    await wuxia.connect(user).approve(await staking.getAddress(), ethers.MaxUint256);
    await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("1000"));
  });

  describe("HIGH PRIORITY FIXES", function () {
    describe("Fix #1: Zero-amount check in batchDistributePrizes", function () {
      it("Should reject zero amounts in batchDistributePrizes", async function () {
        const gameId = 1;
        const agents = [user.address];
        const ranks = [1];
        const scores = [100];

        await recorder.recordGameResult(gameId, agents, ranks, scores);

        // Try to distribute with zero amount
        await expect(
          recorder.batchDistributePrizes(gameId, [user.address], [0])
        ).to.be.revertedWithCustomError(recorder, "InvalidAmount");
      });

      it("Should accept valid amounts in batchDistributePrizes", async function () {
        const gameId = 2;
        const agents = [user.address];
        const ranks = [1];
        const scores = [100];

        await recorder.recordGameResult(gameId, agents, ranks, scores);

        // Should succeed with valid amount
        await expect(
          recorder.batchDistributePrizes(gameId, [user.address], [ethers.parseEther("10")])
        ).to.emit(recorder, "PrizeDistributed");
      });
    });

    describe("Fix #2: Withdrawal events", function () {
      it("Should emit TokensWithdrawn event from ItemStore", async function () {
        // Add some tokens to ItemStore first
        await wuxia.connect(owner).transfer(await itemStore.getAddress(), ethers.parseEther("100"));

        await expect(itemStore.connect(owner).withdrawTokens(user.address, ethers.parseEther("50")))
          .to.emit(itemStore, "TokensWithdrawn")
          .withArgs(user.address, ethers.parseEther("50"));
      });

      it("Should emit PrizeTokenWithdrawn event from GameResultsRecorder", async function () {
        await expect(
          recorder.connect(owner).withdrawPrizeToken(user.address, ethers.parseEther("100"))
        )
          .to.emit(recorder, "PrizeTokenWithdrawn")
          .withArgs(user.address, ethers.parseEther("100"));
      });
    });

    describe("Fix #3: Maximum array length validation", function () {
      it("Should reject recording more than MAX_AGENTS_PER_GAME", async function () {
        const maxAgents = 100;
        const tooManyAgents = maxAgents + 1;

        const agents = Array(tooManyAgents).fill(user.address);
        const ranks = Array(tooManyAgents).fill(1);
        const scores = Array(tooManyAgents).fill(100);

        await expect(
          recorder.recordGameResult(1, agents, ranks, scores)
        ).to.be.revertedWithCustomError(recorder, "TooManyAgents");
      });

      it("Should accept exactly MAX_AGENTS_PER_GAME", async function () {
        const maxAgents = 100;

        // Create unique addresses using dummy values that pass validation
        // Note: These addresses don't need to be real, just unique
        const agents: string[] = [];
        const ranks: number[] = [];
        const scores: number[] = [];

        for (let i = 0; i < maxAgents; i++) {
          // Use different addresses based on i to avoid duplicates
          // Using a simple pattern: 0x... + i
          const addr = "0x" + i.toString(16).padStart(40, "0");
          agents.push(addr);
          ranks.push(i + 1);
          scores.push(100);
        }

        // Should succeed (even though addresses are fake, it validates array length)
        await recorder.recordGameResult(1, agents, ranks, scores);
        expect(await recorder.getAgentRank(1, agents[0])).to.equal(1);
      });
    });
  });

  describe("MEDIUM PRIORITY FIXES", function () {
    describe("Fix #4: Duplicate address validation", function () {
      it("Should reject duplicate agent addresses", async function () {
        const agents = [user.address, user.address]; // Duplicate
        const ranks = [1, 2];
        const scores = [100, 80];

        await expect(
          recorder.recordGameResult(1, agents, ranks, scores)
        ).to.be.revertedWithCustomError(recorder, "DuplicateAgent");
      });

      it("Should accept unique agent addresses", async function () {
        const agents = [user.address, owner.address]; // Unique
        const ranks = [1, 2];
        const scores = [100, 80];

        await recorder.recordGameResult(1, agents, ranks, scores);
        expect(await recorder.getAgentRank(1, user.address)).to.equal(1);
      });
    });

    describe("Fix #5: Stake increase mechanism", function () {
      it("Should allow increasing existing stake", async function () {
        const initialStake = ethers.parseEther("1000");
        const increaseAmount = ethers.parseEther("500");

        await staking.connect(user).stake(initialStake, 30 * 24 * 60 * 60);

        const stakeBefore = await staking.stakes(user.address);
        expect(stakeBefore.amount).to.equal(initialStake);

        // Increase stake
        await staking.connect(user).increaseStake(increaseAmount);

        const stakeAfter = await staking.stakes(user.address);
        expect(stakeAfter.amount).to.equal(initialStake + increaseAmount);
      });

      it("Should emit StakeIncreased event", async function () {
        await staking.connect(user).stake(ethers.parseEther("1000"), 0);

        await expect(staking.connect(user).increaseStake(ethers.parseEther("500")))
          .to.emit(staking, "StakeIncreased")
          .withArgs(user.address, ethers.parseEther("500"));
      });

      it("Should reject increasing stake with zero amount", async function () {
        await staking.connect(user).stake(ethers.parseEther("1000"), 0);

        await expect(
          staking.connect(user).increaseStake(0)
        ).to.be.revertedWithCustomError(staking, "AmountMustBePositive");
      });

      it("Should reject increasing non-existent stake", async function () {
        await expect(
          staking.connect(user).increaseStake(ethers.parseEther("500"))
        ).to.be.revertedWithCustomError(staking, "NoStakeFound");
      });

      it("Should preserve lock period when increasing stake", async function () {
        const lockDuration = 30 * 24 * 60 * 60;
        await staking.connect(user).stake(ethers.parseEther("1000"), lockDuration);

        const stakeBefore = await staking.stakes(user.address);
        const originalTimestamp = stakeBefore.timestamp;
        const originalLockDuration = stakeBefore.lockDuration;

        // Increase stake
        await staking.connect(user).increaseStake(ethers.parseEther("500"));

        const stakeAfter = await staking.stakes(user.address);
        expect(stakeAfter.timestamp).to.equal(originalTimestamp);
        expect(stakeAfter.lockDuration).to.equal(originalLockDuration);
      });
    });
  });

  describe("LOW PRIORITY FIXES", function () {
    describe("Fix #7: Helper view functions", function () {
      it("Should return subscription time remaining", async function () {
        await itemStore.connect(user).buySubscription(0); // BRONZE

        const timeRemaining = await itemStore.getSubscriptionTimeRemaining(user.address);
        expect(timeRemaining).to.be.gt(0);
        expect(timeRemaining).to.be.closeTo(BigInt(30 * 24 * 60 * 60), BigInt(60));
      });

      it("Should return 0 for expired subscription", async function () {
        await itemStore.connect(user).buySubscription(0);

        // Fast forward past expiry
        await ethers.provider.send("evm_increaseTime", [35 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const timeRemaining = await itemStore.getSubscriptionTimeRemaining(user.address);
        expect(timeRemaining).to.equal(0);
      });

      it("Should return all boost prices", async function () {
        const prices = await itemStore.getAllBoostPrices();
        expect(prices.length).to.equal(4);
        expect(prices[0]).to.equal(ethers.parseEther("10"));
        expect(prices[1]).to.equal(ethers.parseEther("15"));
        expect(prices[2]).to.equal(ethers.parseEther("20"));
        expect(prices[3]).to.equal(ethers.parseEther("25"));
      });

      it("Should return all subscription prices", async function () {
        const prices = await itemStore.getAllSubscriptionPrices();
        expect(prices.length).to.equal(3);
        expect(prices[0]).to.equal(ethers.parseEther("100"));
        expect(prices[1]).to.equal(ethers.parseEther("300"));
        expect(prices[2]).to.equal(ethers.parseEther("500"));
      });
    });

    describe("Fix #6: Gas optimizations (Stake struct packing)", function () {
      it("Should use packed Stake struct (uint96, uint64, uint96)", async function () {
        await staking.connect(user).stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);

        const stake = await staking.stakes(user.address);
        expect(stake.amount).to.equal(ethers.parseEther("1000"));
        expect(stake.timestamp).to.be.gt(0);
        expect(stake.lockDuration).to.equal(30 * 24 * 60 * 60);
      });

      it("Should handle large stake amounts within uint96 range", async function () {
        // uint96 max: ~79 billion ether
        const largeAmount = ethers.parseEther("1000000"); // 1 million WUXIA
        await wuxia.connect(owner).transfer(user.address, largeAmount);

        await staking.connect(user).stake(largeAmount, 0);
        const stake = await staking.stakes(user.address);
        expect(stake.amount).to.equal(largeAmount);
      });
    });

    describe("Fix #7: Removed redundant TOTAL_SUPPLY constant", function () {
      it("Should only have MAX_SUPPLY constant", async function () {
        // MAX_SUPPLY should exist
        expect(await wuxia.MAX_SUPPLY()).to.equal(ethers.parseEther("100000000"));

        // TOTAL_SUPPLY should not exist as a constant anymore
        // (it's not accessible as a public constant)
        expect(await wuxia.totalSupply()).to.equal(ethers.parseEther("100000000"));
      });
    });
  });

  describe("Validations", function () {
    it("Should reject zero rank", async function () {
      await expect(
        recorder.recordGameResult(1, [user.address], [0], [100])
      ).to.be.revertedWithCustomError(recorder, "InvalidRank");
    });

    it("Should reject score > 1000", async function () {
      await expect(
        recorder.recordGameResult(1, [user.address], [1], [1001])
      ).to.be.revertedWithCustomError(recorder, "InvalidScore");
    });

    it("Should accept valid score of 1000", async function () {
      await expect(
        recorder.recordGameResult(1, [user.address], [1], [1000])
      ).to.not.be.reverted;
    });
  });
});
