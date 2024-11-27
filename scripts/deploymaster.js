// scripts/deploy_mintpad_factory.js

const { ethers } = require("hardhat");

async function main() {
  // Replace with the addresses for the owner and operator
  const ownerAddress = "0xecA86f60212d55C64E82e906881eD375d237f025"; // Update this with a valid owner address
  const operatorAddress = "0xecA86f60212d55C64E82e906881eD375d237f025"; // Update this with a valid operator address

  // Ensure the owner and operator addresses are valid
 
  console.log("Deploying MintpadFactory...");

  // Get the contract factory
  const MintpadFactory = await ethers.getContractFactory("MintpadFactory");

  // Deploy the contract with owner and operator addresses
  const mintpadFactory = await MintpadFactory.deploy(ownerAddress, operatorAddress);



  console.log("MintpadFactory deployed successfully!");
  console.log(`Contract Address: ${mintpadFactory.address}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log(`Operator Address: ${operatorAddress}`);
}

// Handle errors and execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
