// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

abstract contract PhaseMint {
    mapping(bytes32 => PhaseDetails) public phases;

    struct PhaseDetails {
        uint256 maxSupply;
        uint256 currentMinted;
        mapping(address => bool) whitelist;
        mapping(address => uint256) mintedByUser;
    }

    /// @notice Add addresses to the whitelist for a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _addresses Array of addresses to whitelist
    function _addToWhitelist(
        bytes32 _phaseID, 
        address[] memory _addresses
    ) internal {
        for (uint i = 0; i < _addresses.length; i++) {
            phases[_phaseID].whitelist[_addresses[i]] = true;
        }
    }

    /// @notice Remove addresses from the whitelist for a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _addresses Array of addresses to remove from whitelist
    function _removeFromWhitelist(
        bytes32 _phaseID, 
        address[] memory _addresses
    ) internal {
        for (uint i = 0; i < _addresses.length; i++) {
            phases[_phaseID].whitelist[_addresses[i]] = false;
        }
    }

    /// @notice Initialize a new minting phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _maxSupply Maximum number of tokens that can be minted in this phase
    function _initializePhase(
        bytes32 _phaseID, 
        uint256 _maxSupply
    ) internal {
        phases[_phaseID].maxSupply = _maxSupply;
        phases[_phaseID].currentMinted = 0;
    }

    /// @notice Checks and updates minting constraints for a whitelisted phase
    /// @param _to Address minting the tokens
    /// @param _amount Number of tokens to mint
    /// @param _phaseID Identifier for the current minting phase
    /// @param _maxPerUser Maximum tokens per user in this phase
    function _mintPhase(
        address _to,
        uint256 _amount,
        bytes32 _phaseID,
        uint256 _maxPerUser
    ) internal {
        PhaseDetails storage phase = phases[_phaseID];

        // Check whitelist
        require(phase.whitelist[_to], "Address not whitelisted");

        // Check max supply for phase
        require(
            phase.currentMinted + _amount <= phase.maxSupply, 
            "Phase supply exceeded"
        );

        // Check max per user
        require(
            phase.mintedByUser[_to] + _amount <= _maxPerUser, 
            "Exceeds max tokens per user"
        );

        // Update minting statistics
        phase.currentMinted += _amount;
        phase.mintedByUser[_to] += _amount;
    }

    /// @notice Check if an address is whitelisted for a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _address Address to check
    /// @return Whether the address is whitelisted
    function isWhitelisted(
        bytes32 _phaseID, 
        address _address
    ) public view returns (bool) {
        return phases[_phaseID].whitelist[_address];
    }

    /// @notice Get number of tokens minted by a user in a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _user Address of the user
    /// @return Number of tokens minted by the user
    function mintedByUser(
        bytes32 _phaseID, 
        address _user
    ) public view returns (uint256) {
        return phases[_phaseID].mintedByUser[_user];
    }

    /// @notice Get total number of tokens minted in a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @return Total number of tokens minted
    function mintedTotal(bytes32 _phaseID) public view returns (uint256) {
        return phases[_phaseID].currentMinted;
    }
}