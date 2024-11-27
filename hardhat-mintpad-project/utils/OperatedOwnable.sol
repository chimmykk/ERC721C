// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OperatedOwnable is Ownable {
    // Mapping to store multiple operators
    mapping(address => bool) private _operators;

    // Events to track operator changes
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event OperatorTransferred(
        address indexed previousOperator,
        address indexed newOperator
    );

    // Modifier to restrict access to only operators
    modifier onlyOperator() {
        require(
            isOperator(msg.sender),
            "OperatorManager: caller is not an operator"
        );
        _;
    }

    // Constructor to set the owner and operator
    constructor(address owner, address operator) {
        require(
            operator != address(0),
            "OperatorManager: operator is the zero address"
        );
        _operators[operator] = true;
        _transferOwnership(owner); // Transfer ownership to the specified owner
    }

    // Function to check if an address is an operator
    function isOperator(address account) public view returns (bool) {
        return _operators[account];
    }

    // Function to allow the owner to add a new operator
    function addOperator(address operator) public onlyOwner {
        require(
            operator != address(0),
            "OperatorManager: operator is the zero address"
        );
        require(
            !_operators[operator],
            "OperatorManager: operator already exists"
        );

        _operators[operator] = true;
        emit OperatorAdded(operator);
    }

    // Function to allow the owner to remove an operator
    function removeOperator(address operator) public onlyOwner {
        require(
            _operators[operator],
            "OperatorManager: operator does not exist"
        );

        _operators[operator] = false;
        emit OperatorRemoved(operator);
    }

    // Function to renounce operator status (called by the operator themselves)
    function renounceOperator() public onlyOperator {
        _operators[msg.sender] = false;
        emit OperatorRemoved(msg.sender);
    }

    // Function to transfer the operator role by the current operator
    function transferOperator(address newOperator) public onlyOperator {
        require(
            newOperator != address(0),
            "OperatorManager: new operator is the zero address"
        );
        emit OperatorTransferred(msg.sender, newOperator);
        _operators[msg.sender] = false;
        _operators[newOperator] = true;
    }
}