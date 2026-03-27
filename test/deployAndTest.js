const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonCreditLifecycle", function () {
  let CarbonCredit, carbonCredit;
  let owner, originator, auditor, buyer;

  before(async function () {
    [owner, originator, auditor, buyer] = await ethers.getSigners();
    
    CarbonCredit = await ethers.getContractFactory("CarbonCreditLifecycle");
    carbonCredit = await CarbonCredit.deploy();
  });

  it("Should set the right roles", async function () {
    await carbonCredit.grantOriginatorRole(originator.address);
    await carbonCredit.grantAuditorRole(auditor.address);
    
    const ORIGINATOR_ROLE = await carbonCredit.ORIGINATOR_ROLE();
    expect(await carbonCredit.hasRole(ORIGINATOR_ROLE, originator.address)).to.be.true;
  });

  it("Should allow originator to submit project and auditor to approve it", async function () {
    // Submit project
    await carbonCredit.connect(originator).submitProject("Project 1", 100);
    let pending = await carbonCredit.getPendingProjects();
    expect(pending.length).to.equal(1);
    
    // Approve project
    const projectId = pending[0];
    await carbonCredit.connect(auditor).approveProject(projectId);
    
    pending = await carbonCredit.getPendingProjects();
    expect(pending.length).to.equal(0);
    
    // Originator should receive 100 * 10^18 tokens
    const balance = await carbonCredit.balanceOf(originator.address);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Should allow marketplace listing and buying", async function () {
    const listAmount = 50;
    const priceInWei = ethers.parseEther("1.5");
    
    const tokenContractAddress = await carbonCredit.getAddress();

    // Approve contract to spend tokens
    await carbonCredit.connect(originator).approve(tokenContractAddress, ethers.parseUnits(listAmount.toString(), 18));
    
    // List tokens
    await carbonCredit.connect(originator).listTokens(listAmount, priceInWei);
    
    let active = await carbonCredit.getActiveListings();
    expect(active.length).to.equal(1);
    
    const listingId = active[0];
    
    // Buy tokens
    await carbonCredit.connect(buyer).buyTokens(listingId, { value: priceInWei });
    
    // Check balance
    const buyerBalance = await carbonCredit.balanceOf(buyer.address);
    expect(buyerBalance).to.equal(ethers.parseUnits(listAmount.toString(), 18));
    
    active = await carbonCredit.getActiveListings();
    expect(active.length).to.equal(0);
  });
});
