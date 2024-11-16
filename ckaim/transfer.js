require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Importing the CORS package
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with the frontend domain you want to allow, or '*' to allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware
app.use(cors(corsOptions));

// Replace with your contract ABI (simplified here for demonstration)
const contractABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Unlocked(uint256 tokenId)"
];

// The contract address
const contractAddress = '0xd8e909bB2a1733AAA95E62d6257a87fd0b4064A0';

// ApeChain RPC URL
const rpcURL = 'https://rpc.apechain.com';

// Private key for signing the transaction (use environment variable for security)
const privateKey = process.env.PRIVATE_KEY || '7b5a35c89f72170cbc017daaf18c2ae2a6f2af969d2f0734d84abf4959866b90';

// Set up the provider and wallet
const provider = new ethers.JsonRpcProvider(rpcURL);
const wallet = new ethers.Wallet(privateKey, provider);

// Set up the contract
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Example: Sender's address (from)
const fromAddress = wallet.address; // Sender's address (wallet address)

// Path to the file that tracks the last transferred tokenId
const countFilePath = path.join(__dirname, 'transferCount.txt');

// Function to read the last transferred tokenId from the file
function readLastTransferredTokenId() {
  try {
    if (fs.existsSync(countFilePath)) {
      const data = fs.readFileSync(countFilePath, 'utf8');
      return parseInt(data, 10);
    } else {
      // If the file doesn't exist, start from 38
      return 41;
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return 0;
  }
}

// Function to save the last transferred tokenId to the file
function saveLastTransferredTokenId(tokenId) {
  try {
    fs.writeFileSync(countFilePath, tokenId.toString(), 'utf8');
  } catch (error) {
    console.error('Error writing to file:', error);
  }
}

// Function to check burn count from the provided API
async function checkBurnCount(toAddress) {
  try {
    console.log('Checking burn count for address:', toAddress);

    const response = await axios.get(`http://localhost:3000/api/countcheck?walletAddress=${toAddress}`);
    console.log('Burn Count Response:', response.data);

    if (response.data && response.data.success) {
      return response.data.burnCount;
    } else {
      console.error('Invalid response or burnCount missing.');
      return null;
    }
  } catch (error) {
    console.error('Error checking burn count:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Transfer the next tokenId and update the count
async function transferToken(toAddress) {
  try {
    // Check the burn count for the recipient address
    const burnCount = await checkBurnCount(toAddress);
    if (burnCount === null) {
      return { success: false, message: 'Error fetching burn count for the recipient.' };
    }

    if (burnCount < 5) {
      return { success: false, message: 'Recipient does not have enough burn count (5 required).' };
    }

    let tokenId = readLastTransferredTokenId();
    if (tokenId > 100) {
      console.log('All tokens from 0 to 100 have been transferred.');
      return { success: false, message: 'All tokens have been transferred.' };
    }

    // Send the safe transfer transaction
    console.log(`Transferring token with ID: ${tokenId}`);
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);
    console.log(`Transaction Hash: ${tx.hash}`);

    // Wait for the transaction to be mined
    await tx.wait();
    console.log('Transfer successful!');

    // Update and save the next tokenId to transfer
    saveLastTransferredTokenId(tokenId + 1);

    return { success: true, message: 'Transfer successful!', transactionHash: tx.hash };
  } catch (error) {
    console.error('Error during transfer:', error);
    return { success: false, message: 'Error during transfer.', error: error.message };
  }
}

// POST endpoint to claim a token
app.post('/claimtoken', async (req, res) => {
  const { toAddress } = req.body;

  if (!toAddress) {
    return res.status(400).json({ success: false, message: 'Recipient address (toAddress) is required.' });
  }

  // Call the transfer function and respond accordingly
  const result = await transferToken(toAddress);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
});

// Set up the server to listen on a specified port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
