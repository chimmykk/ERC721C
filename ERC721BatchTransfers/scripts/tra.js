const { ethers } = require("hardhat");

// Define the ABI for ERC721 and ERC721BatchTransfer contract
const ERC721_BATCH_TRANSFER_ABI = [
    "function batchTransferToSingleWallet(address erc721Contract, address to, uint256[] calldata tokenIds) external",
    "function safeBatchTransferToSingleWallet(address erc721Contract, address to, uint256[] calldata tokenIds) external"
];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // The address of the deployed ERC721 contract (NFT contract)
    const erc721ContractAddress = "0xd8e909bB2a1733AAA95E62d6257a87fd0b4064A0"; // Replace with actual address

    // The address of the ERC721BatchTransfer contract
    const batchTransferAddress = "0xB508EE6cbddF4a1414abdDB26D467eAc5a9F5B8b"; // Replace with actual address

    // Step 1: Check token ownership
    const tokenIds = [0, 1, 2, 3, 4]; // Tokens to transfer
    for (const tokenId of tokenIds) {
        const owner = await ethers.getContractAt("IERC721", erc721ContractAddress);
        const tokenOwner = await owner.ownerOf(tokenId);
        console.log(`Owner of token ${tokenId}:`, tokenOwner);
        if (tokenOwner !== deployer.address) {
            console.error(`Deployer is not the owner of token ${tokenId}`);
            return;
        }
    }

    // Step 2: Perform the batch transfer
    const toAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual recipient address
    const ERC721BatchTransfer = await ethers.getContractAt(ERC721_BATCH_TRANSFER_ABI, batchTransferAddress);

    console.log("Initiating batch transfer...");
    try {
        // Initiate batch transfer with gas limit
        const transferTx = await ERC721BatchTransfer.batchTransferToSingleWallet(
            erc721ContractAddress,
            toAddress,
            tokenIds, 
            {
                gasLimit: 500000 // Increase if needed
            }
        );
        console.log("Transfer transaction sent. Waiting for confirmation...");
        await transferTx.wait();
        console.log(`Tokens ${tokenIds.join(', ')} successfully transferred to ${toAddress}`);
    } catch (error) {
        console.error("Error during batch transfer:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
