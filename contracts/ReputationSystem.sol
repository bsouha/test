// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";

contract ReputationSystem is Ownable {
    struct ExpertReputation {
        uint256 expertId;
        address expertAddress;
        uint256 reputationScore;
        uint256 totalOpinions;
        uint256 verifiedOpinions;
        uint256 disputedOpinions;
        uint256 totalVotes;
        uint256 positiveVotes;
        uint256 lastUpdated;
        bool isActive;
        string[] specialties;
        mapping(string => uint256) categoryScores; // specialty => score
        mapping(string => bool) categoryEligibility; // specialty => eligible
    }

    struct ReputationHistory {
        uint256 timestamp;
        int256 change;
        uint256 newScore;
        string reason;
        address updatedBy;
    }

    // Constants
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant INITIAL_REPUTATION = 100;
    uint256 public constant OPINION_REWARD = 10;
    uint256 public constant VERIFICATION_REWARD = 20;
    uint256 public constant DISPUTE_PENALTY = 30;
    uint256 public constant POSITIVE_VOTE_REWARD = 5;
    uint256 public constant NEGATIVE_VOTE_PENALTY = 3;

    // State variables
    mapping(address => ExpertReputation) public expertReputations;
    mapping(string => uint256) public categoryThresholds;
    mapping(address => ReputationHistory[]) public reputationHistory;
    mapping(address => mapping(string => uint256)) public expertCategoryScores;
    mapping(address => mapping(string => bool)) public expertCategoryEligibility;
    mapping(address => string[]) public expertSpecialties;
    
    address[] public allExperts;
    string[] public allCategories;

    // Contract references
    AccessControl public accessControlContract;

    // Events
    event ExpertInitialized(
        address indexed expert,
        uint256 initialScore,
        string[] specialties
    );

    event ReputationUpdated(
        address indexed expert,
        int256 change,
        uint256 newScore,
        string reason
    );

    event CategoryThresholdSet(
        string indexed category,
        uint256 threshold
    );

    event CategoryEligibilityUpdated(
        address indexed expert,
        string category,
        bool eligible
    );

    event ExpertSpecialtyAdded(
        address indexed expert,
        string specialty
    );

    event ExpertSpecialtyRemoved(
        address indexed expert,
        string specialty
    );

    event ExpertDeactivated(address indexed expert, string reason);
    event ExpertReactivated(address indexed expert);

    // Modifiers
    modifier onlyExpert() {
        require(accessControlContract.isExpert(msg.sender), "Only experts allowed");
        _;
    }

    modifier expertExists(address expert) {
        require(expertReputations[expert].expertAddress != address(0), "Expert not initialized");
        _;
    }

    modifier expertActive(address expert) {
        require(expertReputations[expert].isActive, "Expert is deactivated");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ===================== Setup Functions =====================

    function setAccessControlAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        accessControlContract = AccessControl(_addr);
    }

    // ===================== Expert Management =====================

    function initializeExpert(
        address expertAddress,
        string[] memory specialties,
        uint256 initialScore
    ) external onlyOwner {
        require(expertAddress != address(0), "Invalid expert address");
        require(accessControlContract.isExpert(expertAddress), "Address is not a registered expert");
        require(expertReputations[expertAddress].expertAddress == address(0), "Expert already initialized");
        require(initialScore <= MAX_REPUTATION, "Initial score too high");
        require(specialties.length > 0, "At least one specialty required");

        if (initialScore == 0) {
            initialScore = INITIAL_REPUTATION;
        }

        ExpertReputation storage expert = expertReputations[expertAddress];
        expert.expertAddress = expertAddress;
        expert.reputationScore = initialScore;
        expert.totalOpinions = 0;
        expert.verifiedOpinions = 0;
        expert.disputedOpinions = 0;
        expert.totalVotes = 0;
        expert.positiveVotes = 0;
        expert.lastUpdated = block.timestamp;
        expert.isActive = true;

        // Set specialties
        for (uint256 i = 0; i < specialties.length; i++) {
            expertSpecialties[expertAddress].push(specialties[i]);
            expertCategoryScores[expertAddress][specialties[i]] = initialScore;
            expertCategoryEligibility[expertAddress][specialties[i]] = true;
            expert.categoryScores[specialties[i]] = initialScore;
            expert.categoryEligibility[specialties[i]] = true;
            
            // Add to categories list if not exists
            _addCategoryIfNotExists(specialties[i]);
        }

        allExperts.push(expertAddress);

        // Add to reputation history
        _addReputationHistory(expertAddress, int256(initialScore), initialScore, "Initial reputation", msg.sender);

        emit ExpertInitialized(expertAddress, initialScore, specialties);
    }

    function addExpertSpecialty(address expertAddress, string memory specialty) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
        expertActive(expertAddress) 
    {
        require(bytes(specialty).length > 0, "Specialty cannot be empty");
        require(!expertCategoryEligibility[expertAddress][specialty], "Specialty already added");

        expertSpecialties[expertAddress].push(specialty);
        uint256 currentScore = expertReputations[expertAddress].reputationScore;
        expertCategoryScores[expertAddress][specialty] = currentScore;
        expertCategoryEligibility[expertAddress][specialty] = true;
        expertReputations[expertAddress].categoryScores[specialty] = currentScore;
        expertReputations[expertAddress].categoryEligibility[specialty] = true;

        _addCategoryIfNotExists(specialty);

        emit ExpertSpecialtyAdded(expertAddress, specialty);
    }

    function removeExpertSpecialty(address expertAddress, string memory specialty) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
    {
        require(expertCategoryEligibility[expertAddress][specialty], "Specialty not found");
        require(expertSpecialties[expertAddress].length > 1, "Cannot remove last specialty");

        // Remove from specialties array
        string[] storage specialties = expertSpecialties[expertAddress];
        for (uint256 i = 0; i < specialties.length; i++) {
            if (keccak256(bytes(specialties[i])) == keccak256(bytes(specialty))) {
                specialties[i] = specialties[specialties.length - 1];
                specialties.pop();
                break;
            }
        }

        expertCategoryEligibility[expertAddress][specialty] = false;
        expertReputations[expertAddress].categoryEligibility[specialty] = false;

        emit ExpertSpecialtyRemoved(expertAddress, specialty);
    }

    // ===================== Reputation Updates =====================

    function updateReputationForOpinion(address expertAddress, bool verified) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
        expertActive(expertAddress) 
    {
        ExpertReputation storage expert = expertReputations[expertAddress];
        expert.totalOpinions++;

        int256 change = int256(OPINION_REWARD);
        if (verified) {
            expert.verifiedOpinions++;
            change += int256(VERIFICATION_REWARD);
        }

        _updateReputation(expertAddress, change, "Opinion submission");
    }

    function updateReputationForDispute(address expertAddress) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
        expertActive(expertAddress) 
    {
        ExpertReputation storage expert = expertReputations[expertAddress];
        expert.disputedOpinions++;

        _updateReputation(expertAddress, -int256(DISPUTE_PENALTY), "Opinion disputed");
    }

    function updateReputationForVote(address expertAddress, bool positive) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
        expertActive(expertAddress) 
    {
        ExpertReputation storage expert = expertReputations[expertAddress];
        expert.totalVotes++;

        int256 change;
        if (positive) {
            expert.positiveVotes++;
            change = int256(POSITIVE_VOTE_REWARD);
        } else {
            change = -int256(NEGATIVE_VOTE_PENALTY);
        }

        _updateReputation(expertAddress, change, positive ? "Positive vote received" : "Negative vote received");
    }

    function updateReputationManual(
        address expertAddress, 
        int256 delta, 
        string memory reason
    ) external onlyOwner expertExists(expertAddress) {
        require(bytes(reason).length > 0, "Reason required");
        _updateReputation(expertAddress, delta, reason);
    }

    function _updateReputation(address expertAddress, int256 delta, string memory reason) internal {
        ExpertReputation storage expert = expertReputations[expertAddress];
        uint256 currentScore = expert.reputationScore;
        uint256 newScore;

        if (delta > 0) {
            uint256 increase = uint256(delta);
            newScore = currentScore + increase;
            if (newScore > MAX_REPUTATION) {
                newScore = MAX_REPUTATION;
            }
        } else if (delta < 0) {
            uint256 decrease = uint256(-delta);
            newScore = currentScore > decrease ? currentScore - decrease : MIN_REPUTATION;
        } else {
            newScore = currentScore;
        }

        expert.reputationScore = newScore;
        expert.lastUpdated = block.timestamp;

        // Update category scores proportionally
        string[] memory specialties = expertSpecialties[expertAddress];
        for (uint256 i = 0; i < specialties.length; i++) {
            expertCategoryScores[expertAddress][specialties[i]] = newScore;
            expert.categoryScores[specialties[i]] = newScore;
            
            // Update eligibility based on threshold
            bool eligible = newScore >= categoryThresholds[specialties[i]];
            expertCategoryEligibility[expertAddress][specialties[i]] = eligible;
            expert.categoryEligibility[specialties[i]] = eligible;
            
            if (expertCategoryEligibility[expertAddress][specialties[i]] != eligible) {
                emit CategoryEligibilityUpdated(expertAddress, specialties[i], eligible);
            }
        }

        _addReputationHistory(expertAddress, delta, newScore, reason, msg.sender);

        emit ReputationUpdated(expertAddress, delta, newScore, reason);
    }

    // ===================== Category Management =====================

    function setCategoryThreshold(string memory category, uint256 threshold) external onlyOwner {
        require(bytes(category).length > 0, "Category cannot be empty");
        require(threshold <= MAX_REPUTATION, "Threshold too high");

        categoryThresholds[category] = threshold;
        _addCategoryIfNotExists(category);

        // Update all experts' eligibility for this category
        for (uint256 i = 0; i < allExperts.length; i++) {
            address expertAddr = allExperts[i];
            if (expertCategoryScores[expertAddr][category] > 0) {
                bool eligible = expertCategoryScores[expertAddr][category] >= threshold;
                expertCategoryEligibility[expertAddr][category] = eligible;
                expertReputations[expertAddr].categoryEligibility[category] = eligible;
                emit CategoryEligibilityUpdated(expertAddr, category, eligible);
            }
        }

        emit CategoryThresholdSet(category, threshold);
    }

    function _addCategoryIfNotExists(string memory category) internal {
        for (uint256 i = 0; i < allCategories.length; i++) {
            if (keccak256(bytes(allCategories[i])) == keccak256(bytes(category))) {
                return; // Category already exists
            }
        }
        allCategories.push(category);
    }

    // ===================== View Functions =====================

    function getReputation(address expertAddress) external view returns (uint256) {
        return expertReputations[expertAddress].reputationScore;
    }

    function getExpertStats(address expertAddress) 
        external 
        view 
        expertExists(expertAddress) 
        returns (
            uint256 reputationScore,
            uint256 totalOpinions,
            uint256 verifiedOpinions,
            uint256 disputedOpinions,
            uint256 totalVotes,
            uint256 positiveVotes,
            bool isActive
        ) 
    {
        ExpertReputation storage expert = expertReputations[expertAddress];
        return (
            expert.reputationScore,
            expert.totalOpinions,
            expert.verifiedOpinions,
            expert.disputedOpinions,
            expert.totalVotes,
            expert.positiveVotes,
            expert.isActive
        );
    }

    function isEligibleForCategory(address expertAddress, string memory category) 
        external 
        view 
        returns (bool) 
    {
        if (expertReputations[expertAddress].expertAddress == address(0)) return false;
        if (!expertReputations[expertAddress].isActive) return false;
        return expertCategoryEligibility[expertAddress][category];
    }

    function getCategoryScore(address expertAddress, string memory category) 
        external 
        view 
        returns (uint256) 
    {
        return expertCategoryScores[expertAddress][category];
    }

    function getExpertSpecialties(address expertAddress) 
        external 
        view 
        returns (string[] memory) 
    {
        return expertSpecialties[expertAddress];
    }

    function getReputationHistory(address expertAddress) 
        external 
        view 
        returns (ReputationHistory[] memory) 
    {
        return reputationHistory[expertAddress];
    }

    function getAllExperts() external view returns (address[] memory) {
        return allExperts;
    }

    function getActiveExperts() external view returns (address[] memory) {
        address[] memory activeExperts = new address[](allExperts.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allExperts.length; i++) {
            if (expertReputations[allExperts[i]].isActive) {
                activeExperts[activeCount] = allExperts[i];
                activeCount++;
            }
        }

        // Resize array to actual count
        address[] memory result = new address[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeExperts[i];
        }

        return result;
    }

    function getExpertsByCategory(string memory category) external view returns (address[] memory) {
        address[] memory categoryExperts = new address[](allExperts.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allExperts.length; i++) {
            if (expertCategoryEligibility[allExperts[i]][category] && 
                expertReputations[allExperts[i]].isActive) {
                categoryExperts[count] = allExperts[i];
                count++;
            }
        }

        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = categoryExperts[i];
        }

        return result;
    }

    function getTopExperts(uint256 limit) external view returns (address[] memory) {
        require(limit > 0 && limit <= allExperts.length, "Invalid limit");

        // Simple bubble sort for demonstration (use more efficient sorting in production)
        address[] memory sortedExperts = new address[](allExperts.length);
        uint256 activeCount = 0;

        // Get active experts
        for (uint256 i = 0; i < allExperts.length; i++) {
            if (expertReputations[allExperts[i]].isActive) {
                sortedExperts[activeCount] = allExperts[i];
                activeCount++;
            }
        }

        // Sort by reputation (bubble sort)
        for (uint256 i = 0; i < activeCount - 1; i++) {
            for (uint256 j = 0; j < activeCount - i - 1; j++) {
                if (expertReputations[sortedExperts[j]].reputationScore < 
                    expertReputations[sortedExperts[j + 1]].reputationScore) {
                    address temp = sortedExperts[j];
                    sortedExperts[j] = sortedExperts[j + 1];
                    sortedExperts[j + 1] = temp;
                }
            }
        }

        // Return top experts up to limit
        uint256 resultSize = limit < activeCount ? limit : activeCount;
        address[] memory result = new address[](resultSize);
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = sortedExperts[i];
        }

        return result;
    }

    function getAllCategories() external view returns (string[] memory) {
        return allCategories;
    }

    function getCategoryThreshold(string memory category) external view returns (uint256) {
        return categoryThresholds[category];
    }

    function isExpertInitialized(address expertAddress) external view returns (bool) {
        return expertReputations[expertAddress].expertAddress != address(0);
    }

    function isExpertActive(address expertAddress) external view returns (bool) {
        return expertReputations[expertAddress].expertAddress != address(0) && 
               expertReputations[expertAddress].isActive;
    }

    function getExpertCount() external view returns (uint256) {
        return allExperts.length;
    }

    function getActiveExpertCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allExperts.length; i++) {
            if (expertReputations[allExperts[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    // ===================== Admin Functions =====================

    function deactivateExpert(address expertAddress, string memory reason) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
    {
        require(expertReputations[expertAddress].isActive, "Expert already deactivated");
        
        expertReputations[expertAddress].isActive = false;
        emit ExpertDeactivated(expertAddress, reason);
    }

    function reactivateExpert(address expertAddress) 
        external 
        onlyOwner 
        expertExists(expertAddress) 
    {
        require(!expertReputations[expertAddress].isActive, "Expert already active");
        
        expertReputations[expertAddress].isActive = true;
        emit ExpertReactivated(expertAddress);
    }

    // ===================== Internal Functions =====================

    function _addReputationHistory(
        address expertAddress,
        int256 change,
        uint256 newScore,
        string memory reason,
        address updatedBy
    ) internal {
        reputationHistory[expertAddress].push(ReputationHistory({
            timestamp: block.timestamp,
            change: change,
            newScore: newScore,
            reason: reason,
            updatedBy: updatedBy
        }));
    }
}
