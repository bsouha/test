// Contract addresses - Updated with your deployed addresses
export const CONTRACT_ADDRESSES = {
    ACCESS_CONTROL: "0x1373030404Ac4651d24E3C7b5eFDD7505c54A35c" as `0x${string}`,
    EXPERT_OPINION: "0x89956ff70422c2E59C73F57B4350944b1580eD72" as `0x${string}`,
    IPFS_STORAGE: "0x1D20603641CdB9a19dA284eeb998eBe49a396B83" as `0x${string}`,
    MEDICAL_CASE: "0x2f9E2b4D21B918C604d34036Fe41d8108aB81A61" as `0x${string}`,
    PATIENT_DATA: "0x18B0eff83525d0E2b25841b1519513f9a5aAC909" as `0x${string}`,
    REPUTATION_SYSTEM: "0x231a3fb40Ca84E59750c844781809407B8Ac5CF5" as `0x${string}`,
    VOTING: "0x7C410B6BEd3cb644DEfBBd45FEDDc9f6352B600b" as `0x${string}`,
}

// Updated Access Control ABI
export const ACCESS_CONTROL_ABI = [
    {
        inputs: [{ name: "user", type: "address" }],
        name: "getRole",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "getUserProfile",
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "role", type: "uint8" },
                    { name: "ipfsHash", type: "string" },
                    { name: "isActive", type: "bool" },
                    { name: "registeredAt", type: "uint256" },
                ],
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "getUserIPFSHash",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "user", type: "address" },
            { name: "role", type: "uint8" },
            { name: "ipfsHash", type: "string" },
        ],
        name: "assignRole",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllUsers",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getUserCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const

// Updated Medical Case ABI
export const MEDICAL_CASE_ABI = [
    {
        inputs: [],
        name: "caseCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "_caseId", type: "uint256" }],
        name: "getCase",
        outputs: [
            { name: "caseId", type: "uint256" },
            { name: "ipfsHash", type: "string" },
            { name: "physician", type: "address" },
            { name: "expiryTime", type: "uint256" },
            { name: "category", type: "string" },
            { name: "specialty", type: "string" },
            { name: "urgency", type: "uint8" },
            { name: "isOpen", type: "bool" },
            { name: "timestamp", type: "uint256" },
            { name: "expertIds", type: "uint256[]" },
            { name: "opinionCount", type: "uint256" },
            { name: "patientAddress", type: "address" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "_ipfsHash", type: "string" },
            { name: "_category", type: "string" },
            { name: "_specialty", type: "string" },
            { name: "_urgency", type: "uint8" },
            { name: "_durationDays", type: "uint256" },
        ],
        name: "submitCase",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "getOpenCases",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "physician", type: "address" }],
        name: "getCasesByPhysician",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "_caseId", type: "uint256" }],
        name: "incrementOpinionCount",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const

// Updated Expert Opinion ABI
export const EXPERT_OPINION_ABI = [
    {
        inputs: [
            { name: "caseId", type: "uint256" },
            { name: "ipfsHash", type: "string" },
            { name: "confidence", type: "uint8" },
        ],
        name: "submitOpinion",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "opinionId", type: "uint256" }],
        name: "getOpinion",
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "opinionId", type: "uint256" },
                    { name: "caseId", type: "uint256" },
                    { name: "expertAddress", type: "address" },
                    { name: "ipfsHash", type: "string" },
                    { name: "confidence", type: "uint8" },
                    { name: "timestamp", type: "uint256" },
                    { name: "verified", type: "bool" },
                    { name: "isActive", type: "bool" },
                ],
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "caseId", type: "uint256" }],
        name: "getOpinionsForCase",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "expert", type: "address" }],
        name: "getOpinionsByExpert",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "opinionId", type: "uint256" }],
        name: "markOpinionApproved",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const

// Updated Reputation System ABI
export const REPUTATION_SYSTEM_ABI = [
    {
        inputs: [{ name: "expertAddress", type: "address" }],
        name: "getReputation",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "expertAddress", type: "address" }],
        name: "getExpertStats",
        outputs: [
            { name: "reputationScore", type: "uint256" },
            { name: "totalOpinions", type: "uint256" },
            { name: "verifiedOpinions", type: "uint256" },
            { name: "disputedOpinions", type: "uint256" },
            { name: "totalVotes", type: "uint256" },
            { name: "positiveVotes", type: "uint256" },
            { name: "isActive", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "expertAddress", type: "address" },
            { name: "specialties", type: "string[]" },
            { name: "initialScore", type: "uint256" },
        ],
        name: "initializeExpert",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "expertAddress", type: "address" },
            { name: "verified", type: "bool" },
        ],
        name: "updateReputationForOpinion",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "expertAddress", type: "address" },
            { name: "positive", type: "bool" },
        ],
        name: "updateReputationForVote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "expertAddress", type: "address" },
            { name: "category", type: "string" },
        ],
        name: "isEligibleForCategory",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "category", type: "string" }],
        name: "getExpertsByCategory",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllExperts",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "expertAddress", type: "address" }],
        name: "isExpertInitialized",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
] as const

// IPFS Storage ABI (updated)
export const IPFS_STORAGE_ABI = [
    {
        inputs: [
            { name: "user", type: "address" },
            { name: "ipfsHash", type: "string" },
        ],
        name: "storeUserProfile",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "getUserProfileHash",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "caseId", type: "uint256" },
            { name: "ipfsHash", type: "string" },
            { name: "physician", type: "address" },
        ],
        name: "storeCaseData",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "caseId", type: "uint256" }],
        name: "getCaseDataHash",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "opinionId", type: "uint256" },
            { name: "ipfsHash", type: "string" },
            { name: "expert", type: "address" },
        ],
        name: "storeOpinion",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "opinionId", type: "uint256" }],
        name: "getOpinionHash",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
] as const

// Role enum mapping
export enum Role {
    None = 0,
    Physician = 1,
    Expert = 2,
    Admin = 3,
    Patient = 4,
}
