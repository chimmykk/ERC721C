const { ethers } = require("hardhat");

const ERC721_ABI = [
    "function setApprovalForAll(address operator, bool approved) external",
    "function ownerOf(uint256 tokenId) external view returns (address)"
];

const ERC721_BATCH_TRANSFER_ABI = [
    "function batchTransferToSingleWallet(address erc721Contract, address to, uint256[] calldata tokenIds) external",
    "function safeBatchTransferToSingleWallet(address erc721Contract, address to, uint256[] calldata tokenIds) external",
    "function batchTransferToMultipleWallets(address erc721Contract, address[] calldata tos, uint256[] calldata tokenIds) external",
    "function safeBatchTransferToMultipleWallets(address erc721Contract, address[] calldata tos, uint256[] calldata tokenIds) external"
];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // The address of the deployed ERC721 contract (NFT contract)
    const erc721ContractAddress = "0xd8e909bB2a1733AAA95E62d6257a87fd0b4064A0"; // Replace with actual address
    const erc721 = await ethers.getContractAt(ERC721_ABI, erc721ContractAddress);

    // The address of the ERC721BatchTransfer contract
    const batchTransferAddress = "0xB508EE6cbddF4a1414abdDB26D467eAc5a9F5B8b"; // Replace with actual address

    // Step 1: Approve the ERC721BatchTransfer contract for all tokens
    try {
        console.log("Approving ERC721BatchTransfer contract to manage all tokens...");
        const approvalTx = await erc721.setApprovalForAll(batchTransferAddress, true);
        await approvalTx.wait();
        console.log("ERC721BatchTransfer contract approved to manage all tokens");
    } catch (error) {
        console.error("Error during approval:", error);
        return;
    }

    // Step 2: Perform the batch transfer
    const tokenIds = [9,10]; // Tokens to transfer
    const toAddress = "0x000000000000000000000000000000000000dEaD"; // Replace with actual recipient address

    // Check token ownership before initiating transfer
    try {
        for (const tokenId of tokenIds) {
            const owner = await erc721.ownerOf(tokenId);
            if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
                console.error(`Token ID ${tokenId} is not owned by the deployer.`);
                return;
            }
        }
        console.log("All tokens are owned by the deployer, proceeding with transfer...");
    } catch (error) {
        console.error("Error checking token ownership:", error);
        return;
    }

    const ERC721BatchTransfer = await ethers.getContractAt(ERC721_BATCH_TRANSFER_ABI, batchTransferAddress);

    console.log("Initiating batch transfer...");
    try {
        const transferTx = await ERC721BatchTransfer.batchTransferToSingleWallet(
            erc721ContractAddress,
            toAddress,
            tokenIds, {
                gasLimit: 199000 // Adjust gas limit if necessary
            }
        );
        console.log("Transfer transaction sent. Waiting for confirmation...");
        await transferTx.wait();
        console.log(`Tokens ${tokenIds.join(', ')} successfully transferred to ${toAddress}`);
    } catch (error) {
        if (error.data) {
            console.error("Error data:", error.data); // Logs revert reason or more detailed error
        } else {
            console.error("Error during batch transfer:", error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
