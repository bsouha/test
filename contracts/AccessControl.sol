// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable(msg.sender) {
    enum Role { None, Physician, Expert, Admin }

    mapping(address => Role) public userRoles;

    modifier onlyPhysician() {
        require(userRoles[msg.sender] == Role.Physician, "Only physicians allowed");
        _;
    }

    modifier onlyExpert() {
        require(userRoles[msg.sender] == Role.Expert, "Only experts allowed");
        _;
    }

    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.Admin, "Only admin allowed");
        _;
    }

    event RoleAssigned(address indexed user, Role role);

    function assignRole(address user, Role role) external onlyOwner {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    function getRole(address user) external view returns (Role) {
        return userRoles[user];
    }
}