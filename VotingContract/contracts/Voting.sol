// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract Voting {

//@author chimmykk
// a smart contract to vote for Kamala and trump
    // Define candidates
    enum Candidate { Trump, Kamala }

    // Mapping to store votes for each candidate
    mapping(Candidate => uint256) public votes;

    // Mapping to track if an address has already voted
    mapping(address => bool) public hasVoted;

    // Variable to check if voting has ended
    bool public votingEnded;

    // Events to log the voting action
    event Voted(address indexed voter, Candidate candidate);
    event VotingEnded();

    // Constructor to initialize the contract
    constructor() {
        votingEnded = false;
    }

    // Function to vote for a candidate
    function vote(Candidate candidate) public {
        require(!votingEnded, "Voting has ended.");
        require(!hasVoted[msg.sender], "You have already voted.");
        
        // Mark this address as voted
        hasVoted[msg.sender] = true;

        // Increment the vote count for the selected candidate
        votes[candidate] += 1;

        // Emit an event for logging
        emit Voted(msg.sender, candidate);
    }

    // Function to get the vote count for a candidate
    function getVotes(Candidate candidate) public view returns (uint256) {
        return votes[candidate];
    }

    // Function to end the voting process
    function endVote() public {
        require(!votingEnded, "Voting has already ended.");
        votingEnded = true;

        // Emit an event for logging
        emit VotingEnded();
    }

    // Function to get the winner
    function getWinner() public view returns (string memory) {
        require(votingEnded, "Voting has not ended yet.");

        if (votes[Candidate.Trump] > votes[Candidate.Kamala]) {
            return "Trump wins!";
        } else if (votes[Candidate.Trump] < votes[Candidate.Kamala]) {
            return "Kamala wins!";
        } else {
            return "It's a tie!";
        }
    }
}
