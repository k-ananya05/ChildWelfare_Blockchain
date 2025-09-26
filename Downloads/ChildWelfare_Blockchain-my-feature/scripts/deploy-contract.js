const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ChildWelfare = await ethers.getContractFactory("ChildWelfare");
  const childWelfare = await ChildWelfare.deploy();
  await childWelfare.deployed();

  console.log("ChildWelfare contract deployed to:", childWelfare.address);
  
  // Grant roles to some test addresses
  const testAddresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
    "0x90F79bf6EB2c4f870365E785982E1f101E9b2e96", // Account 3
    "0x15d34AAf54267DB7D7c3b8392e9db5Da0c80Da3B"  // Account 4
  ];

  const roles = ["NGO", "Government", "Hospital", "Auditor"];
  
  for (let i = 0; i < testAddresses.length; i++) {
    await childWelfare.grantRole(testAddresses[i], roles[i]);
    console.log(`Granted ${roles[i]} role to ${testAddresses[i]}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
