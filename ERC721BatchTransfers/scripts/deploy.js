const { ethers } = require("hardhat");

async function main() {
    // Get the signers
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Get the ERC721BatchTransfer contract
    const ERC721BatchTransfer = await ethers.getContractFactory("ERC721BatchTransfer");

    console.log("Deploying ERC721BatchTransfer...");

    // Deploy the contract
    const batchTransfer = await ERC721BatchTransfer.deploy();

    console.log("ERC721BatchTransfer deployed to:", batchTransfer.address);
}

// Run the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
