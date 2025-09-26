const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", balance.toString());

  const ChildWelfare = await hre.ethers.getContractFactory("ChildWelfare");
  const contract = await ChildWelfare.deploy();

  await contract.deployed();

  console.log("ChildWelfare deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
