"use client"

import { useCallback, useEffect, useState } from "react"
import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"
import {
    encryptAndUploadToPinata,
    getAndDecryptFromPinata,
    uploadFileToPinata,
    testPinataConnection,
    type IPFSUserProfile,
    type IPFSMedicalCase,
} from "@/lib/pinata"
import { toast } from "sonner"

// Updated IPFS Storage ABI
const IPFS_STORAGE_ABI = [
    {
        inputs: [
            { name: "user", type: "address" },
            { name: "ipfsHash", type: "string" },
            { name: "role", type: "uint8" },
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
        inputs: [],
        name: "getAllUsers",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "caseId", type: "string" },
            { name: "ipfsHash", type: "string" },
            { name: "physician", type: "address" },
            { name: "specialty", type: "string" },
            { name: "urgency", type: "uint8" },
        ],
        name: "storeCaseData",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "caseId", type: "string" }],
        name: "getCaseDataHash",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
] as const

// Hook for user profiles with Pinata IPFS
export function usePinataUserProfile(address?: `0x${string}`) {
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

    // Fetch profile from Pinata IPFS when hash is available
    useEffect(() => {
        const fetchProfile = async () => {
            if (ipfsHash && typeof ipfsHash === "string" && ipfsHash !== "") {
                setIsLoading(true)
                try {
                    const profileData = await getAndDecryptFromPinata<IPFSUserProfile>(ipfsHash)
                    setProfile(profileData)
                } catch (error) {
                    console.error("Error fetching profile from Pinata:", error)
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

// Hook for storing user profiles to Pinata IPFS
export function useStorePinataUserProfile() {
    const { writeContract, isPending } = useWriteContract()

    const storeProfile = useCallback(
        async (address: `0x${string}`, profileData: IPFSUserProfile) => {
            try {
                // Test Pinata connection first
                const isConnected = await testPinataConnection()
                if (!isConnected) {
                    console.warn("Pinata connection failed, using fallback storage")
                }

                // 1. Encrypt and upload profile to Pinata IPFS
                const ipfsHash = await encryptAndUploadToPinata(profileData, `user-profile-${address}`)

                // 2. Store IPFS hash on blockchain
                await writeContract({
                    address: CONTRACT_ADDRESSES.IPFS_STORAGE,
                    abi: IPFS_STORAGE_ABI,
                    functionName: "storeUserProfile",
                    args: [address, ipfsHash, profileData.role],
                })

                toast.success("User profile stored on IPFS and blockchain!")
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

// Hook for medical cases with Pinata IPFS
export function usePinataMedicalCase(caseId?: string) {
    const [caseData, setCaseData] = useState<IPFSMedicalCase | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Get IPFS hash from blockchain
    const { data: ipfsHash, isLoading: hashLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.IPFS_STORAGE,
        abi: IPFS_STORAGE_ABI,
        functionName: "getCaseDataHash",
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
                    const caseInfo = await getAndDecryptFromPinata<IPFSMedicalCase>(ipfsHash)
                    setCaseData(caseInfo)
                } catch (error) {
                    console.error("Error fetching case from Pinata:", error)
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

// Hook for storing medical cases to Pinata IPFS
export function useStorePinataMedicalCase() {
    const { writeContract, isPending } = useWriteContract()

    const storeCase = useCallback(
        async (caseData: IPFSMedicalCase, physicianAddress: `0x${string}`) => {
            try {
                // 1. Encrypt and upload case to Pinata IPFS
                const ipfsHash = await encryptAndUploadToPinata(caseData, `medical-case-${caseData.title}`)

                // 2. Generate case ID
                const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                // 3. Store IPFS hash on blockchain
                await writeContract({
                    address: CONTRACT_ADDRESSES.IPFS_STORAGE,
                    abi: IPFS_STORAGE_ABI,
                    functionName: "storeCaseData",
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

                toast.success("Medical case stored on IPFS and blockchain!")
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

// Hook for uploading files to Pinata
export function usePinataFileUpload() {
    const [isUploading, setIsUploading] = useState(false)

    const uploadFile = useCallback(async (file: File): Promise<string> => {
        setIsUploading(true)
        try {
            const ipfsHash = await uploadFileToPinata(file)
            toast.success(`File uploaded to IPFS: ${file.name}`)
            return ipfsHash
        } catch (error) {
            console.error("Error uploading file:", error)
            toast.error("Failed to upload file")
            throw error
        } finally {
            setIsUploading(false)
        }
    }, [])

    return {
        uploadFile,
        isUploading,
    }
}

// Hook for getting all users from blockchain
export function useAllPinataUsers() {
    const [users, setUsers] = useState<Array<{ address: string; profile: IPFSUserProfile | null }>>([])
    const [isLoading, setIsLoading] = useState(true)

    // Get all user addresses from blockchain
    const { data: userAddresses, isLoading: addressesLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.IPFS_STORAGE,
        abi: IPFS_STORAGE_ABI,
        functionName: "getAllUsers",
    })

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (userAddresses && Array.isArray(userAddresses)) {
                setIsLoading(true)
                const userProfiles = await Promise.all(
                    userAddresses.map(async (address) => {
                        try {
                            // Get IPFS hash for each user
                            const hashResponse = await fetch("/api/getUserHash", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ address }),
                            })

                            if (hashResponse.ok) {
                                const { hash } = await hashResponse.json()
                                if (hash) {
                                    const profile = await getAndDecryptFromPinata<IPFSUserProfile>(hash)
                                    return { address, profile }
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching profile for ${address}:`, error)
                        }
                        return { address, profile: null }
                    }),
                )
                setUsers(userProfiles)
                setIsLoading(false)
            }
        }

        if (!addressesLoading) {
            fetchAllUsers()
        }
    }, [userAddresses, addressesLoading])

    return {
        users,
        isLoading: isLoading || addressesLoading,
    }
}
