// contracts/MedicalCase.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MedicalCase is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

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

    Case[] public cases;
    uint public caseCount;
    mapping(uint => Case) public caseById;

    EnumerableSet.AddressSet private _physicians;

    event CaseSubmitted(
        uint indexed caseId,
        address indexed physician,
        string ipfsHash,
        string category,
        uint timestamp
    );
    event ExpertAssigned(uint indexed caseId, uint indexed expertId);
    event CaseClosed(uint indexed caseId);

    modifier onlyPhysician() {
        require(EnumerableSet.contains(_physicians, msg.sender), "Caller is not an authorized physician");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function addPhysician(address _physician) external onlyOwner {
        _physicians.add(_physician);
    }

    function removePhysician(address _physician) external onlyOwner {
        _physicians.remove(_physician);
    }

    function submitCase(
        string memory _ipfsHash,
        string memory _category,
        uint _durationDays
    ) external onlyPhysician {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_durationDays > 0 && _durationDays <= 30, "Invalid duration");

        caseCount++;
        uint expiry = block.timestamp + (_durationDays * 1 days);

        Case memory newCase = Case({
            caseId: caseCount,
            ipfsHash: _ipfsHash,
            physician: msg.sender,
            expiryTime: expiry,
            category: _category,
            isOpen: true,
            timestamp: block.timestamp,
            expertIds: new uint[](0)
        });

        cases.push(newCase);
        caseById[caseCount] = newCase;

        emit CaseSubmitted(caseCount, msg.sender, _ipfsHash, _category, block.timestamp);
    }

    function assignExpert(uint _caseId, uint _expertId) external onlyOwner {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case is closed");

        c.expertIds.push(_expertId);
        emit ExpertAssigned(_caseId, _expertId);
    }

    function closeCase(uint _caseId) external onlyOwner {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        Case storage c = caseById[_caseId];
        require(c.isOpen, "Case already closed");

        c.isOpen = false;
        emit CaseClosed(_caseId);
    }

    function getCase(uint _caseId)
        external
        view
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
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
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

    function getAllPhysicians() external view returns (address[] memory) {
        return _physicians.values();
    }

    function getActiveCaseCount() external view returns (uint) {
        uint count = 0;
        for (uint i = 1; i <= caseCount; i++) {
            if (caseById[i].isOpen) count++;
        }
        return count;
    }

    function isValidCase(uint _caseId) public view returns (bool) {
        return _caseId > 0 && _caseId <= caseCount;
    }

    function getExpertCount(uint _caseId) public view returns (uint) {
        return caseById[_caseId].expertIds.length;
    }
}