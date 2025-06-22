// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MedicalCase.sol";
import "./AccessControl.sol";
import "./IPFSStorage.sol";

contract ExpertOpinion is Ownable {
    struct ExpertOpinionData {
        uint256 opinionId;
        uint256 caseId;
        address expertAddress;
        string ipfsHash; // IPFS CID to encrypted expert opinion
        uint8 confidence; // 1=low, 2=medium, 3=high
        uint256 timestamp;
        bool verified;
        bool isActive;
    }

    // State variables
    uint256 public opinionCount;
    mapping(uint256 => ExpertOpinionData) public opinions;
    mapping(uint256 => uint256[]) public caseOpinions; // caseId => opinionIds[]
    mapping(address => uint256[]) public expertOpinions; // expertAddress => opinionIds[]
    mapping(uint256 => mapping(address => bool)) public hasSubmittedOpinion; // caseId => expert => bool
    mapping(uint256 => mapping(address => uint256)) public expertOpinionId; // caseId => expert => opinionId

    // Contract references
    MedicalCase public medicalCaseContract;
    AccessControl public accessControlContract;
    IPFSStorage public ipfsStorageContract;
    address public votingContract;

    // Events
    event OpinionSubmitted(
        uint256 indexed opinionId,
        uint256 indexed caseId,
        address indexed expert,
        string ipfsHash,
        uint8 confidence,
        uint256 timestamp
    );

    event OpinionUpdated(
        uint256 indexed opinionId,
        string oldIpfsHash,
        string newIpfsHash
    );

    event OpinionVerified(
        uint256 indexed opinionId,
        uint256 indexed caseId,
        address indexed expert,
        bool isValid
    );

    event OpinionDisputed(
        uint256 indexed opinionId,
        uint256 indexed caseId,
        address indexed challenger
    );

    event OpinionDeactivated(
        uint256 indexed opinionId,
        string reason
    );

    // Modifiers
    modifier onlyValidCase(uint256 caseId) {
        require(medicalCaseContract.isValidCase(caseId), "Invalid case");
        require(medicalCaseContract.isCaseOpen(caseId), "Case is closed or expired");
        _;
    }

    modifier onlyExpert() {
        require(accessControlContract.isExpert(msg.sender), "Only experts allowed");
        _;
    }

    modifier onlyVotingContract() {
        require(msg.sender == votingContract, "Only voting contract allowed");
        _;
    }

    modifier validOpinionId(uint256 opinionId) {
        require(opinionId > 0 && opinionId <= opinionCount, "Invalid opinion ID");
        require(opinions[opinionId].opinionId != 0, "Opinion does not exist");
        _;
    }

    modifier onlyOpinionOwner(uint256 opinionId) {
        require(opinions[opinionId].expertAddress == msg.sender, "Only opinion owner allowed");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ===================== Setup Functions =====================

    function setMedicalCaseAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        medicalCaseContract = MedicalCase(_addr);
    }

    function setAccessControlAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        accessControlContract = AccessControl(_addr);
    }

    function setIPFSStorageAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        ipfsStorageContract = IPFSStorage(_addr);
    }

    function setVotingAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        votingContract = _addr;
    }

    // ===================== Core Functions =====================

    function submitOpinion(
        uint256 caseId,
        string memory ipfsHash,
        uint8 confidence
    ) external onlyExpert onlyValidCase(caseId) returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(confidence >= 1 && confidence <= 3, "Invalid confidence level");
        require(!hasSubmittedOpinion[caseId][msg.sender], "Opinion already submitted for this case");

        // Get case details to verify expiry
        (, , , uint256 expiryTime, , , , , , , , ) = medicalCaseContract.getCase(caseId);
        require(block.timestamp < expiryTime, "Case has expired");

        opinionCount++;

        ExpertOpinionData memory newOpinion = ExpertOpinionData({
            opinionId: opinionCount,
            caseId: caseId,
            expertAddress: msg.sender,
            ipfsHash: ipfsHash,
            confidence: confidence,
            timestamp: block.timestamp,
            verified: false,
            isActive: true
        });

        opinions[opinionCount] = newOpinion;
        caseOpinions[caseId].push(opinionCount);
        expertOpinions[msg.sender].push(opinionCount);
        hasSubmittedOpinion[caseId][msg.sender] = true;
        expertOpinionId[caseId][msg.sender] = opinionCount;

        // Store in IPFS Storage contract
        ipfsStorageContract.storeOpinion(opinionCount, ipfsHash, msg.sender);

        // Update case opinion count
        medicalCaseContract.incrementOpinionCount(caseId);

        emit OpinionSubmitted(opinionCount, caseId, msg.sender, ipfsHash, confidence, block.timestamp);
        
        return opinionCount;
    }

    function updateOpinion(
        uint256 opinionId,
        string memory newIpfsHash,
        uint8 newConfidence
    ) external validOpinionId(opinionId) onlyOpinionOwner(opinionId) {
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        require(newConfidence >= 1 && newConfidence <= 3, "Invalid confidence level");
        require(opinions[opinionId].isActive, "Opinion is deactivated");
        require(!opinions[opinionId].verified, "Cannot update verified opinion");

        ExpertOpinionData storage opinion = opinions[opinionId];
        
        // Check if case is still open
        require(medicalCaseContract.isCaseOpen(opinion.caseId), "Case is closed or expired");

        string memory oldHash = opinion.ipfsHash;
        opinion.ipfsHash = newIpfsHash;
        opinion.confidence = newConfidence;

        // Update in IPFS Storage contract
        ipfsStorageContract.updateOpinion(opinionId, newIpfsHash);

        emit OpinionUpdated(opinionId, oldHash, newIpfsHash);
    }

    function verifyOpinion(
        uint256 opinionId,
        bool isValid
    ) public validOpinionId(opinionId) {
        ExpertOpinionData storage opinion = opinions[opinionId];
        require(opinion.isActive, "Opinion is deactivated");
        require(!opinion.verified, "Opinion already verified");
        require(
            msg.sender == owner() || 
            msg.sender == votingContract || 
            msg.sender == opinion.expertAddress,
            "Not authorized to verify"
        );

        opinion.verified = isValid;

        emit OpinionVerified(opinionId, opinion.caseId, opinion.expertAddress, isValid);
    }

    function markOpinionApproved(uint256 opinionId) external onlyVotingContract validOpinionId(opinionId) {
        verifyOpinion(opinionId, true);
    }

    function disputeOpinion(uint256 opinionId, string memory reason) external validOpinionId(opinionId) {
        require(
            accessControlContract.isExpert(msg.sender) || 
            msg.sender == owner(),
            "Only experts or admin can dispute"
        );
        
        ExpertOpinionData storage opinion = opinions[opinionId];
        require(opinion.isActive, "Opinion is deactivated");

        emit OpinionDisputed(opinionId, opinion.caseId, msg.sender);
    }

    function deactivateOpinion(uint256 opinionId, string memory reason) 
        external 
        onlyOwner 
        validOpinionId(opinionId) 
    {
        require(opinions[opinionId].isActive, "Opinion already deactivated");
        
        opinions[opinionId].isActive = false;
        emit OpinionDeactivated(opinionId, reason);
    }

    // ===================== View Functions =====================

    function getOpinion(uint256 opinionId) 
        external 
        view 
        validOpinionId(opinionId) 
        returns (ExpertOpinionData memory) 
    {
        return opinions[opinionId];
    }

    function getOpinionsForCase(uint256 caseId) external view returns (uint256[] memory) {
        return caseOpinions[caseId];
    }

    function getOpinionsByExpert(address expert) external view returns (uint256[] memory) {
        return expertOpinions[expert];
    }

    function getActiveOpinionsForCase(uint256 caseId) external view returns (uint256[] memory) {
        uint256[] memory allOpinions = caseOpinions[caseId];
        uint256[] memory activeOpinions = new uint256[](allOpinions.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allOpinions.length; i++) {
            if (opinions[allOpinions[i]].isActive) {
                activeOpinions[activeCount] = allOpinions[i];
                activeCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeOpinions[i];
        }

        return result;
    }

    function getVerifiedOpinionsForCase(uint256 caseId) external view returns (uint256[] memory) {
        uint256[] memory allOpinions = caseOpinions[caseId];
        uint256[] memory verifiedOpinions = new uint256[](allOpinions.length);
        uint256 verifiedCount = 0;

        for (uint256 i = 0; i < allOpinions.length; i++) {
            if (opinions[allOpinions[i]].verified && opinions[allOpinions[i]].isActive) {
                verifiedOpinions[verifiedCount] = allOpinions[i];
                verifiedCount++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](verifiedCount);
        for (uint256 i = 0; i < verifiedCount; i++) {
            result[i] = verifiedOpinions[i];
        }

        return result;
    }

    function hasExpertSubmittedOpinion(uint256 caseId, address expert) external view returns (bool) {
        return hasSubmittedOpinion[caseId][expert];
    }

    function getExpertOpinionForCase(uint256 caseId, address expert) external view returns (uint256) {
        require(hasSubmittedOpinion[caseId][expert], "Expert has not submitted opinion for this case");
        return expertOpinionId[caseId][expert];
    }

    function getOpinionCount() external view returns (uint256) {
        return opinionCount;
    }

    function getActiveOpinionCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= opinionCount; i++) {
            if (opinions[i].isActive) {
                count++;
            }
        }
        return count;
    }

    function getVerifiedOpinionCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= opinionCount; i++) {
            if (opinions[i].verified && opinions[i].isActive) {
                count++;
            }
        }
        return count;
    }

    function getOpinionsByConfidence(uint8 confidence) external view returns (uint256[] memory) {
        require(confidence >= 1 && confidence <= 3, "Invalid confidence level");
        
        uint256[] memory result = new uint256[](opinionCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= opinionCount; i++) {
            if (opinions[i].confidence == confidence && opinions[i].isActive) {
                result[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    // ===================== Emergency Functions =====================

    function emergencyDeactivateOpinion(uint256 opinionId, string memory reason) 
        external 
        onlyOwner 
        validOpinionId(opinionId) 
    {
        opinions[opinionId].isActive = false;
        emit OpinionDeactivated(opinionId, reason);
    }

    function emergencyReactivateOpinion(uint256 opinionId) 
        external 
        onlyOwner 
        validOpinionId(opinionId) 
    {
        require(!opinions[opinionId].isActive, "Opinion is already active");
        opinions[opinionId].isActive = true;
    }
}
