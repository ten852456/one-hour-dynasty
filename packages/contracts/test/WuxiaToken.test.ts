import { expect } from "chai";
import { ethers } from "hardhat";
import { WuxiaToken } from "../typechain-types";

describe("WuxiaToken", function () {
  let wuxiaToken: WuxiaToken;
  let owner: any;
  let user1: any;
  let user2: any;

  const TOTAL_SUPPLY = 100_000_000n * 10n ** 18n;
  const MINT_AMOUNT = 1000n * 10n ** 18n;
  const BURN_AMOUNT = 500n * 10n ** 18n;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const WuxiaTokenFactory = await ethers.getContractFactory("WuxiaToken");
    wuxiaToken = await WuxiaTokenFactory.deploy(owner.address);
    await wuxiaToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Test 1: Should have correct name and symbol", async function () {
      expect(await wuxiaToken.name()).to.equal("WUXIA");
      expect(await wuxiaToken.symbol()).to.equal("WUXIA");
    });

    it("Test 2: Should mint 100M tokens to owner on deployment", async function () {
      const totalSupply = await wuxiaToken.totalSupply();
      const ownerBalance = await wuxiaToken.balanceOf(owner.address);

      expect(totalSupply).to.equal(TOTAL_SUPPLY);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY);
      expect(totalSupply).to.equal(ownerBalance);
    });
  });

  describe("Burn Functionality", function () {
    it("Test 3: Should burn tokens and reduce total supply", async function () {
      await wuxiaToken.transfer(user1.address, MINT_AMOUNT);

      const initialTotalSupply = await wuxiaToken.totalSupply();
      const initialUserBalance = await wuxiaToken.balanceOf(user1.address);

      await wuxiaToken.connect(user1).burn(BURN_AMOUNT);

      const finalTotalSupply = await wuxiaToken.totalSupply();
      const finalUserBalance = await wuxiaToken.balanceOf(user1.address);

      expect(finalTotalSupply).to.equal(initialTotalSupply - BURN_AMOUNT);
      expect(finalUserBalance).to.equal(initialUserBalance - BURN_AMOUNT);
    });
  });

  describe("Mint Functionality", function () {
    it("Test 4: Should allow owner to mint additional tokens", async function () {
      const initialTotalSupply = await wuxiaToken.totalSupply();
      const initialUserBalance = await wuxiaToken.balanceOf(user1.address);

      await wuxiaToken.mint(user1.address, MINT_AMOUNT);

      const finalTotalSupply = await wuxiaToken.totalSupply();
      const finalUserBalance = await wuxiaToken.balanceOf(user1.address);

      expect(finalTotalSupply).to.equal(initialTotalSupply + MINT_AMOUNT);
      expect(finalUserBalance).to.equal(initialUserBalance + MINT_AMOUNT);
    });

    it("Test 5: Should revert when non-owner tries to mint", async function () {
      await expect(
        wuxiaToken.connect(user1).mint(user2.address, MINT_AMOUNT),
      ).to.be.revertedWithCustomError(wuxiaToken, "OwnableUnauthorizedAccount");
    });

    it("Should reject minting to zero address", async function () {
      await expect(
        wuxiaToken.mint(ethers.ZeroAddress, MINT_AMOUNT),
      ).to.be.revertedWithCustomError(wuxiaToken, "InvalidOwner");
    });
  });
});
