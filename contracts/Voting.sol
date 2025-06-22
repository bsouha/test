// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";
import "./MedicalCase.sol";
import "./ReputationSystem.sol";
import "./ExpertOpinion.sol";

contract Voting is Ownable {
    struct Vote {
        address voter;
        bool approve;
        uint256 weight;
        uint256 timestamp;
        string reason; // Optional reason for the vote
    }

    struct OpinionVote {
        uint256 opinionId;
        uint256 caseId;
        address expertAddress;
        uint256 yesCount;
        uint256 noCount;
        uint256 totalWeight;
        uint256 voterCount;
        bool finalized;
        bool approved;
        uint256 startTime;
        uint256 endTime;
        mapping(address => Vote) votes;
        address[] voters;
    }

    struct VotingRules {
        uint256 minVoters;
        uint256 votingDuration; // in seconds
        uint256 minReputationToVote;
        uint256 quorumPercentage; // percentage of eligible voters needed
        bool requireSpecialtyMatch;
    }

    // State variables
    mapping(uint256 => OpinionVote) public opinionVotes; // opinionId => OpinionVote
    mapping(address => uint256[]) public voterHistory; // voter => opinionIds[]
    mapping(uint256 => uint256[]) public caseVotes; // caseId => opinionIds[]
    
    uint256[] public allVotingOpinions;
    VotingRules public votingRules;

    // Contract references
    AccessControl public accessControlContract;
    MedicalCase public medicalCaseContract;
    ReputationSystem public reputationSystemContract;
    ExpertOpinion public expertOpinionContract;

    // Events
    event VotingStarted(
        uint256 indexed opinionId,
        uint256 indexed caseId,
        address indexed expert,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed opinionId,
        address indexed voter,
        bool approve,
        uint256 weight,
        string reason
    );

    event VotingFinalized(
        uint256 indexed opinionId,
        uint256 yesCount,
        uint256 noCount,
        uint256 totalWeight,
        bool approved,
        uint256 voterCount
    );

    event VotingRulesUpdated(
        uint256 minVoters,
        uint256 votingDuration,
        uint256 minReputationToVote,
        uint256 quorumPercentage,
        bool requireSpecialtyMatch
    );

    event VotingExtended(uint256 indexed opinionId, uint256 newEndTime);
    event VotingCancelled(uint256 indexed opinionId, string reason);

    // Modifiers
    modifier onlyExpert() {
        require(accessControlContract.isExpert(msg.sender), "Only experts can vote");
        _;
    }

    modifier validOpinion(uint256 opinionId) {
        require(opinionVotes[opinionId].opinionId != 0, "Opinion voting does not exist");
        _;
    }

    modifier votingActive(uint256 opinionId) {
        require(!opinionVotes[opinionId].finalized, "Voting already finalized");
        require(block.timestamp <= opinionVotes[opinionId].endTime, "Voting period ended");
        _;
    }

    modifier hasNotVoted(uint256 opinionId) {
        require(!opinionVotes[opinionId].votes[msg.sender].voter != address(0), "Already voted");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Set default voting rules
        votingRules = VotingRules({
            minVoters: 3,
            votingDuration: 7 days,
            minReputationToVote: 100,
            quorumPercentage: 51,
            requireSpecialtyMatch: true
        });
    }

    // ===================== Setup Functions =====================

    function setContracts(
        address _accessControl,
        address _medicalCase,
        address _reputationSystem,
        address _expertOpinion
    ) external onlyOwner {
        require(_accessControl != address(0), "Invalid AccessControl address");
        require(_medicalCase != address(0), "Invalid MedicalCase address");
        require(_reputationSystem != address(0), "Invalid ReputationSystem address");
        require(_expertOpinion != address(0), "Invalid ExpertOpinion address");

        accessControlContract = AccessControl(_accessControl);
        medicalCaseContract = MedicalCase(_medicalCase);
        reputationSystemContract = ReputationSystem(_reputationSystem);
        expertOpinionContract = ExpertOpinion(_expertOpinion);
    }

    function updateVotingRules(
        uint256 _minVoters,
        uint256 _votingDuration,
        uint256 _minReputationToVote,
        uint256 _quorumPercentage,
        bool _requireSpecialtyMatch
    ) external onlyOwner {
        require(_minVoters > 0, "Minimum voters must be greater than 0");
        require(_votingDuration > 0, "Voting duration must be greater than 0");
        require(_quorumPercentage > 0 && _quorumPercentage <= 100, "Invalid quorum percentage");

        votingRules.minVoters = _minVoters;
        votingRules.votingDuration = _votingDuration;
        votingRules.minReputationToVote = _minReputationToVote;
        votingRules.quorumPercentage = _quorumPercentage;
        votingRules.requireSpecialtyMatch = _requireSpecialtyMatch;

        emit VotingRulesUpdated(
            _minVoters,
            _votingDuration,
            _minReputationToVote,
            _quorumPercentage,
            _requireSpecialtyMatch
        );
    }

    // ===================== Voting Management =====================

    function startVoting(uint256 opinionId) external onlyOwner returns (bool) {
        require(opinionVotes[opinionId].opinionId == 0, "Voting already started for this opinion");

        // Get opinion details from ExpertOpinion contract
        (
            uint256 retrievedOpinionId,
            uint256 caseId,
            address expertAddress,
            string memory ipfsHash,
            uint8 confidence,
            uint256 timestamp,
            bool verified,
            bool isActive
        ) = expertOpinionContract.getOpinion(opinionId);

        require(retrievedOpinionId == opinionId, "Opinion ID mismatch");
        require(isActive, "Opinion is not active");
        require(!verified, "Opinion already verified");

        uint256 endTime = block.timestamp + votingRules.votingDuration;

        OpinionVote storage voteData = opinionVotes[opinionId];
        voteData.opinionId = opinionId;
        voteData.caseId = caseId;
        voteData.expertAddress = expertAddress;
        voteData.yesCount = 0;
        voteData.noCount = 0;
        voteData.totalWeight = 0;
        voteData.voterCount = 0;
        voteData.finalized = false;
        voteData.approved = false;
        voteData.startTime = block.timestamp;
        voteData.endTime = endTime;

        allVotingOpinions.push(opinionId);
        caseVotes[caseId].push(opinionId);

        emit VotingStarted(opinionId, caseId, expertAddress, endTime);
        return true;
    }

    function castVote(
        uint256 opinionId,
        bool approve,
        string memory reason
    ) external onlyExpert validOpinion(opinionId) votingActive(opinionId) hasNotVoted(opinionId) {
        require(_isQualifiedVoter(opinionId, msg.sender), "Not qualified to vote on this opinion");

        uint256 voterReputation = reputationSystemContract.getReputation(msg.sender);
        require(voterReputation >= votingRules.minReputationToVote, "Insufficient reputation to vote");

        OpinionVote storage voteData = opinionVotes[opinionId];

        // Calculate vote weight based on reputation
        uint256 weight = _calculateVoteWeight(voterReputation);

        Vote memory newVote = Vote({
            voter: msg.sender,
            approve: approve,
            weight: weight,
            timestamp: block.timestamp,
            reason: reason
        });

        voteData.votes[msg.sender] = newVote;
        voteData.voters.push(msg.sender);
        voteData.voterCount++;

        if (approve) {
            voteData.yesCount += weight;
        } else {
            voteData.noCount += weight;
        }

        voteData.totalWeight += weight;
        voterHistory[msg.sender].push(opinionId);

        emit VoteCast(opinionId, msg.sender, approve, weight, reason);

        // Auto-finalize if quorum is reached
        if (_hasReachedQuorum(opinionId)) {
            _finalizeVoting(opinionId);
        }
    }

    function finalizeVoting(uint256 opinionId) external validOpinion(opinionId) {
        require(
            msg.sender == owner() || 
            block.timestamp > opinionVotes[opinionId].endTime ||
            _hasReachedQuorum(opinionId),
            "Cannot finalize voting yet"
        );
        require(!opinionVotes[opinionId].finalized, "Voting already finalized");

        _finalizeVoting(opinionId);
    }

    function _finalizeVoting(uint256 opinionId) internal {
        OpinionVote storage voteData = opinionVotes[opinionId];
        
        // Check if minimum voters requirement is met
        require(voteData.voterCount >= votingRules.minVoters, "Minimum voters not reached");

        bool approved = voteData.yesCount > voteData.noCount;
        voteData.approved = approved;
        voteData.finalized = true;

        // Update expert opinion verification status
        if (approved) {
            expertOpinionContract.markOpinionApproved(opinionId);
            // Update expert reputation for positive vote
            reputationSystemContract.updateReputationForVote(voteData.expertAddress, true);
        } else {
            // Update expert reputation for negative vote
            reputationSystemContract.updateReputationForVote(voteData.expertAddress, false);
        }

        // Update voter reputations
        for (uint256 i = 0; i < voteData.voters.length; i++) {
            address voter = voteData.voters[i];
            bool voterApproved = voteData.votes[voter].approve;
            // Reward voters who voted with the majority
            if (voterApproved == approved) {
                reputationSystemContract.updateReputationForVote(voter, true);
            }
        }

        emit VotingFinalized(
            opinionId,
            voteData.yesCount,
            voteData.noCount,
            voteData.totalWeight,
            approved,
            voteData.voterCount
        );
    }

    // ===================== View Functions =====================

    function getVotingDetails(uint256 opinionId) 
        external 
        view 
        validOpinion(opinionId) 
        returns (
            uint256 opinionIdReturn,
            uint256 caseId,
            address expertAddress,
            uint256 yesCount,
            uint256 noCount,
            uint256 totalWeight,
            uint256 voterCount,
            bool finalized,
            bool approved,
            uint256 startTime,
            uint256 endTime
        ) 
    {
        OpinionVote storage voteData = opinionVotes[opinionId];
        return (
            voteData.opinionId,
            voteData.caseId,
            voteData.expertAddress,
            voteData.yesCount,
            voteData.noCount,
            voteData.totalWeight,
            voteData.voterCount,
            voteData.finalized,
            voteData.approved,
            voteData.startTime,
            voteData.endTime
        );
    }

    function getVote(uint256 opinionId, address voter) 
        external 
        view 
        validOpinion(opinionId) 
        returns (Vote memory) 
    {
        return opinionVotes[opinionId].votes[voter];
    }

    function getVoters(uint256 opinionId) 
        external 
        view 
        validOpinion(opinionId) 
        returns (address[] memory) 
    {
        return opinionVotes[opinionId].voters;
    }

    function hasVoted(uint256 opinionId, address voter) external view returns (bool) {
        if (opinionVotes[opinionId].opinionId == 0) return false;
        return opinionVotes[opinionId].votes[voter].voter != address(0);
    }

    function isVotingActive(uint256 opinionId) external view returns (bool) {
        if (opinionVotes[opinionId].opinionId == 0) return false;
        return !opinionVotes[opinionId].finalized && 
               block.timestamp <= opinionVotes[opinionId].endTime;
    }

    function getVoterHistory(address voter) external view returns (uint256[] memory) {
        return voterHistory[voter];
    }

    function getCaseVotes(uint256 caseId) external view returns (uint256[] memory) {
        return caseVotes[caseId];
    }

    function getAllVotingOpinions() external view returns (uint256[] memory) {
        return allVotingOpinions;
    }

    function getActiveVotings() external view returns (uint256[] memory) {
        uint256[] memory activeVotings = new uint256[](allVotingOpinions.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allVotingOpinions.length; i++) {
            uint256 opinionId = allVotingOpinions[i];
            if (!opinionVotes[opinionId].finalized && 
                block.timestamp <= opinionVotes[opinionId].endTime) {
                activeVotings[activeCount] = opinionId;
                activeCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeVotings[i];
        }

        return result;
    }

    function getCompletedVotings() external view returns (uint256[] memory) {
        uint256[] memory completedVotings = new uint256[](allVotingOpinions.length);
        uint256 completedCount = 0;

        for (uint256 i = 0; i < allVotingOpinions.length; i++) {
            uint256 opinionId = allVotingOpinions[i];
            if (opinionVotes[opinionId].finalized) {
                completedVotings[completedCount] = opinionId;
                completedCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](completedCount);
        for (uint256 i = 0; i < completedCount; i++) {
            result[i] = completedVotings[i];
        }

        return result;
    }

    function getVotingRules() external view returns (VotingRules memory) {
        return votingRules;
    }

    function isQualifiedVoter(uint256 opinionId, address voter) external view returns (bool) {
        return _isQualifiedVoter(opinionId, voter);
    }

    // ===================== Internal Functions =====================

    function _isQualifiedVoter(uint256 opinionId, address voter) internal view returns (bool) {
        // Check if voter is an expert
        if (!accessControlContract.isExpert(voter)) return false;

        // Check reputation requirement
        uint256 voterReputation = reputationSystemContract.getReputation(voter);
        if (voterReputation < votingRules.minReputationToVote) return false;

        // Check specialty match if required
        if (votingRules.requireSpecialtyMatch) {
            OpinionVote storage voteData = opinionVotes[opinionId];
            
            // Get case details to check specialty
            (, , , , , string memory specialty, , , , , , , ) = medicalCaseContract.getCase(voteData.caseId);
            
            // Check if voter is eligible for this specialty
            if (!reputationSystemContract.isEligibleForCategory(voter, specialty)) {
                return false;
            }
        }

        // Check if voter is not the opinion author
        if (voter == opinionVotes[opinionId].expertAddress) return false;

        return true;
    }

    function _calculateVoteWeight(uint256 reputation) internal pure returns (uint256) {
        // Weight calculation based on reputation
        // Higher reputation = higher vote weight
        if (reputation >= 800) return 10;
        if (reputation >= 600) return 8;
        if (reputation >= 400) return 6;
        if (reputation >= 200) return 4;
        if (reputation >= 100) return 2;
        return 1;
    }

    function _hasReachedQuorum(uint256 opinionId) internal view returns (bool) {
        OpinionVote storage voteData = opinionVotes[opinionId];
        
        // Calculate total eligible voters for this opinion
        uint256 totalEligibleVoters = _getTotalEligibleVoters(opinionId);
        
        // Check if we have enough voters based on quorum percentage
        uint256 requiredVoters = (totalEligibleVoters * votingRules.quorumPercentage) / 100;
        
        return voteData.voterCount >= requiredVoters && voteData.voterCount >= votingRules.minVoters;
    }

    function _getTotalEligibleVoters(uint256 opinionId) internal view returns (uint256) {
        OpinionVote storage voteData = opinionVotes[opinionId];
        
        // Get case details to check specialty
        (, , , , , string memory specialty, , , , , , , ) = medicalCaseContract.getCase(voteData.caseId);
        
        // Get all experts eligible for this specialty
        address[] memory eligibleExperts = reputationSystemContract.getExpertsByCategory(specialty);
        
        uint256 count = 0;
        for (uint256 i = 0; i < eligibleExperts.length; i++) {
            if (_isQualifiedVoter(opinionId, eligibleExperts[i])) {
                count++;
            }
        }
        
        return count;
    }

    // ===================== Admin Functions =====================

    function extendVoting(uint256 opinionId, uint256 additionalTime) 
        external 
        onlyOwner 
        validOpinion(opinionId) 
    {
        require(!opinionVotes[opinionId].finalized, "Voting already finalized");
        require(additionalTime > 0, "Additional time must be greater than 0");

        opinionVotes[opinionId].endTime += additionalTime;
        emit VotingExtended(opinionId, opinionVotes[opinionId].endTime);
    }

    function cancelVoting(uint256 opinionId, string memory reason) 
        external 
        onlyOwner 
        validOpinion(opinionId) 
    {
        require(!opinionVotes[opinionId].finalized, "Voting already finalized");
        require(bytes(reason).length > 0, "Reason required");

        opinionVotes[opinionId].finalized = true;
        opinionVotes[opinionId].approved = false;

        emit VotingCancelled(opinionId, reason);
    }

    function emergencyFinalizeVoting(uint256 opinionId) 
        external 
        onlyOwner 
        validOpinion(opinionId) 
    {
        require(!opinionVotes[opinionId].finalized, "Voting already finalized");
        
        _finalizeVoting(opinionId);
    }

    // ===================== Statistics Functions =====================

    function getVotingStatistics() 
        external 
        view 
        returns (
            uint256 totalVotings,
            uint256 activeVotings,
            uint256 completedVotings,
            uint256 approvedVotings,
            uint256 rejectedVotings
        ) 
    {
        totalVotings = allVotingOpinions.length;
        activeVotings = 0;
        completedVotings = 0;
        approvedVotings = 0;
        rejectedVotings = 0;

        for (uint256 i = 0; i < allVotingOpinions.length; i++) {
            uint256 opinionId = allVotingOpinions[i];
            OpinionVote storage voteData = opinionVotes[opinionId];

            if (voteData.finalized) {
                completedVotings++;
                if (voteData.approved) {
                    approvedVotings++;
                } else {
                    rejectedVotings++;
                }
            } else if (block.timestamp <= voteData.endTime) {
                activeVotings++;
            }
        }

        return (totalVotings, activeVotings, completedVotings, approvedVotings, rejectedVotings);
    }
}
