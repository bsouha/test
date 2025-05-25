// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ExpertOpinion is Ownable(msg.sender) {
    // ================== EVENTS ======================

    event OpinionSubmitted(
        uint256 indexed caseId,
        uint256 indexed expertId,
        string opinionHash,
        uint256 timestamp
    );

    event OpinionVerified(
        uint256 indexed caseId,
        uint256 indexed expertId,
        bool isValid
    );

    event OpinionDisputed(
        uint256 indexed caseId,
        uint256 indexed challengerId
    );

    // ================ DATA STRUCTURES ===============

    struct ExpertOpinionData {
        uint256 caseId;
        uint256 expertId;
        string opinionHash; // IPFS CID pointing to encrypted opinion
        uint256 timestamp;
        bool verified;
    }

    // ================ STATE VARIABLES ===============

    mapping(uint256 => ExpertOpinionData[]) private _caseOpinions;
    mapping(uint256 => mapping(uint256 => bool)) private _hasOpinion;

    // Optional: store expert ID -> wallet address mapping securely if needed
    mapping(uint256 => address) private _expertWallets;

    // ================ CONTRACT LOGIC ===============

    /**
     * @dev Submit an expert opinion for a given case.
     * @param caseId The ID of the medical case from MedicalCase.sol
     * @param expertId Pseudonymous ID assigned to expert (not wallet address)
     * @param opinionHash IPFS hash pointing to encrypted expert opinion
     */
    function submitOpinion(
        uint256 caseId,
        uint256 expertId,
        string memory opinionHash
    ) external onlyOwnerOrExpert(expertId) {
        require(!_hasOpinion[caseId][expertId], "Opinion already submitted");

        ExpertOpinionData memory newOpinion = ExpertOpinionData({
            caseId: caseId,
            expertId: expertId,
            opinionHash: opinionHash,
            timestamp: block.timestamp,
            verified: false
        });

        _caseOpinions[caseId].push(newOpinion);
        _hasOpinion[caseId][expertId] = true;

        emit OpinionSubmitted(caseId, expertId, opinionHash, block.timestamp);
    }

    /**
     * @dev Verify the validity of an expert opinion (can be triggered by AI module).
     * @param caseId The ID of the medical case
     * @param expertId ID of the expert whose opinion is being verified
     * @param isValid Whether the opinion is valid
     */
    function verifyOpinion(
        uint256 caseId,
        uint256 expertId,
        bool isValid
    ) external onlyOwner {
        ExpertOpinionData[] storage opinions = _caseOpinions[caseId];
        bool found = false;

        for (uint256 i = 0; i < opinions.length; i++) {
            if (opinions[i].expertId == expertId) {
                opinions[i].verified = isValid;
                found = true;
                break;
            }
        }

        require(found, "Opinion not found");

        emit OpinionVerified(caseId, expertId, isValid);
    }

    /**
     * @dev Allows filing a dispute against an expert opinion.
     * @param caseId The ID of the medical case
     * @param expertId ID of the expert whose opinion is disputed
     */
    function disputeOpinion(uint256 caseId, uint256 expertId) external onlyOwner {
        emit OpinionDisputed(caseId, expertId);
    }

    /**
     * @dev Get all opinions for a given case.
     * @param caseId The ID of the medical case
     * @return Array of opinions
     */
    function getOpinionsForCase(uint256 caseId)
        external
        view
        returns (ExpertOpinionData[] memory)
    {
        return _caseOpinions[caseId];
    }

    // ================ MODIFIERS =====================

    modifier onlyOwnerOrExpert(uint256 expertId) {
        require(
            msg.sender == owner() || msg.sender == _expertWallets[expertId],
            "Not authorized"
        );
        _;
    }

    // ================ ADMIN FUNCTIONS ==============

    /**
     * @dev Admin function to associate expert ID with wallet address
     * This helps maintain pseudonymity while still allowing access control
     */
    function registerExpertWallet(uint256 expertId, address wallet) external onlyOwner {
        _expertWallets[expertId] = wallet;
    }
}