// Contract addresses - Updated with your deployed addresses
export const CONTRACT_ADDRESSES = {
    ACCESS_CONTROL: "0xA203A89940C2012715F9e86De994bFeC7c2F6088" as `0x${string}`,
    EXPERT_OPINION: "0x8CAf30FeCF66072109c9933AC600fbf7d5FEb1da" as `0x${string}`,
    IPFS_STORAGE: "0xF354b4777286Ce246d267c434499170AdcF191D9" as `0x${string}`,
    MEDICAL_CASE: "0x8E74A34139Bf4145962A2ba52154aA92BD9502ff" as `0x${string}`,
    PATIENT_DATA: "0x01Fd74D147e98794b8a6ba393bA367EDA8Ca47a9" as `0x${string}`,
    REPUTATION_SYSTEM: "0x754dB5cb559BAAe81c456b1dC286B968123c7ADc" as `0x${string}`,
    VOTING: "0x663d50cdd147268a2778bDB3a4ebEaDd2A6e56e5" as `0x${string}`,
}

// Simplified ABIs for demo - replace with your full contract ABIs
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
            { name: "role", type: "uint8" },
            { name: "name", type: "string" },
            { name: "specialty", type: "string" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "user", type: "address" },
            { name: "role", type: "uint8" },
            { name: "name", type: "string" },
            { name: "specialty", type: "string" },
        ],
        name: "assignRole",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const

export const MEDICAL_CASE_ABI = [
    {
        inputs: [
            { name: "_ipfsHash", type: "string" },
            { name: "_category", type: "string" },
            { name: "_durationDays", type: "uint256" },
        ],
        name: "submitCase",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "_caseId", type: "uint256" }],
        name: "getCase",
        outputs: [
            { name: "", type: "uint256" },
            { name: "", type: "string" },
            { name: "", type: "address" },
            { name: "", type: "uint256" },
            { name: "", type: "string" },
            { name: "", type: "bool" },
            { name: "", type: "uint256" },
            { name: "", type: "uint256[]" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "caseCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const

export const EXPERT_OPINION_ABI = [
    {
        inputs: [
            { name: "caseId", type: "uint256" },
            { name: "expertId", type: "uint256" },
            { name: "opinionHash", type: "string" },
        ],
        name: "submitOpinion",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "caseId", type: "uint256" }],
        name: "getOpinionsForCase",
        outputs: [
            {
                components: [
                    { name: "caseId", type: "uint256" },
                    { name: "expertId", type: "uint256" },
                    { name: "opinionHash", type: "string" },
                    { name: "timestamp", type: "uint256" },
                    { name: "verified", type: "bool" },
                ],
                name: "",
                type: "tuple[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
] as const

export const VOTING_ABI = [
    {
        inputs: [
            { name: "caseId", type: "uint256" },
            { name: "expertId", type: "uint256" },
            { name: "approve", type: "bool" },
        ],
        name: "castVote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const

export const REPUTATION_SYSTEM_ABI = [
    {
        inputs: [{ name: "expertId", type: "uint256" }],
        name: "getReputation",
        outputs: [{ name: "", type: "uint256" }],
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
