// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";

contract MedicalCase is Ownable {
    // ========== STRUCTURES ==========
    struct Case {
        uint caseId;
        string ipfsHash;
        address physician;
        uint expiryTime;
        string category;
        bool isOpen;
        uint timestamp;
        uint[] expertIds;
    }

    // ========== STATE VARIABLES ==========
    Case[] public cases;
    uint public caseCount;
    mapping(uint => Case) public caseById;
    mapping(uint => address) public caseToPatient;

    AccessControl private accessControl;

    // ========== EVENTS ==========
    event CaseSubmitted(
        uint indexed caseId,
        address indexed physician,
        string ipfsHash,
        string category,
        uint timestamp
    );
    event ExpertAssigned(uint indexed caseId, uint indexed expertId);
    event CaseClosed(uint indexed caseId);
    event PatientConsentGiven(uint indexed caseId, address indexed patient);

    // ========== MODIFIERS ==========
    modifier onlyPhysician() {
        require(accessControl.isPhysician(msg.sender), "Only physicians can submit cases");
        _;
    }

    modifier validCaseId(uint _caseId) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor() Ownable(msg.sender) {}

    // ========== EXTERNAL FUNCTIONS ==========
    function setAccessControlAddress(address _addr) external onlyOwner {
        accessControl = AccessControl(_addr);
    }

    function submitCase(
        string memory _ipfsHash,
        string memory _category,
        uint _durationDays
    ) public onlyPhysician {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_durationDays > 0 && _durationDays <= 30, "Invalid duration");

        caseCount++;
        uint expiry = block.timestamp + (_durationDays * 1 days);

        uint[] memory emptyExperts;

        Case memory newCase = Case({
            caseId: caseCount,
            ipfsHash: _ipfsHash,
            physician: msg.sender,
            expiryTime: expiry,
            category: _category,
            isOpen: true,
            timestamp: block.timestamp,
            expertIds: emptyExperts
        });

        cases.push(newCase);
        caseById[caseCount] = newCase;

        emit CaseSubmitted(caseCount, msg.sender, _ipfsHash, _category, block.timestamp);
    }

    function submitCaseWithPatient(
        string memory _ipfsHash,
        string memory _category,
        uint _durationDays,
        address patientAddress
    ) external onlyPhysician {
        require(patientAddress != address(0), "Invalid patient address");
        submitCase(_ipfsHash, _category, _durationDays);
        caseToPatient[caseCount] = patientAddress;
        emit PatientConsentGiven(caseCount, patientAddress);
    }

    function assignExpert(uint _caseId, uint _expertId) external onlyOwner validCaseId(_caseId) {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case is closed");

        // Prevent duplicate expert assignment
        for (uint i = 0; i < c.expertIds.length; i++) {
            require(c.expertIds[i] != _expertId, "Expert already assigned");
        }

        c.expertIds.push(_expertId);
        emit ExpertAssigned(_caseId, _expertId);
    }

    function closeCase(uint _caseId) external onlyOwner validCaseId(_caseId) {
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case already closed");

        c.isOpen = false;
        emit CaseClosed(_caseId);
    }

    function getCase(uint _caseId)
        external
        view
        validCaseId(_caseId)
        returns (
            uint,
            string memory,
            address,
            uint,
            string memory,
            bool,
            uint,
            uint[] memory
        )
    {
        Case memory c = caseById[_caseId];
        return (
            c.caseId,
            c.ipfsHash,
            c.physician,
            c.expiryTime,
            c.category,
            c.isOpen,
            c.timestamp,
            c.expertIds
        );
    }

    function isValidCase(uint _caseId) public view returns (bool) {
        return _caseId > 0 && _caseId <= caseCount;
    }

    function caseId() public view returns (uint) {
        return caseCount;
    }
}
