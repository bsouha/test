// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";
import "./IPFSStorage.sol";

contract PatientData is Ownable {
    struct PatientProfile {
        address wallet;
        string ipfsHash; // IPFS hash containing encrypted patient data
        bool consentGiven;
        bool isActive;
        uint256 registeredAt;
        uint256 lastUpdated;
        string[] caseIds; // Cases this patient is associated with
    }

    struct ConsentRecord {
        address patient;
        address physician;
        string caseId;
        bool consentGiven;
        uint256 timestamp;
        string ipfsHash; // IPFS hash of consent document
    }

    // State variables
    mapping(address => PatientProfile) public patientProfiles;
    mapping(string => ConsentRecord) public consentRecords; // caseId => ConsentRecord
    mapping(address => string[]) public patientCases; // patient => caseIds[]
    mapping(address => mapping(address => bool)) public physicianAccess; // patient => physician => hasAccess
    
    address[] public allPatients;
    string[] public allConsentRecords;

    // Contract references
    AccessControl public accessControlContract;
    IPFSStorage public ipfsStorageContract;

    // Events
    event PatientRegistered(
        address indexed patient, 
        string ipfsHash, 
        uint256 timestamp
    );
    
    event PatientDataUpdated(
        address indexed patient, 
        string oldIpfsHash,
        string newIpfsHash, 
        uint256 timestamp
    );
    
    event ConsentGiven(
        address indexed patient,
        address indexed physician,
        string indexed caseId,
        string consentIpfsHash,
        uint256 timestamp
    );
    
    event ConsentRevoked(
        address indexed patient,
        address indexed physician,
        string indexed caseId,
        uint256 timestamp
    );
    
    event PhysicianAccessGranted(
        address indexed patient,
        address indexed physician,
        uint256 timestamp
    );
    
    event PhysicianAccessRevoked(
        address indexed patient,
        address indexed physician,
        uint256 timestamp
    );

    event PatientDeactivated(address indexed patient, string reason);
    event PatientReactivated(address indexed patient);

    // Modifiers
    modifier onlyPatient() {
        require(accessControlContract.isPatient(msg.sender), "Only patients allowed");
        _;
    }

    modifier onlyPhysician() {
        require(accessControlContract.isPhysician(msg.sender), "Only physicians allowed");
        _;
    }

    modifier onlyRegisteredPatient(address patient) {
        require(patientProfiles[patient].wallet != address(0), "Patient not registered");
        require(patientProfiles[patient].isActive, "Patient account deactivated");
        _;
    }

    modifier onlyAuthorizedAccess(address patient) {
        require(
            msg.sender == patient || 
            msg.sender == owner() ||
            (accessControlContract.isPhysician(msg.sender) && physicianAccess[patient][msg.sender]),
            "Not authorized to access patient data"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ===================== Setup Functions =====================

    function setAccessControlAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        accessControlContract = AccessControl(_addr);
    }

    function setIPFSStorageAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        ipfsStorageContract = IPFSStorage(_addr);
    }

    // ===================== Patient Management =====================

    function registerPatient(
        address patientWallet,
        string memory ipfsHash
    ) external onlyOwner {
        require(patientWallet != address(0), "Invalid patient address");
        require(accessControlContract.isPatient(patientWallet), "Address is not a registered patient");
        require(patientProfiles[patientWallet].wallet == address(0), "Patient already registered");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        patientProfiles[patientWallet] = PatientProfile({
            wallet: patientWallet,
            ipfsHash: ipfsHash,
            consentGiven: false,
            isActive: true,
            registeredAt: block.timestamp,
            lastUpdated: block.timestamp,
            caseIds: new string[](0)
        });

        allPatients.push(patientWallet);

        // Store in IPFS Storage contract
        ipfsStorageContract.storePatientData(patientWallet, ipfsHash);

        emit PatientRegistered(patientWallet, ipfsHash, block.timestamp);
    }

    function updatePatientData(
        string memory newIpfsHash
    ) external onlyPatient onlyRegisteredPatient(msg.sender) {
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");

        string memory oldHash = patientProfiles[msg.sender].ipfsHash;
        patientProfiles[msg.sender].ipfsHash = newIpfsHash;
        patientProfiles[msg.sender].lastUpdated = block.timestamp;

        // Update in IPFS Storage contract
        ipfsStorageContract.storePatientData(msg.sender, newIpfsHash);

        emit PatientDataUpdated(msg.sender, oldHash, newIpfsHash, block.timestamp);
    }

    function updatePatientDataByAdmin(
        address patient,
        string memory newIpfsHash
    ) external onlyOwner onlyRegisteredPatient(patient) {
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");

        string memory oldHash = patientProfiles[patient].ipfsHash;
        patientProfiles[patient].ipfsHash = newIpfsHash;
        patientProfiles[patient].lastUpdated = block.timestamp;

        // Update in IPFS Storage contract
        ipfsStorageContract.storePatientData(patient, newIpfsHash);

        emit PatientDataUpdated(patient, oldHash, newIpfsHash, block.timestamp);
    }

    // ===================== Consent Management =====================

    function giveConsentForCase(
        string memory caseId,
        address physician,
        string memory consentIpfsHash
    ) external onlyPatient onlyRegisteredPatient(msg.sender) {
        require(accessControlContract.isPhysician(physician), "Invalid physician address");
        require(bytes(caseId).length > 0, "Case ID cannot be empty");
        require(bytes(consentIpfsHash).length > 0, "Consent IPFS hash cannot be empty");
        require(consentRecords[caseId].patient == address(0), "Consent already exists for this case");

        ConsentRecord memory newConsent = ConsentRecord({
            patient: msg.sender,
            physician: physician,
            caseId: caseId,
            consentGiven: true,
            timestamp: block.timestamp,
            ipfsHash: consentIpfsHash
        });

        consentRecords[caseId] = newConsent;
        allConsentRecords.push(caseId);
        patientProfiles[msg.sender].caseIds.push(caseId);
        patientCases[msg.sender].push(caseId);

        // Grant physician access
        physicianAccess[msg.sender][physician] = true;

        emit ConsentGiven(msg.sender, physician, caseId, consentIpfsHash, block.timestamp);
        emit PhysicianAccessGranted(msg.sender, physician, block.timestamp);
    }

    function revokeConsentForCase(
        string memory caseId
    ) external onlyPatient onlyRegisteredPatient(msg.sender) {
        require(bytes(caseId).length > 0, "Case ID cannot be empty");
        require(consentRecords[caseId].patient == msg.sender, "No consent record found or not authorized");
        require(consentRecords[caseId].consentGiven, "Consent already revoked");

        consentRecords[caseId].consentGiven = false;
        address physician = consentRecords[caseId].physician;

        emit ConsentRevoked(msg.sender, physician, caseId, block.timestamp);
    }

    function grantPhysicianAccess(address physician) external onlyPatient onlyRegisteredPatient(msg.sender) {
        require(accessControlContract.isPhysician(physician), "Invalid physician address");
        require(!physicianAccess[msg.sender][physician], "Access already granted");

        physicianAccess[msg.sender][physician] = true;
        emit PhysicianAccessGranted(msg.sender, physician, block.timestamp);
    }

    function revokePhysicianAccess(address physician) external onlyPatient onlyRegisteredPatient(msg.sender) {
        require(physicianAccess[msg.sender][physician], "Access not granted");

        physicianAccess[msg.sender][physician] = false;
        emit PhysicianAccessRevoked(msg.sender, physician, block.timestamp);
    }

    function updateGlobalConsent(bool consent) external onlyPatient onlyRegisteredPatient(msg.sender) {
        patientProfiles[msg.sender].consentGiven = consent;
        patientProfiles[msg.sender].lastUpdated = block.timestamp;
    }

    // ===================== View Functions =====================

    function getPatientProfile(address patient)
        external
        view
        onlyRegisteredPatient(patient)
        onlyAuthorizedAccess(patient)
        returns (PatientProfile memory)
    {
        return patientProfiles[patient];
    }

    function getPatientIPFSHash(address patient)
        external
        view
        onlyRegisteredPatient(patient)
        onlyAuthorizedAccess(patient)
        returns (string memory)
    {
        return patientProfiles[patient].ipfsHash;
    }

    function getConsentStatus(address patient) external view returns (bool) {
        if (patientProfiles[patient].wallet == address(0)) return false;
        return patientProfiles[patient].consentGiven && patientProfiles[patient].isActive;
    }

    function getConsentForCase(string memory caseId) external view returns (ConsentRecord memory) {
        return consentRecords[caseId];
    }

    function hasConsentForCase(string memory caseId) external view returns (bool) {
        return consentRecords[caseId].consentGiven && 
               patientProfiles[consentRecords[caseId].patient].isActive;
    }

    function hasPhysicianAccess(address patient, address physician) external view returns (bool) {
        return physicianAccess[patient][physician] && 
               patientProfiles[patient].isActive;
    }

    function getPatientCases(address patient) 
        external 
        view 
        onlyRegisteredPatient(patient)
        onlyAuthorizedAccess(patient)
        returns (string[] memory) 
    {
        return patientCases[patient];
    }

    function getAllPatients() external view returns (address[] memory) {
        require(
            msg.sender == owner() || accessControlContract.isAdmin(msg.sender),
            "Only admin can view all patients"
        );
        return allPatients;
    }

    function getActivePatients() external view returns (address[] memory) {
        require(
            msg.sender == owner() || accessControlContract.isAdmin(msg.sender),
            "Only admin can view all patients"
        );

        address[] memory activePatients = new address[](allPatients.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allPatients.length; i++) {
            if (patientProfiles[allPatients[i]].isActive) {
                activePatients[activeCount] = allPatients[i];
                activeCount++;
            }
        }

        // Resize array to actual count
        address[] memory result = new address[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activePatients[i];
        }

        return result;
    }

    function getPatientCount() external view returns (uint256) {
        return allPatients.length;
    }

    function getActivePatientCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allPatients.length; i++) {
            if (patientProfiles[allPatients[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    function getConsentRecordCount() external view returns (uint256) {
        return allConsentRecords.length;
    }

    function isPatientRegistered(address patient) external view returns (bool) {
        return patientProfiles[patient].wallet != address(0);
    }

    function isPatientActive(address patient) external view returns (bool) {
        return patientProfiles[patient].wallet != address(0) && patientProfiles[patient].isActive;
    }

    // ===================== Admin Functions =====================

    function deactivatePatient(address patient, string memory reason) 
        external 
        onlyOwner 
        onlyRegisteredPatient(patient) 
    {
        require(patientProfiles[patient].isActive, "Patient already deactivated");
        
        patientProfiles[patient].isActive = false;
        emit PatientDeactivated(patient, reason);
    }

    function reactivatePatient(address patient) 
        external 
        onlyOwner 
    {
        require(patientProfiles[patient].wallet != address(0), "Patient not registered");
        require(!patientProfiles[patient].isActive, "Patient already active");
        
        patientProfiles[patient].isActive = true;
        emit PatientReactivated(patient);
    }

    function emergencyRevokeConsent(string memory caseId, string memory reason) 
        external 
        onlyOwner 
    {
        require(consentRecords[caseId].patient != address(0), "Consent record not found");
        require(consentRecords[caseId].consentGiven, "Consent already revoked");
        
        address patient = consentRecords[caseId].patient;
        address physician = consentRecords[caseId].physician;
        
        consentRecords[caseId].consentGiven = false;
        emit ConsentRevoked(patient, physician, caseId, block.timestamp);
    }

    function emergencyRevokePhysicianAccess(address patient, address physician, string memory reason) 
        external 
        onlyOwner 
    {
        require(physicianAccess[patient][physician], "Access not granted");
        
        physicianAccess[patient][physician] = false;
        emit PhysicianAccessRevoked(patient, physician, block.timestamp);
    }
}
