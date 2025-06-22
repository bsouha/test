"use client"

import { useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, REPUTATION_SYSTEM_ABI } from "@/lib/contracts"
import { useEffect, useState } from "react"

export interface ExpertReputation {
    expertAddress: string
    expertName: string
    specialty: string
    totalOpinions: number
    averageRating: number
    totalRatings: number
    responseTime: number
    accuracyScore: number
    reputationLevel: "Novice" | "Experienced" | "Expert" | "Master"
    badges: string[]
    joinedAt: string
}

export function useExpertReputation(expertAddress?: string) {
    const [reputation, setReputation] = useState<ExpertReputation | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const {
        data,
        isLoading: contractLoading,
        error,
    } = useReadContract({
        address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
        abi: REPUTATION_SYSTEM_ABI,
        functionName: "getReputation",
        args: expertAddress ? [expertAddress] : undefined,
        query: {
            enabled: !!expertAddress,
        },
    })

    useEffect(() => {
        if (expertAddress) {
            setIsLoading(true)

            // Get expert opinions from localStorage
            const getStoredOpinions = () => {
                if (typeof window === "undefined") return []
                try {
                    const stored = localStorage.getItem("medical_dapp_opinions")
                    const opinions = stored ? JSON.parse(stored) : {}
                    return Object.values(opinions).filter(
                        (opinion: any) => opinion.expertAddress.toLowerCase() === expertAddress.toLowerCase(),
                    )
                } catch {
                    return []
                }
            }

            // Get expert profile from localStorage
            const getExpertProfile = () => {
                if (typeof window === "undefined") return null
                try {
                    const stored = localStorage.getItem("medical_dapp_users")
                    const users = stored ? JSON.parse(stored) : {}
                    return users[expertAddress.toLowerCase()]
                } catch {
                    return null
                }
            }

            const opinions = getStoredOpinions() as any[]
            const profile = getExpertProfile()

            if (profile && profile.role === 2) {
                // Expert role
                const totalRatings = opinions.reduce((sum, opinion) => sum + opinion.peerRatings.length, 0)
                const averageRating =
                    opinions.length > 0 ? opinions.reduce((sum, opinion) => sum + opinion.averageRating, 0) / opinions.length : 0

                // Calculate reputation level based on opinions and ratings
                let reputationLevel: ExpertReputation["reputationLevel"] = "Novice"
                if (opinions.length >= 50 && averageRating >= 4.5) {
                    reputationLevel = "Master"
                } else if (opinions.length >= 20 && averageRating >= 4.0) {
                    reputationLevel = "Expert"
                } else if (opinions.length >= 5 && averageRating >= 3.5) {
                    reputationLevel = "Experienced"
                }

                // Calculate badges
                const badges: string[] = []
                if (opinions.length >= 10) badges.push("Prolific Contributor")
                if (averageRating >= 4.5) badges.push("Highly Rated")
                if (opinions.filter((o) => o.confidence === "high").length >= 5) badges.push("Confident Expert")

                const expertReputation: ExpertReputation = {
                    expertAddress,
                    expertName: profile.name,
                    specialty: profile.specialty,
                    totalOpinions: opinions.length,
                    averageRating,
                    totalRatings,
                    responseTime: 24, // Mock data
                    accuracyScore: Math.min(95, 70 + averageRating * 5), // Mock calculation
                    reputationLevel,
                    badges,
                    joinedAt: profile.registeredAt || new Date().toISOString(),
                }

                setReputation(expertReputation)
            }

            setIsLoading(false)
        }
    }, [expertAddress])

    return {
        data: reputation || data,
        isLoading: isLoading || contractLoading,
        error,
    }
}

export function useTopExperts(limit = 10) {
    const [topExperts, setTopExperts] = useState<ExpertReputation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)

        // Get all experts and their reputations
        const getExpertsWithReputation = () => {
            if (typeof window === "undefined") return []

            try {
                const usersStored = localStorage.getItem("medical_dapp_users")
                const opinionsStored = localStorage.getItem("medical_dapp_opinions")

                if (!usersStored) return []

                const users = JSON.parse(usersStored)
                const opinions = opinionsStored ? JSON.parse(opinionsStored) : {}

                const experts = Object.entries(users)
                    .filter(([_, user]: [string, any]) => user.role === 2)
                    .map(([address, user]: [string, any]) => {
                        const expertOpinions = Object.values(opinions).filter(
                            (opinion: any) => opinion.expertAddress.toLowerCase() === address.toLowerCase(),
                        ) as any[]

                        const totalRatings = expertOpinions.reduce((sum, opinion) => sum + opinion.peerRatings.length, 0)
                        const averageRating =
                            expertOpinions.length > 0
                                ? expertOpinions.reduce((sum, opinion) => sum + opinion.averageRating, 0) / expertOpinions.length
                                : 0

                        let reputationLevel: ExpertReputation["reputationLevel"] = "Novice"
                        if (expertOpinions.length >= 50 && averageRating >= 4.5) {
                            reputationLevel = "Master"
                        } else if (expertOpinions.length >= 20 && averageRating >= 4.0) {
                            reputationLevel = "Expert"
                        } else if (expertOpinions.length >= 5 && averageRating >= 3.5) {
                            reputationLevel = "Experienced"
                        }

                        const badges: string[] = []
                        if (expertOpinions.length >= 10) badges.push("Prolific Contributor")
                        if (averageRating >= 4.5) badges.push("Highly Rated")
                        if (expertOpinions.filter((o) => o.confidence === "high").length >= 5) badges.push("Confident Expert")

                        return {
                            expertAddress: address,
                            expertName: user.name,
                            specialty: user.specialty,
                            totalOpinions: expertOpinions.length,
                            averageRating,
                            totalRatings,
                            responseTime: 24,
                            accuracyScore: Math.min(95, 70 + averageRating * 5),
                            reputationLevel,
                            badges,
                            joinedAt: user.registeredAt || new Date().toISOString(),
                        } as ExpertReputation
                    })

                return experts
                    .sort((a, b) => {
                        // Sort by average rating first, then by total opinions
                        if (b.averageRating !== a.averageRating) {
                            return b.averageRating - a.averageRating
                        }
                        return b.totalOpinions - a.totalOpinions
                    })
                    .slice(0, limit)
            } catch {
                return []
            }
        }

        const experts = getExpertsWithReputation()
        setTopExperts(experts)
        setIsLoading(false)
    }, [limit])

    return {
        experts: topExperts,
        isLoading,
    }
}
