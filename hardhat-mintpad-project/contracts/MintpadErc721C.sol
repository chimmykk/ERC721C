// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@limitbreak/creator-token-contracts/contracts/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-contracts/contracts/programmable-royalties/BasicRoyalties.sol";
import "@limitbreak/creator-token-contracts/contracts/access/OwnableInitializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../ERC721/phaseMint.sol";
import "../utils/PaymentSplitter.sol";
import "../utils/ImmediateRoyaltySplitter.sol";
import "../utils/TradingEnabler.sol";
import "../utils/Versioning.sol";

/// @title MintpadERC721 Contract with Minting Phases and Whitelist
/// @author chimmykk
/// @notice This contract allows for minting ERC721 tokens in phases with whitelist
contract MintpadErc721C is
    ERC721CInitializable,
    BasicRoyaltiesInitializable,
    OwnableInitializable,
    ReentrancyGuard,
    PhaseMint,
    PaymentSplitter,
    ImmediateRoyaltySplitter,
    TradingEnabler,
    Versioning
{
    string public baseURI; // Base URI for the token metadata
    uint256 public supply; // Maximum token supply
    uint256 public firstTokenId; // First token ID
    uint256 public minted; // Current number of tokens minted
    bool public burnEnabled = false; // Burn enabled

    constructor() ReentrancyGuard() ERC721("", "") {}

    /// @notice Initializes the MintpadErc721 contract.
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        uint256 _supply,
        uint256 _firstTokenId,
        address _owner,
        uint96 _royaltyFeeNumerator
    ) public {
        require(_supply > 0, "Supply must be greater than 0");
        require(_owner != address(0), "Invalid owner");
        require(bytes(_baseUri).length > 0, "Invalid base URI");

        // Initialize parent contracts
        initializeOwner(msg.sender);
        initializeERC721(_name, _symbol);

        // Transfer ownership to the specified address
        transferOwnership(_owner);

        // Initialize remaining contracts
        _setDefaultRoyalty(address(this), _royaltyFeeNumerator);
        _setVersion("1.1.0");

        // Initialize the contract parameters
        supply = _supply;
        minted = 0;
        baseURI = _baseUri;
        firstTokenId = _firstTokenId;
    }

    /// @notice Mints tokens to a specified address in a specific phase
    function mint(
        address _to,
        uint256 _amount,
        bytes32 _phaseID,
        uint256 _price,
        uint256 _maxPerUser
    ) external payable nonReentrant {
        require(msg.sender == tx.origin, "No contract interaction");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalSupply() + _amount <= supply, "Exceeds max supply");
        require(msg.value >= _price * _amount, "Insufficient funds");

        _mintPhase(
            _to,
            _amount,
            _phaseID,
            _maxPerUser
        );

        uint256 _tokenId = totalSupply() + firstTokenId;
        minted += _amount;
        for (uint256 i = 0; i < _amount; i++) {
            _safeMint(_to, _tokenId);
            _tokenId++;
        }
    }

    /// @notice Adds addresses to the whitelist for a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _addresses Array of addresses to whitelist
    function addToWhitelist(
        bytes32 _phaseID, 
        address[] memory _addresses
    ) external {
        _requireCallerIsContractOwner();
        _addToWhitelist(_phaseID, _addresses);
    }

    /// @notice Removes addresses from the whitelist for a specific phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _addresses Array of addresses to remove from whitelist
    function removeFromWhitelist(
        bytes32 _phaseID, 
        address[] memory _addresses
    ) external {
        _requireCallerIsContractOwner();
        _removeFromWhitelist(_phaseID, _addresses);
    }

    /// @notice Initializes a new minting phase
    /// @param _phaseID Identifier for the minting phase
    /// @param _maxSupply Maximum number of tokens for this phase
    function initializePhase(
        bytes32 _phaseID, 
        uint256 _maxSupply
    ) external {
        _requireCallerIsContractOwner();
        _initializePhase(_phaseID, _maxSupply);
    }

    /// @notice Burns a token.
    function burn(uint256 tokenId) external {
        require(burnEnabled, "Burn disabled");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Burn not approved");
        _burn(tokenId);
    }

    /// @notice Returns the total number of tokens minted.
    function totalSupply() public view returns (uint256) {
        return minted;
    }

    /// @notice Returns the base URI for token metadata.
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /// @notice Sets a new base URI for token metadata.
    function setBaseURI(string memory _baseUri) public {
        _requireCallerIsContractOwner();
        baseURI = _baseUri;
    }

    /// @notice Sets the supply of the contract.
    function setSupply(uint256 _newSupply) external {
        _requireCallerIsContractOwner();
        require(
            _newSupply >= totalSupply(),
            "New supply must be greater than or equal to total supply"
        );
        supply = _newSupply;
    }

    /// @notice Allows the owner to set the royalties for the contract.
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external {
        _requireCallerIsContractOwner();
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /// @notice Allows the owner to set the royalties for a specific token.
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external {
        _requireCallerIsContractOwner();
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /// @notice Enables or disables the burn functionality.
    function setBurnEnabled(bool _enabled) external {
        _requireCallerIsContractOwner();
        burnEnabled = _enabled;
    }

    /// @notice Checks if the contract supports the given interface.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721CInitializable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Allows the owner to enable trading for the contract.
    function enableTrading() external onlyOwner {
        _enableTrading();
    }

    /// @notice Overrides the transfer function to check if trading is enabled.
    function setApprovalForAll(
        address operator,
        bool approved
    ) public override tradingEnabledOnly {
        super.setApprovalForAll(operator, approved);
    }

    /// @notice Overrides the transfer function to check if trading is enabled.
    function approve(
        address to,
        uint256 tokenId
    ) public override tradingEnabledOnly {
        super.approve(to, tokenId);
    }

    /// @notice Initializes the receivers and their shares.
    function initializeRoyaltyShares(
        address[] memory _receivers,
        uint256[] memory _shares
    ) external {
        _requireCallerIsContractOwner();
        _initializeRoyaltyShares(_receivers, _shares);
    }

    /// @notice Updates the receivers and their shares.
    function updatePaymentShares(
        address[] memory _receivers,
        uint256[] memory _shares
    ) external {
        _requireCallerIsContractOwner();
        _updatePaymentShares(_receivers, _shares);
    }
}