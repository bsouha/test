"use client"

import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, ACCESS_CONTROL_ABI } from "@/lib/contracts"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export interface UserProfile {
    role: number
    ipfsHash: string
    isActive: boolean
    registeredAt: bigint
}

export function useUserRole(address?: `0x${string}`) {
    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "getRole",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    return {
        data: data || Role.None,
        isLoading,
        error,
    }
}

export function useUserProfile(address?: `0x${string}`) {
    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "getUserProfile",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    return {
        data,
        isLoading,
        error,
    }
}

export function useAssignRole() {
    const { writeContract, isPending, error, ...rest } = useWriteContract()

    const assignRole = useCallback(
        async (args: any) => {
            try {
                const result = await writeContract(args)
                toast.success("User registered successfully on blockchain!")
                return result
            } catch (error) {
                console.error("Error assigning role:", error)
                toast.error("Failed to assign role on blockchain")
                throw error
            }
        },
        [writeContract],
    )

    return {
        writeContract: assignRole,
        isPending,
        error,
        ...rest,
    }
}

// Updated to use the new contract structure
export function useAllUsers() {
    const [users, setUsers] = useState<Record<string, UserProfile>>({})
    const [isLoading, setIsLoading] = useState(true)

    // Get all user addresses from contract
    const { data: userAddresses, isLoading: addressesLoading } = useReadContract({
        address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "getAllUsers",
    })

    useEffect(() => {
        const fetchUsers = async () => {
            if (userAddresses && Array.isArray(userAddresses)) {
                setIsLoading(true)
                const userMap: Record<string, UserProfile> = {}

                // For demo purposes, create mock user data
                const mockUsers = [
                    {
                        address: "0xf3bcae9feb97e7223d81b28eb83cedfb1a7e09b0",
                        role: Role.Admin,
                        name: "Platform Administrator",
                        specialty: "System Administration",
                    },
                    {
                        address: "0xac4ee0636a03d930cef7ad1567d680d9a0fb294b",
                        role: Role.Expert,
                        name: "Dr. Sarah Johnson",
                        specialty: "Cardiology",
                    },
                    {
                        address: "0x5428a3effec1f3f1867cdfcf434c6d97b1c2df2a",
                        role: Role.Physician,
                        name: "Dr. Amira Hassan",
                        specialty: "General Medicine",
                    },
                ]

                mockUsers.forEach((user) => {
                    userMap[user.address] = {
                        role: user.role,
                        ipfsHash: `mock_hash_${user.address}`,
                        isActive: true,
                        registeredAt: BigInt(Date.now()),
                    }
                })

                setUsers(userMap)
                setIsLoading(false)
            }
        }

        if (!addressesLoading) {
            fetchUsers()
        }
    }, [userAddresses, addressesLoading])

    const refreshUsers = useCallback(() => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
        }, 1000)
    }, [])

    return {
        users,
        isLoading: isLoading || addressesLoading,
        refreshUsers,
        userCount: Object.keys(users).length,
    }
}

export function getRoleName(role: number): string {
    switch (role) {
        case Role.Physician:
            return "Physician"
        case Role.Expert:
            return "Medical Expert"
        case Role.Admin:
            return "Administrator"
        case Role.Patient:
            return "Patient"
        default:
            return "None"
    }
}

export function getRoleColor(role: number): string {
    switch (role) {
        case Role.Physician:
            return "bg-blue-100 text-blue-800 border-blue-200"
        case Role.Expert:
            return "bg-green-100 text-green-800 border-green-200"
        case Role.Admin:
            return "bg-purple-100 text-purple-800 border-purple-200"
        case Role.Patient:
            return "bg-gray-100 text-gray-800 border-gray-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

// Role enum mapping
export enum Role {
    None = 0,
    Physician = 1,
    Expert = 2,
    Admin = 3,
    Patient = 4,
}
