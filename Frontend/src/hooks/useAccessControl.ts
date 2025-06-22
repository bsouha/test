"use client"

import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, ACCESS_CONTROL_ABI } from "@/lib/contracts"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

// Local storage for demo purposes (since contracts aren't deployed)
const USERS_STORAGE_KEY = "medical_dapp_users"

export interface UserProfile {
    role: number
    name: string
    specialty: string
    registeredAt: string
    isActive: boolean
}

function getStoredUsers(): Record<string, UserProfile> {
    if (typeof window === "undefined") return {}
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error("Error reading stored users:", error)
        return {}
    }
}

function storeUser(address: string, userData: UserProfile) {
    if (typeof window === "undefined") return
    try {
        const users = getStoredUsers()
        users[address.toLowerCase()] = userData
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    } catch (error) {
        console.error("Error storing user:", error)
    }
}

export function useUserRole(address?: `0x${string}`) {
    const [localData, setLocalData] = useState<number | null>(null)
    const [isLocalLoading, setIsLocalLoading] = useState(true)
    const [hasErrored, setHasErrored] = useState(false)

    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "getRole",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            retry: false, // Don't retry on error to prevent loops
            refetchOnWindowFocus: false, // Don't refetch on window focus
        },
    })

    useEffect(() => {
        if (address) {
            setIsLocalLoading(true)
            setHasErrored(false)

            try {
                const users = getStoredUsers()
                const userData = users[address.toLowerCase()]

                if (userData) {
                    setLocalData(userData.role)
                } else {
                    // Check hardcoded demo addresses
                    const demoRole = getDemoRole(address)
                    setLocalData(demoRole)
                }
            } catch (err) {
                console.error("Error loading user role:", err)
                setHasErrored(true)
                setLocalData(Role.None)
            }

            setIsLocalLoading(false)
        }
    }, [address])

    // Handle contract errors silently
    useEffect(() => {
        if (error && !hasErrored) {
            console.error("Contract error (expected in demo mode):", error)
            setHasErrored(true)
        }
    }, [error, hasErrored])

    // Return local data if available, otherwise blockchain data
    return {
        data: localData !== null ? localData : data || Role.None,
        isLoading: isLocalLoading || isLoading,
        error: hasErrored ? null : error, // Don't expose errors to prevent toast loops
    }
}

export function useUserProfile(address?: `0x${string}`) {
    const [localData, setLocalData] = useState<[number, string, string] | null>(null)
    const [isLocalLoading, setIsLocalLoading] = useState(true)
    const [hasErrored, setHasErrored] = useState(false)

    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "getUserProfile",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            retry: false,
            refetchOnWindowFocus: false,
        },
    })

    useEffect(() => {
        if (address) {
            setIsLocalLoading(true)
            setHasErrored(false)

            try {
                const users = getStoredUsers()
                const userData = users[address.toLowerCase()]

                if (userData) {
                    setLocalData([userData.role, userData.name, userData.specialty])
                } else {
                    // Check hardcoded demo profiles
                    const demoProfile = getDemoProfile(address)
                    setLocalData(demoProfile)
                }
            } catch (err) {
                console.error("Error loading user profile:", err)
                setHasErrored(true)
                setLocalData(null)
            }

            setIsLocalLoading(false)
        }
    }, [address])

    useEffect(() => {
        if (error && !hasErrored) {
            console.error("Contract error (expected in demo mode):", error)
            setHasErrored(true)
        }
    }, [error, hasErrored])

    return {
        data: localData || data,
        isLoading: isLocalLoading || isLoading,
        error: hasErrored ? null : error,
    }
}

export function useAssignRole() {
    const { writeContract, isPending, error, ...rest } = useWriteContract()

    const assignRole = useCallback(
        async (args: any) => {
            try {
                // Store in local storage for demo
                if (args.args && args.args.length >= 3) {
                    const [address, role, name, specialty] = args.args
                    const userData: UserProfile = {
                        role: Number(role),
                        name,
                        specialty: specialty || "",
                        registeredAt: new Date().toISOString(),
                        isActive: true,
                    }
                    storeUser(address, userData)
                    toast.success(`User ${name} registered successfully!`)
                }

                // Also call the actual contract (even though it's not deployed)
                return writeContract(args)
            } catch (error) {
                console.error("Error assigning role:", error)
                toast.error("Failed to assign role")
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

export function useAllUsers() {
    const [users, setUsers] = useState<Record<string, UserProfile>>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        try {
            const storedUsers = getStoredUsers()
            setUsers(storedUsers)
        } catch (error) {
            console.error("Error loading users:", error)
            setUsers({})
        }
        setIsLoading(false)
    }, [])

    const refreshUsers = useCallback(() => {
        try {
            const storedUsers = getStoredUsers()
            setUsers(storedUsers)
        } catch (error) {
            console.error("Error refreshing users:", error)
        }
    }, [])

    return {
        users,
        isLoading,
        refreshUsers,
        userCount: Object.keys(users).length,
    }
}

function getDemoRole(address: string): number {
    const addr = address.toLowerCase()
    // Your new Ganache admin address
    if (addr === "0xf3bcae9feb97e7223d81b28eb83cedfb1a7e09b0") {
        return Role.Admin
    }
    // Expert address - hardcoded for demo
    if (addr === "0xac4ee0636a03d930cef7ad1567d680d9a0fb294b") {
        return Role.Expert
    }
    // Physician address - hardcoded for demo
    if (addr === "0x5428a3effec1f3f1867cdfcf434c6d97b1c2df2a") {
        return Role.Physician
    }
    return Role.None
}

function getDemoProfile(address: string): [number, string, string] | null {
    const addr = address.toLowerCase()
    // Your new Ganache admin profile
    if (addr === "0xf3bcae9feb97e7223d81b28eb83cedfb1a7e09b0") {
        return [Role.Admin, "Platform Administrator", "System Administration"]
    }
    // Expert profile - hardcoded for demo
    if (addr === "0xac4ee0636a03d930cef7ad1567d680d9a0fb294b") {
        return [Role.Expert, "Dr. Sarah Johnson", "Cardiology"]
    }
    // Physician profile - hardcoded for demo
    if (addr === "0x5428a3effec1f3f1867cdfcf434c6d97b1c2df2a") {
        return [Role.Physician, "Dr. Amira Hassan", "General Medicine"]
    }
    return null
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
