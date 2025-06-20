// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IPFSStorage is Ownable {
    mapping(uint256 => string) private _caseDataHashes;
    mapping(uint256 => string) private _opinionHashes;

    address public medicalCaseContract;
    address public expertOpinionContract;

    event CaseDataStored(uint256 indexed caseId, string ipfsHash);
    event OpinionStored(uint256 indexed opinionId, string ipfsHash);

    modifier onlyAuthorized() {
        require(
            msg.sender == medicalCaseContract || msg.sender == expertOpinionContract,
            "Not authorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setAuthorizedContracts(address _medicalCase, address _expertOpinion) external onlyOwner {
        medicalCaseContract = _medicalCase;
        expertOpinionContract = _expertOpinion;
    }

    function storeCaseData(uint256 caseId, string memory ipfsHash) external onlyAuthorized {
        require(bytes(_caseDataHashes[caseId]).length == 0, "Case data already exists");
        _caseDataHashes[caseId] = ipfsHash;
        emit CaseDataStored(caseId, ipfsHash);
    }

    function storeOpinion(uint256 opinionId, string memory ipfsHash) external onlyAuthorized {
        require(bytes(_opinionHashes[opinionId]).length == 0, "Opinion already exists");
        _opinionHashes[opinionId] = ipfsHash;
        emit OpinionStored(opinionId, ipfsHash);
    }

    function updateCaseData(uint256 caseId, string memory newIpfsHash) external onlyAuthorized {
        require(bytes(_caseDataHashes[caseId]).length != 0, "No existing case data");
        _caseDataHashes[caseId] = newIpfsHash;
        emit CaseDataStored(caseId, newIpfsHash);
    }

    function updateOpinion(uint256 opinionId, string memory newIpfsHash) external onlyAuthorized {
        require(bytes(_opinionHashes[opinionId]).length != 0, "No existing opinion");
        _opinionHashes[opinionId] = newIpfsHash;
        emit OpinionStored(opinionId, newIpfsHash);
    }

    function getCaseDataHash(uint256 caseId) external view returns (string memory) {
        return _caseDataHashes[caseId];
    }

    function getOpinionHash(uint256 opinionId) external view returns (string memory) {
        return _opinionHashes[opinionId];
    }

    function storeBatchCases(uint256[] calldata caseIds, string[] calldata ipfsHashes) external onlyAuthorized {
        require(caseIds.length == ipfsHashes.length, "Length mismatch");
        for (uint256 i = 0; i < caseIds.length; i++) {
            require(bytes(_caseDataHashes[caseIds[i]]).length == 0, "Case already exists");
            _caseDataHashes[caseIds[i]] = ipfsHashes[i];
            emit CaseDataStored(caseIds[i], ipfsHashes[i]);
        }
    }

    function storeBatchOpinions(uint256[] calldata opinionIds, string[] calldata ipfsHashes) external onlyAuthorized {
        require(opinionIds.length == ipfsHashes.length, "Length mismatch");
        for (uint256 i = 0; i < opinionIds.length; i++) {
            require(bytes(_opinionHashes[opinionIds[i]]).length == 0, "Opinion already exists");
            _opinionHashes[opinionIds[i]] = ipfsHashes[i];
            emit OpinionStored(opinionIds[i], ipfsHashes[i]);
        }
    }
}
