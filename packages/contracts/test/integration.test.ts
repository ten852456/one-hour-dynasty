import { expect } from "chai";
import { ethers } from "hardhat";
import { WuxiaToken, ItemStore, Staking, GameResultsRecorder, MockERC8004Reputation } from "../typechain-types";

describe("Integration: Full Game Flow", function () {
  let wuxia: WuxiaToken;
  let itemStore: ItemStore;
  let staking: Staking;
  let recorder: GameResultsRecorder;
  let mockReputation: MockERC8004Reputation;

  let owner: any;
  let treasury: any;
  let agent1: any;
  let agent2: any;
  let agent3: any;

  beforeEach(async function () {
    [owner, treasury, agent1, agent2, agent3] = await ethers.getSigners();

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

    await wuxia.connect(owner).transfer(agent1.address, ethers.parseEther("50000"));
    await wuxia.connect(owner).transfer(agent2.address, ethers.parseEther("50000"));
    await wuxia.connect(owner).transfer(agent3.address, ethers.parseEther("50000"));

    await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("1000"));

    await wuxia.connect(agent1).approve(await itemStore.getAddress(), ethers.MaxUint256);
    await wuxia.connect(agent2).approve(await itemStore.getAddress(), ethers.MaxUint256);
    await wuxia.connect(agent1).approve(await staking.getAddress(), ethers.MaxUint256);
    await wuxia.connect(agent2).approve(await staking.getAddress(), ethers.MaxUint256);
  });

  it("Should complete full game flow: boost → stake → play → prize → reputation", async function () {
    const balanceBefore = await wuxia.balanceOf(agent1.address);

    await itemStore.connect(agent1).buyBoost(0);
    expect(await wuxia.balanceOf(agent1.address)).to.be.closeTo(
      ethers.parseEther("49990"),
      ethers.parseEther("1")
    );

    await staking.connect(agent2).stake(ethers.parseEther("1000"), 0);
    expect(await staking.hasPriorityQueue(agent2.address)).to.be.true;

    const gameId = 1;
    const agents = [agent1.address, agent2.address, agent3.address];
    const ranks = [1, 2, 3];
    const scores = [1000, 800, 600];

    await recorder.recordGameResult(gameId, agents, ranks, scores);
    expect(await recorder.getAgentRank(gameId, agent1.address)).to.equal(1);

    const winners = [agent1.address, agent2.address];
    const amounts = [ethers.parseEther("400"), ethers.parseEther("250")];

    await recorder.distributePrize(gameId, winners, amounts);
    expect(await wuxia.balanceOf(agent1.address)).to.be.closeTo(
      ethers.parseEther("50390"),
      ethers.parseEther("1")
    );

    await recorder.submitERC8004Feedback(gameId, agent1.address, 123, "ipfs://Qm...");

    const lastCall = await mockReputation.getLastSubmission();
    expect(lastCall.score).to.equal(100);
  });

  it("Should handle subscription flow", async function () {
    await itemStore.connect(agent1).buySubscription(2);

    expect(await itemStore.hasActiveSubscription(agent1.address)).to.be.true;

    expect(await wuxia.balanceOf(treasury.address)).to.equal(ethers.parseEther("500"));
  });

  it("Should handle staking with lock period", async function () {
    await staking.connect(agent1).stake(ethers.parseEther("5000"), 30 * 24 * 60 * 60);

    expect(await staking.canAccessGrandWar(agent1.address)).to.be.true;

    await expect(staking.connect(agent1).unstake()).to.be.revertedWithCustomError(staking, "LockPeriodNotExpired");
  });
});
