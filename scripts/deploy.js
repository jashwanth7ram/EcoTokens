// Hardhat deployment script for CarbonCreditLifecycle (ESM format for Hardhat v3)
// Run: npm run deploy:sepolia  (add SEPOLIA_RPC_URL and PRIVATE_KEY to .env first)

import hre from "hardhat";

async function main() {
  console.log("Deploying CarbonCreditLifecycle to:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const CarbonCredit = await hre.ethers.getContractFactory("CarbonCreditLifecycle");
  const contract = await CarbonCredit.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("\n✅ CarbonCreditLifecycle deployed to:", addr);
  console.log("📋 Paste this address into the dashboard 'Load Contract' field.");
  console.log("  Network:", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
