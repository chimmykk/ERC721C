const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // The address of the deployed ERC721 contract (NFT contract)
    const erc721ContractAddress = "0xd8e909bB2a1733AAA95E62d6257a87fd0b4064A0"; // Replace with actual address
    const batchTransferAddress = "0xB508EE6cbddF4a1414abdDB26D467eAc5a9F5B8b"; // Replace with actual address

    // Step 1: Approve the ERC721BatchTransfer contract for all tokens
    try {
        const erc721 = await ethers.getContractAt(
            ["function setApprovalForAll(address operator, bool approved) external"], 
            erc721ContractAddress
        );
        
        console.log("Approving ERC721BatchTransfer contract to manage all tokens...");
        const approvalTx = await erc721.setApprovalForAll(batchTransferAddress, true);
        await approvalTx.wait();
        console.log("ERC721BatchTransfer contract approved to manage all tokens");
    } catch (error) {
        console.error("Error during approval:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
