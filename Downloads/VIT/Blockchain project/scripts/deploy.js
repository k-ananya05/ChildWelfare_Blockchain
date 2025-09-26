// This ensures Hardhat runtime environment is available
const hre = require("hardhat");

async function main() {
  // ✅ use hre.ethers, not ethers
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const ChildRecord = await hre.ethers.getContractFactory("ChildRecord");
  const childRecord = await ChildRecord.deploy();

  await childRecord.deployed();

  console.log("ChildRecord deployed to:", childRecord.address);
}

// Run main and catch errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
