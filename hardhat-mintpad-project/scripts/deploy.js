const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment of MintpadErc721C implementation...");

    // Get the deployer's signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the MintpadErc721C contract (implementation contract)
    const MintpadErc721C = await ethers.getContractFactory("MintpadErc721C");
    const mintpad = await MintpadErc721C.deploy();
    await mintpad.waitForDeployment();
    
    const mintpadAddress = await mintpad.getAddress();
    console.log(`MintpadErc721C implementation deployed to: ${mintpadAddress}`);

    // Optionally: You can return or store this address for use in the factory
    return mintpadAddress;
    
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exitCode = 1;
  }
}

// Execute deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
