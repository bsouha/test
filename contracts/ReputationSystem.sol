// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationSystem is Ownable {
    mapping(uint256 => uint256) private reputationScores;
    mapping(uint256 => bool) private expertExists;
    mapping(string => uint256) public categoryThresholds;

    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;

    event ReputationInitialized(uint256 indexed expertId, uint256 initialScore);
    event ReputationUpdated(uint256 indexed expertId, uint256 newScore);
    event ExpertPenalized(uint256 indexed expertId, uint256 penaltyAmount);
    event ExpertRewarded(uint256 indexed expertId, uint256 rewardAmount);
    event CategoryThresholdSet(string category, uint256 threshold);

    constructor() Ownable(msg.sender) {}

    // ================== ADMIN FUNCTIONS ==================

    function initializeExpert(uint256 expertId, uint256 initialScore) external onlyOwner {
        require(!expertExists[expertId], "Expert already initialized");
        require(initialScore <= MAX_REPUTATION, "Initial score too high");

        reputationScores[expertId] = initialScore;
        expertExists[expertId] = true;

        emit ReputationInitialized(expertId, initialScore);
    }

    function updateReputation(uint256 expertId, int256 delta) external onlyOwner {
        require(expertExists[expertId], "Expert not initialized");

        uint256 current = reputationScores[expertId];
        uint256 updated;

        if (delta > 0) {
            unchecked {
                updated = current + uint256(delta);
            }
            if (updated > MAX_REPUTATION) {
                updated = MAX_REPUTATION;
            }
            emit ExpertRewarded(expertId, uint256(delta));
        } else if (delta < 0) {
            uint256 deduction = uint256(-delta);
            updated = current > deduction ? current - deduction : MIN_REPUTATION;
            emit ExpertPenalized(expertId, deduction);
        } else {
            updated = current;
        }

        reputationScores[expertId] = updated;
        emit ReputationUpdated(expertId, updated);
    }

    function setCategoryThreshold(string memory category, uint256 threshold) external onlyOwner {
        require(threshold <= MAX_REPUTATION, "Threshold too high");
        categoryThresholds[category] = threshold;
        emit CategoryThresholdSet(category, threshold);
    }

    // ================== VIEW FUNCTIONS ==================

    function getReputation(uint256 expertId) external view returns (uint256) {
        require(expertExists[expertId], "Expert not initialized");
        return reputationScores[expertId];
    }

    function isEligibleForCategory(uint256 expertId, string memory category) external view returns (bool) {
        require(expertExists[expertId], "Expert not initialized");
        return reputationScores[expertId] >= categoryThresholds[category];
    }

    function isExpertInitialized(uint256 expertId) external view returns (bool) {
        return expertExists[expertId];
    }
}
