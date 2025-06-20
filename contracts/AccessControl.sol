// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable {
    enum Role { None, Physician, Expert, Admin, Patient }

    struct UserProfile {
        Role role;
        string name;
        string specialty;
    }

    mapping(address => UserProfile) public userProfiles;

    // list of all users (for off-chain filtering)
    address[] public allUsers;

    // ===================== Events =====================
    event RoleAssigned(address indexed user, Role role);
    event RoleRevoked(address indexed user);
    event RoleChanged(address indexed user, Role oldRole, Role newRole);
    event ProfileUpdated(address indexed user, string name, string specialty);

    // ===================== Modifiers =====================
    modifier onlyPhysician() {
        require(userProfiles[msg.sender].role == Role.Physician, "Only physicians allowed");
        _;
    }

    modifier onlyExpert() {
        require(userProfiles[msg.sender].role == Role.Expert, "Only experts allowed");
        _;
    }

    modifier onlyAdmin() {
        require(userProfiles[msg.sender].role == Role.Admin, "Only admin allowed");
        _;
    }

    modifier onlyPatient() {
        require(userProfiles[msg.sender].role == Role.Patient, "Only patients allowed");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ===================== Core Logic =====================

    function assignRole(
        address user,
        Role role,
        string memory name,
        string memory specialty
    ) external onlyOwner {
        require(user != owner(), "Owner cannot be assigned a role");
        require(userProfiles[user].role == Role.None, "User already has a role");
        require(bytes(name).length > 0, "Name is required");

        if (role == Role.Physician || role == Role.Expert) {
            require(bytes(specialty).length > 0, "Specialty required for medical roles");
        }

        userProfiles[user] = UserProfile({
            role: role,
            name: name,
            specialty: specialty
        });

        allUsers.push(user);
        emit RoleAssigned(user, role);
    }

    function revokeRole(address user) external onlyOwner {
        require(userProfiles[user].role != Role.None, "User has no role");
        delete userProfiles[user];
        emit RoleRevoked(user);
    }

    function changeRole(address user, Role newRole) external onlyOwner {
        require(userProfiles[user].role != Role.None, "User does not exist");
        require(newRole != Role.None, "Invalid role");

        Role oldRole = userProfiles[user].role;
        userProfiles[user].role = newRole;

        emit RoleChanged(user, oldRole, newRole);
    }

    function updateProfile(string memory name, string memory specialty) external {
        require(userProfiles[msg.sender].role != Role.None, "No profile found");
        require(bytes(name).length > 0, "Name is required");

        Role role = userProfiles[msg.sender].role;

        if (role == Role.Physician || role == Role.Expert) {
            require(bytes(specialty).length > 0, "Specialty required for medical roles");
            userProfiles[msg.sender].specialty = specialty;
        }

        userProfiles[msg.sender].name = name;
        emit ProfileUpdated(msg.sender, name, specialty);
    }

    // ===================== View Functions =====================

    function getRole(address user) external view returns (Role) {
        return userProfiles[user].role;
    }

    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function isPhysician(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Physician;
    }

    function isExpert(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Expert;
    }

    function isAdmin(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Admin;
    }

    function isPatient(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Patient;
    }

    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }
}
