const hre = require("hardhat");

async function main() {
  const ChildWelfare = await hre.ethers.getContractFactory("ChildWelfare");
  const childWelfare = await ChildWelfare.deploy();

  await childWelfare.waitForDeployment();

  console.log("ChildWelfare deployed to:", await childWelfare.getAddress());

  // Set roles for standard Hardhat accounts
  const signers = await hre.ethers.getSigners();

  // NGO: account 1 (index 1)
  await childWelfare.setRole(signers[1].address, 0); // NGO
  console.log("Set role NGO for:", signers[1].address);

  // Government: account 2 (index 2)
  await childWelfare.setRole(signers[2].address, 2); // Government
  console.log("Set role Government for:", signers[2].address);

  // Hospital: account 3 (index 3)
  await childWelfare.setRole(signers[3].address, 1); // Hospital
  console.log("Set role Hospital for:", signers[3].address);

  // Auditor: account 4 (index 4)
  await childWelfare.setRole(signers[4].address, 3); // Auditor
  console.log("Set role Auditor for:", signers[4].address);

  // Deployer (account 0) can remain default or set to Government if needed
  // For now, leave as default (NGO)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
