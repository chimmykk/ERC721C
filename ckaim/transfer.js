require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'https://miniburn.peekcell.art', // Replace with the frontend domain you want to allow
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply the CORS middleware
app.use(cors(corsOptions));

// Contract ABI and Address
const contractABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Unlocked(uint256 tokenId)"
];
const contractAddress = '0xd8e909bB2a1733AAA95E62d6257a87fd0b4064A0';
const rpcURL = 'https://rpc.apechain.com';
const privateKey = process.env.PRIVATE_KEY || '7b5a35c89f72170cbc017daaf18c2ae2a6f2af969d2f0734d84abf4959866b90';

// Set up the provider and wallet
const provider = new ethers.JsonRpcProvider(rpcURL);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Example: Sender's address (from)
const fromAddress = wallet.address;

// Path to the files that track the last transferred tokenId and claimed addresses
const countFilePath = path.join(__dirname, 'transferCount.txt');
const claimFilePath = path.join(__dirname, 'claim.txt');

// Function to read the last transferred tokenId from the file
function readLastTransferredTokenId() {
  try {
    if (fs.existsSync(countFilePath)) {
      const data = fs.readFileSync(countFilePath, 'utf8');
      return parseInt(data, 10);
    } else {
      return 42; // Starting point if file doesn't exist
    }
  } catch (error) {
    console.error('Error reading last transferred tokenId:', error);
    return 42;
  }
}

// Function to save the last transferred tokenId to the file
function saveLastTransferredTokenId(tokenId) {
  try {
    fs.writeFileSync(countFilePath, tokenId.toString(), 'utf8');
  } catch (error) {
    console.error('Error writing last transferred tokenId to file:', error);
  }
}

// Function to read the claimed addresses from the file
function readClaimedAddresses() {
  try {
    if (fs.existsSync(claimFilePath)) {
      const data = fs.readFileSync(claimFilePath, 'utf8');
      return data.split('\n').filter(Boolean); // Split by line and remove empty entries
    }
    return [];
  } catch (error) {
    console.error('Error reading claimed addresses file:', error);
    return [];
  }
}

// Function to save the claimed address to the file
function saveClaimedAddress(address) {
  try {
    fs.appendFileSync(claimFilePath, address + '\n', 'utf8');
  } catch (error) {
    console.error('Error writing to claimed addresses file:', error);
  }
}

// Function to check burn count from the provided API
async function checkBurnCount(toAddress) {
  try {
    const response = await axios.get(`https://miniburn.peekcell.art/api/countcheck?walletAddress=${toAddress}`);
    if (response.data && response.data.success) {
      return response.data.burnCount;
    } else {
      console.error('Invalid response or burnCount missing.');
      return null;
    }
  } catch (error) {
    console.error('Error checking burn count:', error);
    return null;
  }
}

// Transfer the next tokenId and update the count
async function transferToken(toAddress) {
  try {
    const claimedAddresses = readClaimedAddresses();
    if (claimedAddresses.includes(toAddress)) {
      return { success: false, message: 'Address has already claimed a token.' };
    }

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
      return { success: false, message: 'All tokens from 0 to 100 have been transferred.' };
    }

    // Send the safe transfer transaction
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);
    await tx.wait(); // Wait for the transaction to be mined

    // Save the address as claimed and update tokenId
    saveClaimedAddress(toAddress);
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
