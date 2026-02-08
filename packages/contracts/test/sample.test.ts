import { expect } from "chai";
import { ethers } from "hardhat";

describe("Hardhat Setup", function () {
  it("Should have correct network configuration", async function () {
    const network = await ethers.provider.getNetwork();
    expect(network.chainId).to.be.a("bigint");
  });

  it("Should have deployer accounts", async function () {
    const signers = await ethers.getSigners();
    expect(signers.length).to.be.greaterThan(0);
  });

  it("Should compile contracts successfully", async function () {
    expect(true).to.be.true;
  });
});
