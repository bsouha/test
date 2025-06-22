// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";
import "./IPFSStorage.sol";

contract MedicalCase is Ownable {
    // ========== STRUCTURES ==========
    struct Case {
        uint256 caseId;
        string ipfsHash;
        address physician;
        uint256 expiryTime;
        string category;
        string specialty;
        uint8 urgency; // 1=low, 2=medium, 3=high, 4=critical
        bool isOpen;
        uint256 timestamp;
        uint256[] expertIds;
        uint256 opinionCount;
        address patientAddress;
    }

    // ========== STATE VARIABLES ==========
    Case[] public cases;
    uint256 public caseCount;
    mapping(uint256 => Case) public caseById;
    mapping(address => uint256[]) public physicianCases;
    mapping(string => uint256[]) public categoryCases;
    mapping(string => uint256[]) public specialtyCases;
    mapping(uint8 => uint256[]) public urgencyCases;

    AccessControl private accessControl;
    IPFSStorage private ipfsStorage;

    // ========== EVENTS ==========
    event CaseSubmitted(
        uint256 indexed caseId,
        address indexed physician,
        string ipfsHash,
        string category,
        string specialty,
        uint8 urgency,
        uint256 timestamp
    );
    event ExpertAssigned(uint256 indexed caseId, uint256 indexed expertId);
    event CaseClosed(uint256 indexed caseId, string reason);
    event CaseUpdated(uint256 indexed caseId, string newIpfsHash);
    event PatientConsentGiven(uint256 indexed caseId, address indexed patient);
    event CaseExpired(uint256 indexed caseId);
    event OpinionCountUpdated(uint256 indexed caseId, uint256 newCount);

    // ========== MODIFIERS ==========
    modifier onlyPhysician() {
        require(accessControl.isPhysician(msg.sender), "Only physicians can perform this action");
        _;
    }

    modifier onlyExpert() {
        require(accessControl.isExpert(msg.sender), "Only experts can perform this action");
        _;
    }

    modifier validCaseId(uint256 _caseId) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        _;
    }

    modifier caseExists(uint256 _caseId) {
        require(caseById[_caseId].caseId != 0, "Case does not exist");
        _;
    }

    modifier onlyCaseOwner(uint256 _caseId) {
        require(caseById[_caseId].physician == msg.sender, "Only case owner can perform this action");
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor() Ownable(msg.sender) {}

    // ========== SETUP FUNCTIONS ==========
    function setAccessControlAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        accessControl = AccessControl(_addr);
    }

    function setIPFSStorageAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        ipfsStorage = IPFSStorage(_addr);
    }

    // ========== CASE MANAGEMENT ==========
    function submitCase(
        string memory _ipfsHash,
        string memory _category,
        string memory _specialty,
        uint8 _urgency,
        uint256 _durationDays
    ) public onlyPhysician returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(bytes(_specialty).length > 0, "Specialty cannot be empty");
        require(_urgency >= 1 && _urgency <= 4, "Invalid urgency level");
        require(_durationDays > 0 && _durationDays <= 30, "Invalid duration");

        caseCount++;
        uint256 expiry = block.timestamp + (_durationDays * 1 days);

        Case memory newCase = Case({
            caseId: caseCount,
            ipfsHash: _ipfsHash,
            physician: msg.sender,
            expiryTime: expiry,
            category: _category,
            specialty: _specialty,
            urgency: _urgency,
            isOpen: true,
            timestamp: block.timestamp,
            expertIds: new uint256[](0),
            opinionCount: 0,
            patientAddress: address(0)
        });

        cases.push(newCase);
        caseById[caseCount] = newCase;
        physicianCases[msg.sender].push(caseCount);
        categoryCases[_category].push(caseCount);
        specialtyCases[_specialty].push(caseCount);
        urgencyCases[_urgency].push(caseCount);

        // Store in IPFS Storage contract
        ipfsStorage.storeCaseData(caseCount, _ipfsHash, msg.sender);

        emit CaseSubmitted(caseCount, msg.sender, _ipfsHash, _category, _specialty, _urgency, block.timestamp);
        
        return caseCount;
    }

    function submitCaseWithPatient(
        string memory _ipfsHash,
        string memory _category,
        string memory _specialty,
        uint8 _urgency,
        uint256 _durationDays,
        address patientAddress
    ) external onlyPhysician returns (uint256) {
        require(patientAddress != address(0), "Invalid patient address");
        require(accessControl.isPatient(patientAddress), "Address is not a registered patient");
        
        uint256 newCaseId = submitCase(_ipfsHash, _category, _specialty, _urgency, _durationDays);
        caseById[newCaseId].patientAddress = patientAddress;
        
        emit PatientConsentGiven(newCaseId, patientAddress);
        return newCaseId;
    }

    function updateCase(uint256 _caseId, string memory _newIpfsHash) 
        external 
        validCaseId(_caseId) 
        onlyCaseOwner(_caseId) 
    {
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");
        require(caseById[_caseId].isOpen, "Case is closed");
        require(block.timestamp < caseById[_caseId].expiryTime, "Case has expired");

        string memory oldHash = caseById[_caseId].ipfsHash;
        caseById[_caseId].ipfsHash = _newIpfsHash;

        // Update in IPFS Storage contract
        ipfsStorage.updateCaseData(_caseId, _newIpfsHash);

        emit CaseUpdated(_caseId, _newIpfsHash);
    }

    function assignExpert(uint256 _caseId, uint256 _expertId) 
        external 
        onlyOwner 
        validCaseId(_caseId) 
        caseExists(_caseId) 
    {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case is closed");
        require(block.timestamp < c.expiryTime, "Case has expired");

        // Prevent duplicate expert assignment
        for (uint256 i = 0; i < c.expertIds.length; i++) {
            require(c.expertIds[i] != _expertId, "Expert already assigned");
        }

        c.expertIds.push(_expertId);
        emit ExpertAssigned(_caseId, _expertId);
    }

    function closeCase(uint256 _caseId, string memory reason) 
        external 
        validCaseId(_caseId) 
        caseExists(_caseId) 
    {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case already closed");
        require(
            msg.sender == owner() || msg.sender == c.physician,
            "Only owner or case physician can close case"
        );

        c.isOpen = false;
        emit CaseClosed(_caseId, reason);
    }

    function incrementOpinionCount(uint256 _caseId) 
        external 
        validCaseId(_caseId) 
        caseExists(_caseId) 
    {
        // This should be called by the ExpertOpinion contract
        require(
            msg.sender == owner() || accessControl.isExpert(msg.sender),
            "Not authorized to update opinion count"
        );

        caseById[_caseId].opinionCount++;
        emit OpinionCountUpdated(_caseId, caseById[_caseId].opinionCount);
    }

    function expireCase(uint256 _caseId) external validCaseId(_caseId) caseExists(_caseId) {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case already closed");
        require(block.timestamp >= c.expiryTime, "Case has not expired yet");

        c.isOpen = false;
        emit CaseExpired(_caseId);
    }

    // ========== VIEW FUNCTIONS ==========
    function getCase(uint256 _caseId)
        external
        view
        validCaseId(_caseId)
        returns (
            uint256 caseId,
            string memory ipfsHash,
            address physician,
            uint256 expiryTime,
            string memory category,
            string memory specialty,
            uint8 urgency,
            bool isOpen,
            uint256 timestamp,
            uint256[] memory expertIds,
            uint256 opinionCount,
            address patientAddress
        )
    {
        Case memory c = caseById[_caseId];
        return (
            c.caseId,
            c.ipfsHash,
            c.physician,
            c.expiryTime,
            c.category,
            c.specialty,
            c.urgency,
            c.isOpen,
            c.timestamp,
            c.expertIds,
            c.opinionCount,
            c.patientAddress
        );
    }

    function getCasesByPhysician(address physician) external view returns (uint256[] memory) {
        return physicianCases[physician];
    }

    function getCasesByCategory(string memory category) external view returns (uint256[] memory) {
        return categoryCases[category];
    }

    function getCasesBySpecialty(string memory specialty) external view returns (uint256[] memory) {
        return specialtyCases[specialty];
    }

    function getCasesByUrgency(uint8 urgency) external view returns (uint256[] memory) {
        require(urgency >= 1 && urgency <= 4, "Invalid urgency level");
        return urgencyCases[urgency];
    }

    function getOpenCases() external view returns (uint256[] memory) {
        uint256[] memory openCases = new uint256[](caseCount);
        uint256 openCount = 0;

        for (uint256 i = 1; i <= caseCount; i++) {
            if (caseById[i].isOpen && block.timestamp < caseById[i].expiryTime) {
                openCases[openCount] = i;
                openCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](openCount);
        for (uint256 i = 0; i < openCount; i++) {
            result[i] = openCases[i];
        }

        return result;
    }

    function getExpiredCases() external view returns (uint256[] memory) {
        uint256[] memory expiredCases = new uint256[](caseCount);
        uint256 expiredCount = 0;

        for (uint256 i = 1; i <= caseCount; i++) {
            if (caseById[i].isOpen && block.timestamp >= caseById[i].expiryTime) {
                expiredCases[expiredCount] = i;
                expiredCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](expiredCount);
        for (uint256 i = 0; i < expiredCount; i++) {
            result[i] = expiredCases[i];
        }

        return result;
    }

    function isValidCase(uint256 _caseId) public view returns (bool) {
        return _caseId > 0 && _caseId <= caseCount && caseById[_caseId].caseId != 0;
    }

    function isCaseOpen(uint256 _caseId) external view returns (bool) {
        if (!isValidCase(_caseId)) return false;
        return caseById[_caseId].isOpen && block.timestamp < caseById[_caseId].expiryTime;
    }

    function getCaseCount() external view returns (uint256) {
        return caseCount;
    }

    function getOpenCaseCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (caseById[i].isOpen && block.timestamp < caseById[i].expiryTime) {
                count++;
            }
        }
        return count;
    }

    function getClosedCaseCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (!caseById[i].isOpen || block.timestamp >= caseById[i].expiryTime) {
                count++;
            }
        }
        return count;
    }

    // ========== EMERGENCY FUNCTIONS ==========
    function emergencyCloseCase(uint256 _caseId, string memory reason) external onlyOwner validCaseId(_caseId) {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case already closed");
        
        c.isOpen = false;
        emit CaseClosed(_caseId, reason);
    }

    function emergencyExtendCase(uint256 _caseId, uint256 additionalDays) external onlyOwner validCaseId(_caseId) {
        require(additionalDays > 0 && additionalDays <= 30, "Invalid extension period");
        
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case is closed");
        
        c.expiryTime += (additionalDays * 1 days);
    }
}
