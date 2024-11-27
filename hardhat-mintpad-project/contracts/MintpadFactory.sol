// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../utils/OperatedOwnable.sol";
import "../utils/Versioning.sol";

contract MintpadFactory is OperatedOwnable, Versioning {
    // Event emitted when a clone is created
    event CloneCreated(address cloneAddress);

    // Set the owner of the contract
    constructor(
        address owner,
        address operator
    ) OperatedOwnable(owner, operator) {
        _setVersion("1.0.0");
    }

    // Create a clone of the implementation contract
    function clone(
        address _implementation,
        bytes memory _initData
    ) external onlyOperator returns (address cloneAddress) {
        // Clone the implementation contract
        cloneAddress = Clones.clone(_implementation);

        // Initialize the clone
        (bool success, ) = cloneAddress.call(_initData);
        require(success, "MintpadFactory: failed to initialize clone");

        // Emit an event
        emit CloneCreated(cloneAddress);
    }
}
