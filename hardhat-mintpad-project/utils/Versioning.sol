// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

abstract contract Versioning {
    // The version of the contract
    string public version;

    constructor() {}

    // Set the version of the contract
    function _setVersion(string memory _version) internal {
        version = _version;
    }
}