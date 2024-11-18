require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

// Contract ABI and Address for ERC-1155
const contractABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public",
];
const contractAddress = '0xf24E1D553ED7D5872eBE92E03e92Cb46892ec4E5';
const rpcURL = 'https://rpc.apechain.com';
const privateKey = process.env.PRIVATE_KEY || '7b5a35c89f72170cbc017daaf18c2ae2a6f2af969d2f0734d84abf4959866b90';

// Set up the provider and wallet
const provider = new ethers.JsonRpcProvider(rpcURL);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Example: Sender's address (from)
const fromAddress = wallet.address;

// Path to the CSV file that tracks claims
const claimsFilePath = path.join(__dirname, 'claims.csv');

// Function to read and parse the CSV file into a JavaScript object
function readClaims() {
  if (!fs.existsSync(claimsFilePath)) {
    return {};
  }

  const data = fs.readFileSync(claimsFilePath, 'utf8');
  const lines = data.split('\n').filter(Boolean);
  const claims = {};

  lines.forEach(line => {
    const [address, count] = line.split(',');
    claims[address] = parseInt(count, 10);
  });

  return claims;
}

// Function to update the CSV file with new claims data
function updateClaims(address, newCount) {
  const claims = readClaims();
  claims[address] = newCount;

  const data = Object.entries(claims)
    .map(([addr, count]) => `${addr},${count}`)
    .join('\n');

  fs.writeFileSync(claimsFilePath, data, 'utf8');
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

// Determine the maximum allowable claims based on burn count tiers
function getMaxClaimsByBurnCount(burnCount) {
  if (burnCount >= 25) {
    return 3; // Tier 1
  } else if (burnCount >= 15) {
    return 2; // Tier 2
  } else if (burnCount >= 5) {
    return 1; // Tier 3
  }
  return 0; // Not eligible
}

// Transfer the specific token ID 0
async function transferToken(toAddress) {
  try {
    // Read claims data
    const claims = readClaims();
    const currentClaims = claims[toAddress] || 0;

    // Check the burn count for the recipient address
    const burnCount = await checkBurnCount(toAddress);
    if (burnCount === null) {
      return { success: false, message: 'Error fetching burn count for the recipient.' };
    }

    // Determine the maximum allowable claims based on the burn count
    const maxClaims = getMaxClaimsByBurnCount(burnCount);
    if (maxClaims === 0) {
      return { success: false, message: 'Recipient does not have enough burn count to claim a token.' };
    }

    // Check if the user has already reached their allowable claim limit
    if (currentClaims >= maxClaims) {
      return { success: false, message: `Address has reached the maximum claim limit of ${maxClaims} for their burn count tier.` };
    }

    // Send the safe transfer transaction with token ID 0 and amount 1
    const tokenId = 0;
    const amount = 1;
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId, amount, '0x');
    await tx.wait(); // Wait for the transaction to be mined

    // Update the claim count after a successful transfer
    updateClaims(toAddress, currentClaims + 1);

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
