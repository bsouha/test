// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IPFSStorage is Ownable {
    // Enhanced storage mappings
    mapping(uint256 => string) private _caseDataHashes;
    mapping(uint256 => string) private _opinionHashes;
    mapping(address => string) private _userProfileHashes;
    mapping(address => string) private _patientDataHashes;
    
    // Metadata for tracking
    mapping(uint256 => address) private _caseOwners;
    mapping(uint256 => address) private _opinionOwners;
    mapping(string => uint256) private _hashToCase;
    mapping(string => uint256) private _hashToOpinion;
    
    // Arrays for enumeration
    uint256[] public allCaseIds;
    uint256[] public allOpinionIds;
    address[] public allUserProfiles;
    address[] public allPatientData;

    // Authorized contracts
    address public medicalCaseContract;
    address public expertOpinionContract;
    address public accessControlContract;
    address public patientDataContract;

    // Events
    event CaseDataStored(uint256 indexed caseId, string ipfsHash, address indexed physician);
    event OpinionStored(uint256 indexed opinionId, string ipfsHash, address indexed expert);
    event UserProfileStored(address indexed user, string ipfsHash);
    event PatientDataStored(address indexed patient, string ipfsHash);
    event CaseDataUpdated(uint256 indexed caseId, string oldHash, string newHash);
    event OpinionUpdated(uint256 indexed opinionId, string oldHash, string newHash);
    event UserProfileUpdated(address indexed user, string oldHash, string newHash);
    event PatientDataUpdated(address indexed patient, string oldHash, string newHash);

    modifier onlyAuthorizedContract() {
        require(
            msg.sender == medicalCaseContract || 
            msg.sender == expertOpinionContract ||
            msg.sender == accessControlContract ||
            msg.sender == patientDataContract ||
            msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    modifier onlyMedicalCase() {
        require(msg.sender == medicalCaseContract, "Only MedicalCase contract");
        _;
    }

    modifier onlyExpertOpinion() {
        require(msg.sender == expertOpinionContract, "Only ExpertOpinion contract");
        _;
    }

    modifier onlyAccessControl() {
        require(msg.sender == accessControlContract, "Only AccessControl contract");
        _;
    }

    modifier onlyPatientData() {
        require(msg.sender == patientDataContract, "Only PatientData contract");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ===================== Contract Management =====================

    function setAuthorizedContracts(
        address _medicalCase, 
        address _expertOpinion,
        address _accessControl,
        address _patientData
    ) external onlyOwner {
        medicalCaseContract = _medicalCase;
        expertOpinionContract = _expertOpinion;
        accessControlContract = _accessControl;
        patientDataContract = _patientData;
    }

    // ===================== Case Data Functions =====================

    function storeCaseData(uint256 caseId, string memory ipfsHash, address physician) external onlyMedicalCase {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_caseDataHashes[caseId]).length == 0, "Case data already exists");
        
        _caseDataHashes[caseId] = ipfsHash;
        _caseOwners[caseId] = physician;
        _hashToCase[ipfsHash] = caseId;
        allCaseIds.push(caseId);
        
        emit CaseDataStored(caseId, ipfsHash, physician);
    }

    function updateCaseData(uint256 caseId, string memory newIpfsHash) external onlyMedicalCase {
        require(bytes(_caseDataHashes[caseId]).length != 0, "No existing case data");
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        string memory oldHash = _caseDataHashes[caseId];
        _caseDataHashes[caseId] = newIpfsHash;
        
        // Update hash mapping
        delete _hashToCase[oldHash];
        _hashToCase[newIpfsHash] = caseId;
        
        emit CaseDataUpdated(caseId, oldHash, newIpfsHash);
    }

    function getCaseDataHash(uint256 caseId) external view returns (string memory) {
        return _caseDataHashes[caseId];
    }

    function getCaseOwner(uint256 caseId) external view returns (address) {
        return _caseOwners[caseId];
    }

    function getCaseByHash(string memory ipfsHash) external view returns (uint256) {
        return _hashToCase[ipfsHash];
    }

    // ===================== Opinion Functions =====================

    function storeOpinion(uint256 opinionId, string memory ipfsHash, address expert) external onlyExpertOpinion {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_opinionHashes[opinionId]).length == 0, "Opinion already exists");
        
        _opinionHashes[opinionId] = ipfsHash;
        _opinionOwners[opinionId] = expert;
        _hashToOpinion[ipfsHash] = opinionId;
        allOpinionIds.push(opinionId);
        
        emit OpinionStored(opinionId, ipfsHash, expert);
    }

    function updateOpinion(uint256 opinionId, string memory newIpfsHash) external onlyExpertOpinion {
        require(bytes(_opinionHashes[opinionId]).length != 0, "No existing opinion");
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        string memory oldHash = _opinionHashes[opinionId];
        _opinionHashes[opinionId] = newIpfsHash;
        
        // Update hash mapping
        delete _hashToOpinion[oldHash];
        _hashToOpinion[newIpfsHash] = opinionId;
        
        emit OpinionUpdated(opinionId, oldHash, newIpfsHash);
    }

    function getOpinionHash(uint256 opinionId) external view returns (string memory) {
        return _opinionHashes[opinionId];
    }

    function getOpinionOwner(uint256 opinionId) external view returns (address) {
        return _opinionOwners[opinionId];
    }

    function getOpinionByHash(string memory ipfsHash) external view returns (uint256) {
        return _hashToOpinion[ipfsHash];
    }

    // ===================== User Profile Functions =====================

    function storeUserProfile(address user, string memory ipfsHash) external onlyAccessControl {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        bool isNewUser = bytes(_userProfileHashes[user]).length == 0;
        
        if (isNewUser) {
            allUserProfiles.push(user);
            emit UserProfileStored(user, ipfsHash);
        } else {
            string memory oldHash = _userProfileHashes[user];
            emit UserProfileUpdated(user, oldHash, ipfsHash);
        }
        
        _userProfileHashes[user] = ipfsHash;
    }

    function getUserProfileHash(address user) external view returns (string memory) {
        return _userProfileHashes[user];
    }

    // ===================== Patient Data Functions =====================

    function storePatientData(address patient, string memory ipfsHash) external onlyPatientData {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        bool isNewPatient = bytes(_patientDataHashes[patient]).length == 0;
        
        if (isNewPatient) {
            allPatientData.push(patient);
            emit PatientDataStored(patient, ipfsHash);
        } else {
            string memory oldHash = _patientDataHashes[patient];
            emit PatientDataUpdated(patient, oldHash, ipfsHash);
        }
        
        _patientDataHashes[patient] = ipfsHash;
    }

    function getPatientDataHash(address patient) external view returns (string memory) {
        return _patientDataHashes[patient];
    }

    // ===================== Batch Operations =====================

    function storeBatchCases(
        uint256[] calldata caseIds, 
        string[] calldata ipfsHashes,
        address[] calldata physicians
    ) external onlyMedicalCase {
        require(caseIds.length == ipfsHashes.length && caseIds.length == physicians.length, "Length mismatch");
        
        for (uint256 i = 0; i < caseIds.length; i++) {
            require(bytes(_caseDataHashes[caseIds[i]]).length == 0, "Case already exists");
            require(bytes(ipfsHashes[i]).length > 0, "IPFS hash cannot be empty");
            
            _caseDataHashes[caseIds[i]] = ipfsHashes[i];
            _caseOwners[caseIds[i]] = physicians[i];
            _hashToCase[ipfsHashes[i]] = caseIds[i];
            allCaseIds.push(caseIds[i]);
            
            emit CaseDataStored(caseIds[i], ipfsHashes[i], physicians[i]);
        }
    }

    function storeBatchOpinions(
        uint256[] calldata opinionIds, 
        string[] calldata ipfsHashes,
        address[] calldata experts
    ) external onlyExpertOpinion {
        require(opinionIds.length == ipfsHashes.length && opinionIds.length == experts.length, "Length mismatch");
        
        for (uint256 i = 0; i < opinionIds.length; i++) {
            require(bytes(_opinionHashes[opinionIds[i]]).length == 0, "Opinion already exists");
            require(bytes(ipfsHashes[i]).length > 0, "IPFS hash cannot be empty");
            
            _opinionHashes[opinionIds[i]] = ipfsHashes[i];
            _opinionOwners[opinionIds[i]] = experts[i];
            _hashToOpinion[ipfsHashes[i]] = opinionIds[i];
            allOpinionIds.push(opinionIds[i]);
            
            emit OpinionStored(opinionIds[i], ipfsHashes[i], experts[i]);
        }
    }

    // ===================== View Functions =====================

    function getAllCaseIds() external view returns (uint256[] memory) {
        return allCaseIds;
    }

    function getAllOpinionIds() external view returns (uint256[] memory) {
        return allOpinionIds;
    }

    function getAllUserProfiles() external view returns (address[] memory) {
        return allUserProfiles;
    }

    function getAllPatientData() external view returns (address[] memory) {
        return allPatientData;
    }

    function getCaseCount() external view returns (uint256) {
        return allCaseIds.length;
    }

    function getOpinionCount() external view returns (uint256) {
        return allOpinionIds.length;
    }

    function getUserProfileCount() external view returns (uint256) {
        return allUserProfiles.length;
    }

    function getPatientDataCount() external view returns (uint256) {
        return allPatientData.length;
    }

    // ===================== Emergency Functions =====================

    function emergencyDeleteCaseData(uint256 caseId) external onlyOwner {
        require(bytes(_caseDataHashes[caseId]).length != 0, "Case does not exist");
        
        string memory hash = _caseDataHashes[caseId];
        delete _caseDataHashes[caseId];
        delete _caseOwners[caseId];
        delete _hashToCase[hash];
        
        // Remove from array (expensive operation, use carefully)
        for (uint256 i = 0; i < allCaseIds.length; i++) {
            if (allCaseIds[i] == caseId) {
                allCaseIds[i] = allCaseIds[allCaseIds.length - 1];
                allCaseIds.pop();
                break;
            }
        }
    }

    function emergencyDeleteOpinion(uint256 opinionId) external onlyOwner {
        require(bytes(_opinionHashes[opinionId]).length != 0, "Opinion does not exist");
        
        string memory hash = _opinionHashes[opinionId];
        delete _opinionHashes[opinionId];
        delete _opinionOwners[opinionId];
        delete _hashToOpinion[hash];
        
        // Remove from array (expensive operation, use carefully)
        for (uint256 i = 0; i < allOpinionIds.length; i++) {
            if (allOpinionIds[i] == opinionId) {
                allOpinionIds[i] = allOpinionIds[allOpinionIds.length - 1];
                allOpinionIds.pop();
                break;
            }
        }
    }
}
