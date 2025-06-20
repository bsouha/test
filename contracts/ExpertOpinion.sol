// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MedicalCase.sol";

contract ExpertOpinion is Ownable {
    struct ExpertOpinionData {
        uint256 caseId;
        uint256 expertId;
        string opinionHash; // IPFS CID to encrypted expert opinion
        uint256 timestamp;
        bool verified;
    }

    mapping(uint256 => ExpertOpinionData[]) private _caseOpinions;
    mapping(uint256 => mapping(uint256 => bool)) private _hasOpinion;
    mapping(uint256 => address) private _expertWallets;

    MedicalCase public medicalCaseContract;
    address public votingContract;

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

    event ExpertWalletRegistered(
        uint256 indexed expertId,
        address wallet
    );

    modifier onlyValidCase(uint256 caseId) {
        (, , , , , bool isOpen, ,) = medicalCaseContract.getCase(caseId);
        require(isOpen, "Case is closed");
        _;
    }

    modifier onlyOwnerOrExpert(uint256 expertId) {
        require(
            msg.sender == owner() || msg.sender == _expertWallets[expertId],
            "Not authorized"
        );
        _;
    }

    modifier onlyVotingContract() {
        require(msg.sender == votingContract, "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setMedicalCaseAddress(address _addr) external onlyOwner {
        medicalCaseContract = MedicalCase(_addr);
    }

    function setVotingAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        votingContract = _addr;
    }

    function registerExpertWallet(uint256 expertId, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        _expertWallets[expertId] = wallet;
        emit ExpertWalletRegistered(expertId, wallet);
    }

    function submitOpinion(
        uint256 caseId,
        uint256 expertId,
        string memory opinionHash
    ) external onlyOwnerOrExpert(expertId) onlyValidCase(caseId) {
        require(_expertWallets[expertId] != address(0), "Unregistered expert");
        require(!_hasOpinion[caseId][expertId], "Opinion already submitted");

        (, , , uint256 expiryTime, , , ,) = medicalCaseContract.getCase(caseId);
        require(block.timestamp < expiryTime, "Case expired");

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

    function verifyOpinion(
        uint256 caseId,
        uint256 expertId,
        bool isValid
    ) public onlyOwnerOrExpert(expertId) {
        ExpertOpinionData[] storage opinions = _caseOpinions[caseId];
        bool found = false;

        for (uint256 i = 0; i < opinions.length; i++) {
            if (opinions[i].expertId == expertId) {
                require(!opinions[i].verified, "Already verified");
                opinions[i].verified = isValid;
                found = true;
                break;
            }
        }

        require(found, "Opinion not found");

        emit OpinionVerified(caseId, expertId, isValid);
    }

    function markOpinionApproved(uint256 caseId, uint256 expertId) external onlyVotingContract {
        verifyOpinion(caseId, expertId, true);
    }

    function disputeOpinion(uint256 caseId, uint256 expertId) external onlyOwner {
        emit OpinionDisputed(caseId, expertId);
    }

    function getOpinionsForCase(uint256 caseId)
        external
        view
        returns (ExpertOpinionData[] memory)
    {
        return _caseOpinions[caseId];
    }

    function hasSubmittedOpinion(uint256 caseId, uint256 expertId)
        external
        view
        returns (bool)
    {
        return _hasOpinion[caseId][expertId];
    }

    function getExpertWallet(uint256 expertId) external view returns (address) {
        return _expertWallets[expertId];
    }
}
