// This ensures Hardhat runtime environment is available
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Child Welfare Smart Contract...");

  // Get the contract factory
  const ChildWelfare = await hre.ethers.getContractFactory("ChildWelfare");
  
  // Deploy the contract
  const childWelfare = await ChildWelfare.deploy();
  
  // Wait for deployment to complete
  await childWelfare.deployed();

  console.log("✅ Child Welfare contract deployed successfully!");
  console.log(`📍 Contract Address: ${childWelfare.address}`);
  console.log(`🔗 Network: ${hre.network.name}`);
  console.log(`⛽ Gas Used: ${childWelfare.deployTransaction.gasLimit.toString()}`);

  // Get deployer information
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Deployer Balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Grant initial roles to deployer
  console.log("🔐 Setting up initial roles...");
  
  const NGO_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("NGO_ROLE"));
  const GOVERNMENT_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("GOVERNMENT_ROLE"));
  const HOSPITAL_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("HOSPITAL_ROLE"));
  const AUDITOR_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("AUDITOR_ROLE"));

  // Grant all roles to deployer for testing
  await childWelfare.grantRole(NGO_ROLE, deployer.address);
  await childWelfare.grantRole(GOVERNMENT_ROLE, deployer.address);
  await childWelfare.grantRole(HOSPITAL_ROLE, deployer.address);
  await childWelfare.grantRole(AUDITOR_ROLE, deployer.address);

  console.log("✅ Initial roles granted to deployer");

  // Create a test record
  console.log("📝 Creating test record...");
  
  const tx = await childWelfare.createRecord(
    "Test Child",
    10,
    "healthy",
    "Test City",
    "Test Guardian",
    "Test metadata for demonstration"
  );

  await tx.wait();
  console.log("✅ Test record created successfully");

  // Get record count
  const recordCount = await childWelfare.recordCount();
  console.log(`📊 Total records: ${recordCount.toString()}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: childWelfare.address,
    network: hre.network.name,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    recordCount: recordCount.toString(),
    roles: {
      NGO_ROLE: NGO_ROLE,
      GOVERNMENT_ROLE: GOVERNMENT_ROLE,
      HOSPITAL_ROLE: HOSPITAL_ROLE,
      AUDITOR_ROLE: AUDITOR_ROLE
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Open frontend/index.html in your browser");
  console.log("3. Enter the contract address in the frontend");
  console.log("4. Connect to your local Ethereum node");
  console.log("5. Start creating and managing child records!");
}

// Run main and catch errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
