"use client"

import { useEffect, useState } from "react"
import { useAllCases, getCaseStats } from "./useMedicalCase"
import { useAllUsers } from "./useAccessControl"

export interface PlatformStats {
    totalUsers: number
    totalCases: number
    totalOpinions: number
    activeExperts: number
    activePhysicians: number
    casesThisMonth: number
    opinionsThisMonth: number
    averageResponseTime: number
    topSpecialties: Array<{ specialty: string; count: number }>
    urgencyDistribution: Record<string, number>
    statusDistribution: Record<string, number>
}

export function usePlatformAnalytics() {
    const { cases, isLoading: casesLoading } = useAllCases()
    const { users, isLoading: usersLoading } = useAllUsers()
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!casesLoading && !usersLoading) {
            setIsLoading(true)

            // Get opinions from localStorage
            const getStoredOpinions = () => {
                if (typeof window === "undefined") return {}
                try {
                    const stored = localStorage.getItem("medical_dapp_opinions")
                    return stored ? JSON.parse(stored) : {}
                } catch {
                    return {}
                }
            }

            const opinions = Object.values(getStoredOpinions())
            const caseStats = getCaseStats(cases)

            // Calculate this month's data
            const thisMonth = new Date()
            thisMonth.setDate(1)
            thisMonth.setHours(0, 0, 0, 0)

            const casesThisMonth = cases.filter((c) => new Date(c.submittedAt) >= thisMonth).length

            const opinionsThisMonth = opinions.filter((o: any) => new Date(o.submittedAt) >= thisMonth).length

            // Calculate top specialties
            const topSpecialties = Object.entries(caseStats.bySpecialty)
                .map(([specialty, count]) => ({ specialty, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            // Count active users by role
            const usersByRole = Object.values(users).reduce(
                (acc, user) => {
                    if (user.role === 1) acc.physicians++
                    if (user.role === 2) acc.experts++
                    return acc
                },
                { physicians: 0, experts: 0 },
            )

            const platformStats: PlatformStats = {
                totalUsers: Object.keys(users).length,
                totalCases: cases.length,
                totalOpinions: opinions.length,
                activeExperts: usersByRole.experts,
                activePhysicians: usersByRole.physicians,
                casesThisMonth,
                opinionsThisMonth,
                averageResponseTime: 24, // Mock data - would be calculated from actual response times
                topSpecialties,
                urgencyDistribution: caseStats.byUrgency,
                statusDistribution: {
                    pending: caseStats.pending,
                    under_review: caseStats.underReview,
                    completed: caseStats.completed,
                },
            }

            setStats(platformStats)
            setIsLoading(false)
        }
    }, [cases, users, casesLoading, usersLoading])

    return {
        stats,
        isLoading,
    }
}
