// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IPFSStorage {
    // Mapping from case ID to IPFS hash
    mapping(uint256 => string) private _caseDataHashes;

    // Mapping from expert opinion ID to IPFS hash
    mapping(uint256 => string) private _opinionHashes;

    // Event emitted when data is stored
    event DataStored(uint256 indexed id, string ipfsHash, string dataType);

    /**
     * @dev Store a case's data on IPFS via its hash
     * @param caseId The ID of the medical case
     * @param ipfsHash The IPFS CID where the data is stored
     */
    function storeCaseData(uint256 caseId, string memory ipfsHash) external {
        _caseDataHashes[caseId] = ipfsHash;
        emit DataStored(caseId, ipfsHash, "CaseData");
    }

    /**
     * @dev Store an expert's opinion on IPFS via its hash
     * @param opinionId A unique identifier for the expert opinion
     * @param ipfsHash The IPFS CID where the data is stored
     */
    function storeOpinion(uint256 opinionId, string memory ipfsHash) external {
        _opinionHashes[opinionId] = ipfsHash;
        emit DataStored(opinionId, ipfsHash, "Opinion");
    }

    /**
     * @dev Retrieve the IPFS hash for a medical case
     */
    function getCaseDataHash(uint256 caseId) external view returns (string memory) {
        return _caseDataHashes[caseId];
    }

    /**
     * @dev Retrieve the IPFS hash for an expert opinion
     */
    function getOpinionHash(uint256 opinionId) external view returns (string memory) {
        return _opinionHashes[opinionId];
    }
}