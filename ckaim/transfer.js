require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'https://miniburn.peekcell.art',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Contract ABI and Address for ERC-1155
const contractABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public",
];
const contractAddress = '0x46396a9A78a6CD91A5784EBE01bd0c162c0bE7B9';
const rpcURL = 'https://rpc.apechain.com';
const privateKey = process.env.PRIVATE_KEY || '7b5a35c89f72170cbc017daaf18c2ae2a6f2af969d2f0734d84abf4959866b90';

const provider = new ethers.JsonRpcProvider(rpcURL);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const fromAddress = wallet.address;

// Paths to CSV files
const canClaimCsvPath = './canclaim.csv';
const cannotClaimCsvPath = './cannotclaim.csv';

// Ensure CSV files exist
const ensureCsvFilesExist = () => {
  if (!fs.existsSync(canClaimCsvPath)) {
    fs.writeFileSync(canClaimCsvPath, 'address\n'); // Create header
  }
  if (!fs.existsSync(cannotClaimCsvPath)) {
    fs.writeFileSync(cannotClaimCsvPath, 'address\n'); // Create header
  }
};
ensureCsvFilesExist();

// Function to read CSV and return an array of addresses
const readCsv = (filePath) => {
  const addresses = [];
  fs.createReadStream(filePath)
    .pipe(parse({ headers: false }))
    .on('data', (row) => {
      addresses.push(row['address'].toLowerCase());
    });
  return addresses;
};

// Function to add an address to the CSV file
const writeToCsv = (filePath, address) => {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [{ id: 'address', title: 'address' }],
    append: true,
  });
  csvWriter.writeRecords([{ address }])
    .then(() => console.log(`Added ${address} to ${filePath}`));
};

// Function to move address from `canclaim.csv` to `cannotclaim.csv`
const moveAddressToCannotClaim = (address) => {
  const canClaimAddresses = readCsv(canClaimCsvPath);
  const filteredAddresses = canClaimAddresses.filter(addr => addr !== address.toLowerCase());
  fs.writeFileSync(canClaimCsvPath, 'address\n');
  filteredAddresses.forEach(addr => writeToCsv(canClaimCsvPath, addr));

  writeToCsv(cannotClaimCsvPath, address);
};

// Function to check if the address is eligible to claim
const isEligibleToClaim = async (toAddress) => {
  const canClaimAddresses = readCsv(canClaimCsvPath);
  return canClaimAddresses.includes(toAddress.toLowerCase());
};

// POST endpoint to claim a token
app.post('/claimtoken', async (req, res) => {
  const { toAddress } = req.body;

  if (!toAddress) {
    return res.status(400).json({ success: false, message: 'Recipient address (toAddress) is required.' });
  }

  try {
    // Check if the address is eligible to claim
    const eligible = await isEligibleToClaim(toAddress);
    if (!eligible) {
      return res.status(400).json({ success: false, message: 'This address is not eligible to claim a token.' });
    }

    // Send the safe transfer transaction with token ID 0 and amount 1
    const tokenId = 0;
    const amount = 1;
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId, amount, '0x');
    await tx.wait(); // Wait for the transaction to be mined

    // Move the address to cannotclaim.csv
    moveAddressToCannotClaim(toAddress);

    return res.status(200).json({ success: true, message: 'Transfer successful!', transactionHash: tx.hash });
  } catch (error) {
    console.error('Error during claim:', error);
    return res.status(500).json({ success: false, message: 'Error during claim.', error: error.message });
  }
});

// POST endpoint to add an address to the `canclaim.csv`
app.post('/sentcanclaimaddress', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  try {
    // Convert the address to lowercase for consistency
    const lowerCaseAddress = address.toLowerCase();

    // Check if the address is already in the `canclaim.csv`
    const canClaimAddresses = readCsv(canClaimCsvPath);
    if (canClaimAddresses.includes(lowerCaseAddress)) {
      return res.status(400).json({ success: false, message: 'This address is already in the canclaim list.' });
    }

    // Add the address to `canclaim.csv`
    writeToCsv(canClaimCsvPath, lowerCaseAddress);

    return res.status(200).json({ success: true, message: 'Address added to canclaim.csv.' });
  } catch (error) {
    console.error('Error adding address to canclaim.csv:', error);
    return res.status(500).json({ success: false, message: 'Error adding address to canclaim.csv.', error: error.message });
  }
});

// Set up the server to listen on a specified port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
