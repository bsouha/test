// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationSystem is Ownable(msg.sender) {
    // Mapping from expert ID to reputation score
    mapping(uint256 => uint256) private _reputationScores;

    // Minimum and maximum reputation scores
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;

    // Events
    event ReputationUpdated(uint256 indexed expertId, uint256 newScore);
    event ExpertPenalized(uint256 indexed expertId, uint256 penaltyAmount);
    event ExpertRewarded(uint256 indexed expertId, uint256 rewardAmount);

    /**
     * @dev Initialize reputation for a new expert
     * @param expertId Unique pseudonymous ID of the expert
     * @param initialScore Initial reputation score (should be between 0 and 1000)
     */
    function initializeExpert(uint256 expertId, uint256 initialScore) external onlyOwner {
        require(initialScore <= MAX_REPUTATION, "Initial score too high");
        _reputationScores[expertId] = initialScore;
        emit ReputationUpdated(expertId, initialScore);
    }

    /**
     * @dev Update an expert's reputation score based on opinion quality
     * @param expertId ID of the expert
     * @param delta Change in reputation (positive or negative)
     */
    function updateReputation(uint256 expertId, int256 delta) external onlyOwner {
        uint256 currentScore = _reputationScores[expertId];

        if (delta > 0) {
            uint256 newScore = currentScore + uint256(delta);
            _reputationScores[expertId] = newScore > MAX_REPUTATION ? MAX_REPUTATION : newScore;
            emit ExpertRewarded(expertId, uint256(delta));
        } else if (delta < 0) {
            uint256 deduction = uint256(-delta);
            uint256 newScore = currentScore > deduction ? currentScore - deduction : 0;
            _reputationScores[expertId] = newScore;
            emit ExpertPenalized(expertId, deduction);
        }

        emit ReputationUpdated(expertId, _reputationScores[expertId]);
    }

    /**
     * @dev Get the current reputation score of an expert
     */
    function getReputation(uint256 expertId) external view returns (uint256) {
        return _reputationScores[expertId];
    }

    /**
     * @dev Check if an expert meets the minimum reputation threshold
     */
    function isEligible(uint256 expertId, uint256 minThreshold) external view returns (bool) {
        return _reputationScores[expertId] >= minThreshold;
    }
}