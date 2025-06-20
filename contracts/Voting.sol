// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAccessControl {
    function isExpert(address account) external view returns (bool);
    function getUserProfile(address user) external view returns (
        uint8 role,
        string memory name,
        string memory specialty
    );
}

interface IMedicalCase {
    function getCase(uint256 caseId) external view returns (
        uint id, // Renamed from `caseId` to avoid conflict
        string memory ipfsHash,
        address physician,
        uint expiryTime,
        string memory category,
        bool isOpen,
        uint timestamp,
        uint[] memory expertIds
    );
}

interface IReputationSystem {
    function getReputation(uint256 expertId) external view returns (uint256);
    function isEligibleForCategory(uint256 expertId, string memory category) external view returns (bool);
}

contract Voting {
    struct Vote {
        bool hasVoted;
        bool approve;
        uint256 weight;
    }

    struct OpinionVote {
        uint256 yesCount;
        uint256 noCount;
        uint256 totalWeight;
        mapping(address => Vote) votes;
        bool finalized;
    }

    // Mapping from caseId → expertId → OpinionVote
    mapping(uint256 => mapping(uint256 => OpinionVote)) public opinionVotes;

    address public accessControlAddress;
    address public medicalCaseAddress;
    address public reputationSystemAddress;

    event VoteCast(
        uint256 indexed caseId,
        uint256 indexed expertId,
        address voter,
        bool approve,
        uint256 weight
    );

    event OpinionFinalized(
        uint256 indexed caseId,
        uint256 indexed expertId,
        uint256 yesCount,
        uint256 noCount,
        uint256 totalWeight,
        bool approved
    );

    modifier onlyQualifiedExpert(uint256 caseId, uint256 expertId, address voter) {
        require(isQualifiedVoter(caseId, expertId, voter), "Only qualified experts can vote");
        _;
    }

    constructor() {}

    function setContracts(
        address _accessControl,
        address _medicalCase,
        address _reputationSystem
    ) external {
        accessControlAddress = _accessControl;
        medicalCaseAddress = _medicalCase;
        reputationSystemAddress = _reputationSystem;
    }

    function castVote(
        uint256 caseId,
        uint256 expertId,
        bool approve
    ) external onlyQualifiedExpert(caseId, expertId, msg.sender) {
        OpinionVote storage voteData = opinionVotes[caseId][expertId];

        require(!voteData.finalized, "Voting already finalized");
        require(!voteData.votes[msg.sender].hasVoted, "Already voted");

        uint256 voterExpertId = getExpertIdFromAddress(msg.sender);
        uint256 weight = IReputationSystem(reputationSystemAddress).getReputation(voterExpertId);

        require(weight > 0, "Invalid voting weight");

        voteData.votes[msg.sender] = Vote({
            hasVoted: true,
            approve: approve,
            weight: weight
        });

        if (approve) {
            voteData.yesCount += weight;
        } else {
            voteData.noCount += weight;
        }

        voteData.totalWeight += weight;

        emit VoteCast(caseId, expertId, msg.sender, approve, weight);
    }

    function finalizeVote(uint256 caseId, uint256 expertId) external {
        OpinionVote storage voteData = opinionVotes[caseId][expertId];
        require(!voteData.finalized, "Already finalized");
        require(voteData.totalWeight > 0, "No votes yet");

        bool approved = voteData.yesCount > (voteData.totalWeight / 2);
        voteData.finalized = true;

        emit OpinionFinalized(
            caseId,
            expertId,
            voteData.yesCount,
            voteData.noCount,
            voteData.totalWeight,
            approved
        );
    }

    function getExpertIdFromAddress(address voter) internal pure returns (uint256) {
        return uint256(uint160(voter));
    }

    function isQualifiedVoter(
        uint256 _caseId,
        uint256,
        address voter
    ) internal view returns (bool) {
        require(IAccessControl(accessControlAddress).isExpert(voter), "Only experts can vote");

        (, , , , string memory caseCategory, , , ) = IMedicalCase(medicalCaseAddress).getCase(_caseId);
        (, , string memory voterSpecialty) = IAccessControl(accessControlAddress).getUserProfile(voter);

        uint256 voterExpertId = getExpertIdFromAddress(voter);
        require(
            IReputationSystem(reputationSystemAddress).isEligibleForCategory(voterExpertId, caseCategory),
            "Expert not eligible for this category"
        );

        return true;
    }
}
