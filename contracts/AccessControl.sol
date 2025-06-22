// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable {
    enum Role { None, Physician, Expert, Admin, Patient }

    struct UserProfile {
        Role role;
        string ipfsHash; // IPFS hash containing encrypted profile data
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => UserProfile) public userProfiles;
    mapping(address => string) public userIPFSHashes; // Direct access to IPFS hashes

    // List of all users (for off-chain filtering)
    address[] public allUsers;
    mapping(Role => address[]) public usersByRole;

    // ===================== Events =====================
    event RoleAssigned(address indexed user, Role role, string ipfsHash);
    event RoleRevoked(address indexed user);
    event RoleChanged(address indexed user, Role oldRole, Role newRole);
    event ProfileUpdated(address indexed user, string newIpfsHash);
    event UserDeactivated(address indexed user);
    event UserReactivated(address indexed user);

    // ===================== Modifiers =====================
    modifier onlyPhysician() {
        require(userProfiles[msg.sender].role == Role.Physician && userProfiles[msg.sender].isActive, "Only active physicians allowed");
        _;
    }

    modifier onlyExpert() {
        require(userProfiles[msg.sender].role == Role.Expert && userProfiles[msg.sender].isActive, "Only active experts allowed");
        _;
    }

    modifier onlyAdmin() {
        require(userProfiles[msg.sender].role == Role.Admin && userProfiles[msg.sender].isActive, "Only active admin allowed");
        _;
    }

    modifier onlyPatient() {
        require(userProfiles[msg.sender].role == Role.Patient && userProfiles[msg.sender].isActive, "Only active patients allowed");
        _;
    }

    modifier userExists(address user) {
        require(userProfiles[user].role != Role.None, "User does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Set owner as admin
        userProfiles[msg.sender] = UserProfile({
            role: Role.Admin,
            ipfsHash: "",
            isActive: true,
            registeredAt: block.timestamp
        });
        allUsers.push(msg.sender);
        usersByRole[Role.Admin].push(msg.sender);
    }

    // ===================== Core Logic =====================

    function assignRole(
        address user,
        Role role,
        string memory ipfsHash
    ) external onlyAdmin {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Owner role cannot be changed");
        require(userProfiles[user].role == Role.None, "User already has a role");
        require(role != Role.None, "Cannot assign None role");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        userProfiles[user] = UserProfile({
            role: role,
            ipfsHash: ipfsHash,
            isActive: true,
            registeredAt: block.timestamp
        });

        userIPFSHashes[user] = ipfsHash;
        allUsers.push(user);
        usersByRole[role].push(user);

        emit RoleAssigned(user, role, ipfsHash);
    }

    function revokeRole(address user) external onlyAdmin userExists(user) {
        require(user != owner(), "Cannot revoke owner role");
        
        Role oldRole = userProfiles[user].role;
        delete userProfiles[user];
        delete userIPFSHashes[user];
        
        // Remove from usersByRole array
        _removeFromRoleArray(oldRole, user);
        
        emit RoleRevoked(user);
    }

    function changeRole(address user, Role newRole, string memory newIpfsHash) external onlyAdmin userExists(user) {
        require(user != owner(), "Cannot change owner role");
        require(newRole != Role.None, "Invalid role");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");

        Role oldRole = userProfiles[user].role;
        
        // Remove from old role array and add to new role array
        _removeFromRoleArray(oldRole, user);
        usersByRole[newRole].push(user);
        
        userProfiles[user].role = newRole;
        userProfiles[user].ipfsHash = newIpfsHash;
        userIPFSHashes[user] = newIpfsHash;

        emit RoleChanged(user, oldRole, newRole);
    }

    function updateProfile(string memory newIpfsHash) external userExists(msg.sender) {
        require(userProfiles[msg.sender].isActive, "Account is deactivated");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");

        userProfiles[msg.sender].ipfsHash = newIpfsHash;
        userIPFSHashes[msg.sender] = newIpfsHash;
        
        emit ProfileUpdated(msg.sender, newIpfsHash);
    }

    function deactivateUser(address user) external onlyAdmin userExists(user) {
        require(user != owner(), "Cannot deactivate owner");
        require(userProfiles[user].isActive, "User already deactivated");
        
        userProfiles[user].isActive = false;
        emit UserDeactivated(user);
    }

    function reactivateUser(address user) external onlyAdmin userExists(user) {
        require(!userProfiles[user].isActive, "User already active");
        
        userProfiles[user].isActive = true;
        emit UserReactivated(user);
    }

    // ===================== View Functions =====================

    function getRole(address user) external view returns (Role) {
        return userProfiles[user].role;
    }

    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function getUserIPFSHash(address user) external view returns (string memory) {
        return userIPFSHashes[user];
    }

    function isPhysician(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Physician && userProfiles[user].isActive;
    }

    function isExpert(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Expert && userProfiles[user].isActive;
    }

    function isAdmin(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Admin && userProfiles[user].isActive;
    }

    function isPatient(address user) external view returns (bool) {
        return userProfiles[user].role == Role.Patient && userProfiles[user].isActive;
    }

    function isActiveUser(address user) external view returns (bool) {
        return userProfiles[user].role != Role.None && userProfiles[user].isActive;
    }

    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    function getUsersByRole(Role role) external view returns (address[] memory) {
        return usersByRole[role];
    }

    function getUserCount() external view returns (uint256) {
        return allUsers.length;
    }

    function getActiveUserCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allUsers.length; i++) {
            if (userProfiles[allUsers[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    // ===================== Internal Functions =====================

    function _removeFromRoleArray(Role role, address user) internal {
        address[] storage roleArray = usersByRole[role];
        for (uint256 i = 0; i < roleArray.length; i++) {
            if (roleArray[i] == user) {
                roleArray[i] = roleArray[roleArray.length - 1];
                roleArray.pop();
                break;
            }
        }
    }
}
