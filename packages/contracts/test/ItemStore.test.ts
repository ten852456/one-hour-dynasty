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
        .withArgs(buyer.address, 0, ethers.parseEther("10"));

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
      await itemStore.connect(buyer).buySubscription(0); // BRONZE

      const expiry = await itemStore.subscriptionExpiry(buyer.address);
      expect(expiry).to.be.gt(0);
    });

    it("Should set correct subscription expiry", async function () {
      const block = await ethers.provider.getBlock("latest");
      const expectedExpiry = block!.timestamp + 30 * 24 * 60 * 60;

      await itemStore.connect(buyer).buySubscription(0); // BRONZE

      const expiry = await itemStore.subscriptionExpiry(buyer.address);
      expect(expiry).to.be.closeTo(expectedExpiry, 60); // Allow 60s variance
    });

    it("Should correctly identify active subscription", async function () {
      await itemStore.connect(buyer).buySubscription(0); // BRONZE

      expect(await itemStore.hasActiveSubscription(buyer.address)).to.be.true;
    });

    it("Should extend subscription when buying while active", async function () {
      await itemStore.connect(buyer).buySubscription(0); // BRONZE
      const firstExpiry = await itemStore.subscriptionExpiry(buyer.address);

      // Fast forward 15 days
      await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await itemStore.connect(buyer).buySubscription(0); // Buy again
      const secondExpiry = await itemStore.subscriptionExpiry(buyer.address);

      // Should extend from first expiry, not from now
      const expectedExtension = firstExpiry + BigInt(30 * 24 * 60 * 60);
      expect(secondExpiry).to.be.closeTo(expectedExtension, 60n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set new treasury", async function () {
      const newTreasury = owner.address;
      await expect(itemStore.connect(owner).setTreasury(newTreasury))
        .to.emit(itemStore, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury);

      expect(await itemStore.treasury()).to.equal(newTreasury);
    });

    it("Should allow owner to update boost prices", async function () {
      const newPrice = ethers.parseEther("12");
      await expect(itemStore.connect(owner).setBoostPrice(0, newPrice))
        .to.emit(itemStore, "PriceUpdated")
        .withArgs(0, ethers.parseEther("10"), newPrice);

      expect(await itemStore.boostPrices(0)).to.equal(newPrice);
    });

    it("Should not allow non-owner to set treasury", async function () {
      await expect(
        itemStore.connect(buyer).setTreasury(buyer.address)
      ).to.be.revertedWithCustomError(itemStore, "OwnableUnauthorizedAccount");
    });
  });
});
