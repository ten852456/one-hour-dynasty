import { expect } from "chai";
import { ethers } from "hardhat";
import { ItemStore, WuxiaToken } from "../typechain-types";

/**
 * Test suite for ItemStore contract
 * Tests include subscription tier tracking (security fix for localStorage vulnerability)
 */
describe("ItemStore", function () {
  let itemStore: ItemStore;
  let wuxia: WuxiaToken;
  let owner: any;
  let treasury: any;
  let buyer: any;
  let otherUser: any;

  beforeEach(async function () {
    [owner, treasury, buyer, otherUser] = await ethers.getSigners();

    const WuxiaFactory = await ethers.getContractFactory("WuxiaToken");
    wuxia = await WuxiaFactory.deploy(owner.address);
    await wuxia.waitForDeployment();

    await wuxia.connect(owner).transfer(buyer.address, ethers.parseEther("10000"));
    await wuxia.connect(owner).transfer(otherUser.address, ethers.parseEther("10000"));

    const ItemStoreFactory = await ethers.getContractFactory("ItemStore");
    itemStore = await ItemStoreFactory.deploy(await wuxia.getAddress(), treasury.address);
    await itemStore.waitForDeployment();

    await wuxia.connect(buyer).approve(await itemStore.getAddress(), ethers.MaxUint256);
    await wuxia.connect(otherUser).approve(await itemStore.getAddress(), ethers.MaxUint256);
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

  describe("SECURITY: On-Chain Tier Tracking", function () {
    /**
     * Security Test: Verify that subscription tiers are stored on-chain
     * This prevents the localStorage vulnerability where users could manipulate
     * their tier to access premium features without paying.
     */

    it("Should store user's tier on-chain when subscription is purchased", async function () {
      // Buy SILVER subscription
      await itemStore.connect(buyer).buySubscription(1); // SILVER

      // Verify tier is stored on-chain
      const userTier = await itemStore.userTier(buyer.address);
      expect(userTier).to.equal(1); // SILVER = 1
    });

    it("Should return correct tier from getUserTier() for active subscription", async function () {
      // Buy GOLD subscription
      await itemStore.connect(buyer).buySubscription(2); // GOLD

      const tier = await itemStore.getUserTier(buyer.address);
      expect(tier).to.equal(2); // GOLD = 2
    });

    it("Should return BRONZE (0) for expired subscriptions", async function () {
      // Buy SILVER subscription
      await itemStore.connect(buyer).buySubscription(1); // SILVER
      expect(await itemStore.getUserTier(buyer.address)).to.equal(1);

      // Fast forward 31 days (past expiry)
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Should return BRONZE (default) for expired subscriptions
      const tier = await itemStore.getUserTier(buyer.address);
      expect(tier).to.equal(0); // BRONZE = 0
    });

    it("Should return BRONZE (0) for users with no subscription", async function () {
      // otherUser has never purchased a subscription
      const tier = await itemStore.getUserTier(otherUser.address);
      expect(tier).to.equal(0); // BRONZE = 0
    });

    it("Should update tier when user upgrades subscription", async function () {
      // Start with BRONZE
      await itemStore.connect(buyer).buySubscription(0); // BRONZE
      expect(await itemStore.userTier(buyer.address)).to.equal(0);

      // Upgrade to GOLD
      await expect(itemStore.connect(buyer).buySubscription(2)) // GOLD
        .to.emit(itemStore, "UserTierUpdated")
        .withArgs(buyer.address, 0, 2); // BRONZE -> GOLD

      expect(await itemStore.userTier(buyer.address)).to.equal(2);
    });

    it("Should update tier when user downgrades subscription", async function () {
      // Start with GOLD
      await itemStore.connect(buyer).buySubscription(2); // GOLD
      expect(await itemStore.userTier(buyer.address)).to.equal(2);

      // Downgrade to BRONZE (while subscription is still active)
      await expect(itemStore.connect(buyer).buySubscription(0)) // BRONZE
        .to.emit(itemStore, "UserTierUpdated")
        .withArgs(buyer.address, 2, 0); // GOLD -> BRONZE

      expect(await itemStore.userTier(buyer.address)).to.equal(0);
    });

    it("Should NOT emit UserTierUpdated when renewing same tier", async function () {
      // Buy SILVER subscription
      await itemStore.connect(buyer).buySubscription(1); // SILVER

      // Renew same tier (should not emit UserTierUpdated)
      const tx = await itemStore.connect(buyer).buySubscription(1); // SILVER again
      const receipt = await tx.wait();

      // Check that UserTierUpdated was NOT emitted (oldTier == newTier)
      const tierUpdateEvent = receipt?.logs.find((log: any) => {
        try {
          return itemStore.interface.parseLog(log).name === "UserTierUpdated";
        } catch {
          return false;
        }
      });

      expect(tierUpdateEvent).to.be.undefined;
    });

    it("Should preserve tier when extending subscription before expiry", async function () {
      // Buy GOLD subscription
      await itemStore.connect(buyer).buySubscription(2); // GOLD
      const firstExpiry = await itemStore.subscriptionExpiry(buyer.address);

      // Fast forward 15 days
      await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Extend GOLD subscription
      await itemStore.connect(buyer).buySubscription(2); // GOLD again

      // Tier should still be GOLD
      expect(await itemStore.userTier(buyer.address)).to.equal(2);

      // Expiry should be extended from first expiry
      const secondExpiry = await itemStore.subscriptionExpiry(buyer.address);
      const expectedExtension = firstExpiry + BigInt(30 * 24 * 60 * 60);
      expect(secondExpiry).to.be.closeTo(expectedExtension, 60n);
    });

    it("Should correctly track different tiers for different users", async function () {
      // User 1 buys BRONZE
      await itemStore.connect(buyer).buySubscription(0);
      expect(await itemStore.getUserTier(buyer.address)).to.equal(0);

      // User 2 buys GOLD
      await itemStore.connect(otherUser).buySubscription(2);
      expect(await itemStore.getUserTier(otherUser.address)).to.equal(2);

      // Verify independence of tiers
      expect(await itemStore.getUserTier(buyer.address)).to.equal(0);
      expect(await itemStore.getUserTier(otherUser.address)).to.equal(2);
    });
  });

  describe("getSubscriptionInfo()", function () {
    it("Should return complete subscription info for active subscription", async function () {
      await itemStore.connect(buyer).buySubscription(1); // SILVER

      const info = await itemStore.getSubscriptionInfo(buyer.address);

      expect(info.tier).to.equal(1); // SILVER
      expect(info.expiry).to.be.gt(0);
      expect(info.isActive).to.be.true;
    });

    it("Should return BRONZE tier for expired subscription", async function () {
      await itemStore.connect(buyer).buySubscription(2); // GOLD

      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const info = await itemStore.getSubscriptionInfo(buyer.address);

      expect(info.tier).to.equal(0); // BRONZE (default)
      expect(info.isActive).to.be.false;
    });

    it("Should return BRONZE tier for non-subscribed user", async function () {
      const info = await itemStore.getSubscriptionInfo(otherUser.address);

      expect(info.tier).to.equal(0); // BRONZE (default)
      expect(info.isActive).to.be.false;
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
