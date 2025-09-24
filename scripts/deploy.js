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

  // Get signers and assign exactly one account per role
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const ngo = signers[1];
  const government = signers[2];
  const hospital = signers[3];
  const auditor = signers[4];

  console.log(`👤 Admin:       ${admin.address}`);
  console.log(`👤 NGO:         ${ngo.address}`);
  console.log(`👤 Government:  ${government.address}`);
  console.log(`👤 Hospital:    ${hospital.address}`);
  console.log(`👤 Auditor:     ${auditor.address}`);

  console.log("🔐 Setting up single-account roles...");
  
  const NGO_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("NGO_ROLE"));
  const GOVERNMENT_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("GOVERNMENT_ROLE"));
  const HOSPITAL_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("HOSPITAL_ROLE"));
  const AUDITOR_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("AUDITOR_ROLE"));

  await childWelfare.grantRole(NGO_ROLE, ngo.address);
  await childWelfare.grantRole(GOVERNMENT_ROLE, government.address);
  await childWelfare.grantRole(HOSPITAL_ROLE, hospital.address);
  await childWelfare.grantRole(AUDITOR_ROLE, auditor.address);

  console.log("✅ Roles granted to unique accounts");

  // Create a test record using NGO account (role-restricted)
  console.log("📝 Creating test record (NGO)...");
  
  const tx = await childWelfare.connect(ngo).createRecord(
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
    deployer: admin.address,
    rolesMapping: {
      admin: admin.address,
      ngo: ngo.address,
      government: government.address,
      hospital: hospital.address,
      auditor: auditor.address
    },
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
