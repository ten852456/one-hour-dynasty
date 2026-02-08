import { expect } from "chai";
import { ethers } from "hardhat";
import { GameResultsRecorder, WuxiaToken, MockERC8004Reputation } from "../typechain-types";

describe("GameResultsRecorder", function () {
  let recorder: GameResultsRecorder;
  let wuxia: WuxiaToken;
  let mockReputation: MockERC8004Reputation;

  let owner: any;
  let agent1: any;
  let agent2: any;
  let agent3: any;

  beforeEach(async function () {
    [owner, agent1, agent2, agent3] = await ethers.getSigners();

    const WuxiaFactory = await ethers.getContractFactory("WuxiaToken");
    wuxia = await WuxiaFactory.deploy(owner.address);
    await wuxia.waitForDeployment();

    const MockReputationFactory = await ethers.getContractFactory("MockERC8004Reputation");
    mockReputation = await MockReputationFactory.deploy();
    await mockReputation.waitForDeployment();

    const RecorderFactory = await ethers.getContractFactory("GameResultsRecorder");
    recorder = await RecorderFactory.deploy(
      await wuxia.getAddress(),
      await mockReputation.getAddress()
    );
    await recorder.waitForDeployment();

    await wuxia.connect(owner).transfer(await recorder.getAddress(), ethers.parseEther("1000"));
  });

  describe("Game Results Recording", function () {
    const gameId = 1;

    it("Should record game results", async function () {
      const agents = [agent1.address, agent2.address, agent3.address];
      const ranks = [1, 2, 3];
      const scores = [1000, 800, 600];

      await expect(recorder.recordGameResult(gameId, agents, ranks, scores))
        .to.emit(recorder, "GameRecorded")
        .withArgs(gameId, 3);
    });

    it("Should store correct ranks", async function () {
      const agents = [agent1.address, agent2.address, agent3.address];
      const ranks = [1, 2, 3];
      const scores = [1000, 800, 600];

      await recorder.recordGameResult(gameId, agents, ranks, scores);

      expect(await recorder.getAgentRank(gameId, agent1.address)).to.equal(1);
      expect(await recorder.getAgentRank(gameId, agent2.address)).to.equal(2);
      expect(await recorder.getAgentRank(gameId, agent3.address)).to.equal(3);
    });

    it("Should not allow recording same game twice", async function () {
      const agents = [agent1.address, agent2.address];
      const ranks = [1, 2];
      const scores = [1000, 800];

      await recorder.recordGameResult(gameId, agents, ranks, scores);

      await expect(
        recorder.recordGameResult(gameId, agents, ranks, scores)
      ).to.be.revertedWithCustomError(recorder, "GameAlreadyRecorded");
    });
  });

  describe("Prize Distribution", function () {
    const gameId = 1;

    beforeEach(async function () {
      const agents = [agent1.address, agent2.address, agent3.address];
      const ranks = [1, 2, 3];
      const scores = [1000, 800, 600];

      await recorder.recordGameResult(gameId, agents, ranks, scores);
    });

    it("Should distribute prizes to winners", async function () {
      const winners = [agent1.address, agent2.address];
      const amounts = [ethers.parseEther("400"), ethers.parseEther("250")];

      await expect(recorder.distributePrize(gameId, winners, amounts))
        .to.emit(recorder, "PrizeDistributed")
        .withArgs(gameId, agent1.address, ethers.parseEther("400"));

      const balance1 = await wuxia.balanceOf(agent1.address);
      const balance2 = await wuxia.balanceOf(agent2.address);

      expect(await ethers.formatEther(balance1)).to.equal("400.0");
      expect(await ethers.formatEther(balance2)).to.equal("250.0");
    });
  });

  describe("ERC-8004 Reputation Integration", function () {
    const gameId = 1;

    beforeEach(async function () {
      const agents = [agent1.address, agent2.address, agent3.address];
      const ranks = [1, 2, 15];
      const scores = [1000, 800, 600];

      await recorder.recordGameResult(gameId, agents, ranks, scores);
    });

    it("Should submit reputation feedback for 1st place", async function () {
      await expect(recorder.submitERC8004Feedback(gameId, agent1.address, 123, "ipfs://..."))
        .to.emit(recorder, "ReputationSubmitted")
        .withArgs(agent1.address, 123, 100);
    });

    it("Should calculate correct reputation score for top 3", async function () {
      await recorder.submitERC8004Feedback(gameId, agent2.address, 124, "ipfs://...");

      const lastCall = await mockReputation.getLastSubmission();
      expect(lastCall.score).to.equal(85);
    });

    it("Should calculate correct reputation score for rank 15", async function () {
      await recorder.submitERC8004Feedback(gameId, agent3.address, 125, "ipfs://...");

      const lastCall = await mockReputation.getLastSubmission();
      expect(lastCall.score).to.equal(50);
    });
  });
});
