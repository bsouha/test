"use client"

import { useCallback, useEffect, useState } from "react"
import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, IPFS_STORAGE_ABI } from "@/lib/contracts"
import {
    encryptAndUpload,
    getAndDecrypt,
    type IPFSUserProfile,
    type IPFSMedicalCase,
    type IPFSExpertOpinion,
} from "@/lib/ipfs"
import { toast } from "sonner"

// Hook for storing and retrieving user profiles from IPFS
export function useIPFSUserProfile(address?: `0x${string}`) {
    const [profile, setProfile] = useState<IPFSUserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Get IPFS hash from blockchain
    const { data: ipfsHash, isLoading: hashLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.IPFS_STORAGE,
        abi: IPFS_STORAGE_ABI,
        functionName: "getUserProfileHash",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    // Fetch profile from IPFS when hash is available
    useEffect(() => {
        const fetchProfile = async () => {
            if (ipfsHash && typeof ipfsHash === "string" && ipfsHash !== "") {
                setIsLoading(true)
                try {
                    const profileData = await getAndDecrypt<IPFSUserProfile>(ipfsHash)
                    setProfile(profileData)
                } catch (error) {
                    console.error("Error fetching profile from IPFS:", error)
                    setProfile(null)
                }
                setIsLoading(false)
            } else {
                setProfile(null)
                setIsLoading(false)
            }
        }

        if (!hashLoading) {
            fetchProfile()
        }
    }, [ipfsHash, hashLoading])

    return {
        profile,
        isLoading: isLoading || hashLoading,
        ipfsHash,
    }
}

// Hook for storing user profiles to IPFS
export function useStoreUserProfile() {
    const { writeContract, isPending } = useWriteContract()

    const storeProfile = useCallback(
        async (address: `0x${string}`, profileData: IPFSUserProfile, role: number) => {
            try {
                // 1. Encrypt and upload profile to IPFS
                const ipfsHash = await encryptAndUpload(profileData)

                // 2. Store IPFS hash on blockchain
                await writeContract({
                    address: CONTRACT_ADDRESSES.IPFS_STORAGE,
                    abi: IPFS_STORAGE_ABI,
                    functionName: "storeUserProfile",
                    args: [address, ipfsHash, role],
                })

                toast.success("User profile stored successfully!")
                return ipfsHash
            } catch (error) {
                console.error("Error storing user profile:", error)
                toast.error("Failed to store user profile")
                throw error
            }
        },
        [writeContract],
    )

    return {
        storeProfile,
        isPending,
    }
}

// Hook for medical cases
export function useIPFSMedicalCase(caseId?: string) {
    const [caseData, setCaseData] = useState<IPFSMedicalCase | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Get IPFS hash from blockchain
    const { data: ipfsHash, isLoading: hashLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.MEDICAL_CASE,
        abi: [
            {
                inputs: [{ name: "caseId", type: "string" }],
                name: "getCaseIPFSHash",
                outputs: [{ name: "", type: "string" }],
                stateMutability: "view",
                type: "function",
            },
        ],
        functionName: "getCaseIPFSHash",
        args: caseId ? [caseId] : undefined,
        query: {
            enabled: !!caseId,
        },
    })

    useEffect(() => {
        const fetchCase = async () => {
            if (ipfsHash && typeof ipfsHash === "string" && ipfsHash !== "") {
                setIsLoading(true)
                try {
                    const caseInfo = await getAndDecrypt<IPFSMedicalCase>(ipfsHash)
                    setCaseData(caseInfo)
                } catch (error) {
                    console.error("Error fetching case from IPFS:", error)
                    setCaseData(null)
                }
                setIsLoading(false)
            } else {
                setCaseData(null)
                setIsLoading(false)
            }
        }

        if (!hashLoading) {
            fetchCase()
        }
    }, [ipfsHash, hashLoading])

    return {
        caseData,
        isLoading: isLoading || hashLoading,
        ipfsHash,
    }
}

// Hook for storing medical cases
export function useStoreMedicalCase() {
    const { writeContract, isPending } = useWriteContract()

    const storeCase = useCallback(
        async (caseData: IPFSMedicalCase, physicianAddress: `0x${string}`) => {
            try {
                // 1. Encrypt and upload case to IPFS
                const ipfsHash = await encryptAndUpload(caseData)

                // 2. Generate case ID
                const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                // 3. Store IPFS hash on blockchain
                await writeContract({
                    address: CONTRACT_ADDRESSES.MEDICAL_CASE,
                    abi: [
                        {
                            inputs: [
                                { name: "caseId", type: "string" },
                                { name: "ipfsHash", type: "string" },
                                { name: "physician", type: "address" },
                                { name: "specialty", type: "string" },
                                { name: "urgency", type: "uint8" },
                            ],
                            name: "submitCase",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function",
                        },
                    ],
                    functionName: "submitCase",
                    args: [
                        caseId,
                        ipfsHash,
                        physicianAddress,
                        caseData.specialty,
                        caseData.urgency === "critical"
                            ? 4
                            : caseData.urgency === "high"
                                ? 3
                                : caseData.urgency === "medium"
                                    ? 2
                                    : 1,
                    ],
                })

                toast.success("Medical case stored successfully!")
                return { caseId, ipfsHash }
            } catch (error) {
                console.error("Error storing medical case:", error)
                toast.error("Failed to store medical case")
                throw error
            }
        },
        [writeContract],
    )

    return {
        storeCase,
        isPending,
    }
}

// Hook for expert opinions
export function useStoreExpertOpinion() {
    const { writeContract, isPending } = useWriteContract()

    const storeOpinion = useCallback(
        async (caseId: string, opinionData: IPFSExpertOpinion, expertAddress: `0x${string}`) => {
            try {
                // 1. Encrypt and upload opinion to IPFS
                const ipfsHash = await encryptAndUpload(opinionData)

                // 2. Store IPFS hash on blockchain
                await writeContract({
                    address: CONTRACT_ADDRESSES.EXPERT_OPINION,
                    abi: [
                        {
                            inputs: [
                                { name: "caseId", type: "string" },
                                { name: "ipfsHash", type: "string" },
                                { name: "expert", type: "address" },
                                { name: "confidence", type: "uint8" },
                            ],
                            name: "submitOpinion",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function",
                        },
                    ],
                    functionName: "submitOpinion",
                    args: [
                        caseId,
                        ipfsHash,
                        expertAddress,
                        opinionData.confidence === "high" ? 3 : opinionData.confidence === "medium" ? 2 : 1,
                    ],
                })

                toast.success("Expert opinion stored successfully!")
                return ipfsHash
            } catch (error) {
                console.error("Error storing expert opinion:", error)
                toast.error("Failed to store expert opinion")
                throw error
            }
        },
        [writeContract],
    )

    return {
        storeOpinion,
        isPending,
    }
}
