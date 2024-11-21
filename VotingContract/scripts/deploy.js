async function main() {
    // Get the list of signers (accounts) provided by Hardhat
    const [deployer] = await ethers.getSigners();
  
    // Log the deployer's address to confirm which account is deploying the contract
    console.log("Deploying contracts with the account:", deployer.address);
  
    // Get the contract factory for the Voting contract
    const Voting = await ethers.getContractFactory("Voting");
  
    // Deploy the contract
    const voting = await Voting.deploy();
  
    // Wait for the deployment to be mined
    await voting.deployed();
  
    // Log the address where the contract is deployed
    console.log("Voting contract deployed to:", voting.address);
  }
  
  // Call the main function and handle any errors
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  