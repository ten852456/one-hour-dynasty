import { expect } from "chai";
import { ethers } from "hardhat";
import { Staking, WuxiaToken } from "../typechain-types";

describe("Staking", function () {
  let staking: Staking;
  let wuxia: WuxiaToken;
  let owner: any;
  let staker: any;

  beforeEach(async function () {
    [owner, staker] = await ethers.getSigners();

    const WuxiaFactory = await ethers.getContractFactory("WuxiaToken");
    wuxia = await WuxiaFactory.deploy(owner.address);
    await wuxia.waitForDeployment();

    await wuxia
      .connect(owner)
      .transfer(staker.address, ethers.parseEther("50000"));

    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await StakingFactory.deploy(await wuxia.getAddress());
    await staking.waitForDeployment();

    await wuxia
      .connect(staker)
      .approve(await staking.getAddress(), ethers.MaxUint256);
  });

  describe("Staking", function () {
    it("Should allow staking tokens", async function () {
      await staking.connect(staker).stake(ethers.parseEther("1000"), 0);

      const stake = await staking.getStake(staker.address);
      expect(await ethers.formatEther(stake.amount)).to.equal("1000.0");
    });

    it("Should emit Staked event", async function () {
      await expect(
        staking
          .connect(staker)
          .stake(ethers.parseEther("5000"), 30 * 24 * 60 * 60),
      )
        .to.emit(staking, "Staked")
        .withArgs(staker.address, ethers.parseEther("5000"), 30 * 24 * 60 * 60);
    });

    it("Should not allow double staking", async function () {
      await staking.connect(staker).stake(ethers.parseEther("1000"), 0);

      await expect(
        staking.connect(staker).stake(ethers.parseEther("1000"), 0),
      ).to.be.revertedWithCustomError(staking, "AlreadyStaked");
    });

    it("Should correctly identify priority queue access", async function () {
      await staking.connect(staker).stake(ethers.parseEther("1000"), 0);
      expect(await staking.hasPriorityQueue(staker.address)).to.be.true;
    });

    it("Should correctly identify Grand War access", async function () {
      await staking.connect(staker).stake(ethers.parseEther("5000"), 0);
      expect(await staking.canAccessGrandWar(staker.address)).to.be.true;
    });

    it("Should correctly identify governance rights", async function () {
      await staking.connect(staker).stake(ethers.parseEther("10000"), 0);
      expect(await staking.hasGovernanceRights(staker.address)).to.be.true;
    });
  });

  describe("Unstaking", function () {
    it("Should allow unstaking without lock", async function () {
      await staking.connect(staker).stake(ethers.parseEther("1000"), 0);
      await staking.connect(staker).unstake();

      const stake = await staking.getStake(staker.address);
      expect(await ethers.formatEther(stake.amount)).to.equal("0.0");
    });

    it("Should transfer tokens back on unstake", async function () {
      const balanceBefore = await wuxia.balanceOf(staker.address);

      await staking.connect(staker).stake(ethers.parseEther("1000"), 0);
      await staking.connect(staker).unstake();

      const balanceAfter = await wuxia.balanceOf(staker.address);
      expect(balanceAfter).to.equal(balanceBefore);
    });

    it("Should not allow unstaking before lock period expires", async function () {
      await staking
        .connect(staker)
        .stake(ethers.parseEther("1000"), 30 * 24 * 60 * 60);

      await expect(
        staking.connect(staker).unstake(),
      ).to.be.revertedWithCustomError(staking, "LockPeriodNotExpired");
    });

    it("Should allow unstaking after lock period expires", async function () {
      await staking.connect(staker).stake(ethers.parseEther("1000"), 5);

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine");

      await staking.connect(staker).unstake();
      const stake = await staking.getStake(staker.address);

      expect(await ethers.formatEther(stake.amount)).to.equal("0.0");
    });
  });
});
