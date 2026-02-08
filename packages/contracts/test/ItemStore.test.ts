import { expect } from "chai";
import { ethers } from "hardhat";
import { ItemStore, WuxiaToken } from "../typechain-types";

describe("ItemStore", function () {
  let itemStore: ItemStore;
  let wuxia: WuxiaToken;
  let owner: any;
  let treasury: any;
  let buyer: any;

  beforeEach(async function () {
    [owner, treasury, buyer] = await ethers.getSigners();

    const WuxiaFactory = await ethers.getContractFactory("WuxiaToken");
    wuxia = await WuxiaFactory.deploy(owner.address);
    await wuxia.waitForDeployment();

    await wuxia.connect(owner).transfer(buyer.address, ethers.parseEther("10000"));

    const ItemStoreFactory = await ethers.getContractFactory("ItemStore");
    itemStore = await ItemStoreFactory.deploy(await wuxia.getAddress(), treasury.address);
    await itemStore.waitForDeployment();

    await wuxia.connect(buyer).approve(await itemStore.getAddress(), ethers.MaxUint256);
  });

  describe("Boost Purchases", function () {
    it("Should allow buying SPEED_START boost", async function () {
      await expect(itemStore.connect(buyer).buyBoost(0))
        .to.emit(itemStore, "BoostPurchased")
        .withArgs(buyer.address, 0);

      const balance = await wuxia.balanceOf(buyer.address);
      expect(await ethers.formatEther(balance)).to.equal("9990.0");
    });

    it("Should burn tokens when boost is purchased", async function () {
      const totalSupplyBefore = await wuxia.totalSupply();
      await itemStore.connect(buyer).buyBoost(1); // VISION_PLUS
      const totalSupplyAfter = await wuxia.totalSupply();

      expect(totalSupplyBefore - totalSupplyAfter).to.equal(ethers.parseEther("15"));
    });

    it("Should allow buying DOUBLE_XP boost", async function () {
      await itemStore.connect(buyer).buyBoost(3); // DOUBLE_XP
      const balance = await wuxia.balanceOf(buyer.address);
      expect(await ethers.formatEther(balance)).to.equal("9975.0");
    });
  });

  describe("Subscription Purchases", function () {
    it("Should allow buying BRONZE subscription", async function () {
      await expect(itemStore.connect(buyer).buySubscription(0))
        .to.emit(itemStore, "SubscriptionPurchased");

      const treasuryBalance = await wuxia.balanceOf(treasury.address);
      expect(await ethers.formatEther(treasuryBalance)).to.equal("100.0");
    });

    it("Should set correct subscription expiry", async function () {
      const block = await ethers.provider.getBlock("latest");
      const timestamp = block!.timestamp;

      await itemStore.connect(buyer).buySubscription(1); // SILVER

      const expiry = await itemStore.subscriptionExpiry(buyer.address);
      const expectedExpiry = timestamp + 30 * 24 * 60 * 60;

      expect(expiry).to.be.closeTo(expectedExpiry, 5);
    });

    it("Should correctly identify active subscription", async function () {
      await itemStore.connect(buyer).buySubscription(2); // GOLD
      expect(await itemStore.hasActiveSubscription(buyer.address)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set new treasury", async function () {
      await itemStore.connect(owner).setTreasury(buyer.address);
      expect(await itemStore.treasury()).to.equal(buyer.address);
    });

    it("Should allow owner to update boost prices", async function () {
      await itemStore.connect(owner).setBoostPrice(0, ethers.parseEther("50"));
      expect(await itemStore.boostPrices(0)).to.equal(ethers.parseEther("50"));
    });

    it("Should not allow non-owner to set treasury", async function () {
      await expect(
        itemStore.connect(buyer).setTreasury(buyer.address)
      ).to.be.revertedWithCustomError(itemStore, "OwnableUnauthorizedAccount");
    });
  });
});
