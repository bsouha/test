"use client"

import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, EXPERT_OPINION_ABI } from "@/lib/contracts"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

// Local storage for demo purposes
const OPINIONS_STORAGE_KEY = "medical_dapp_opinions"

export interface ExpertOpinion {
    id: string
    caseId: string
    expertAddress: string
    expertName: string
    expertSpecialty: string
    diagnosis: string
    recommendations: string
    additionalTests: string
    prognosis: string
    confidence: "low" | "medium" | "high"
    submittedAt: string
    status: "draft" | "submitted" | "peer_reviewed"
    peerRatings: number[]
    averageRating: number
    lastUpdated: string
}

export interface OpinionSubmission {
    diagnosis: string
    recommendations: string
    additionalTests: string
    prognosis: string
    confidence: string
}

function getStoredOpinions(): Record<string, ExpertOpinion> {
    if (typeof window === "undefined") return {}
    try {
        const stored = localStorage.getItem(OPINIONS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error("Error reading stored opinions:", error)
        return {}
    }
}

function storeOpinion(opinion: ExpertOpinion) {
    if (typeof window === "undefined") return
    try {
        const opinions = getStoredOpinions()
        opinions[opinion.id] = opinion
        localStorage.setItem(OPINIONS_STORAGE_KEY, JSON.stringify(opinions))
    } catch (error) {
        console.error("Error storing opinion:", error)
    }
}

export function useCaseOpinions(caseId?: string) {
    const [localOpinions, setLocalOpinions] = useState<ExpertOpinion[]>([])
    const [isLocalLoading, setIsLocalLoading] = useState(true)

    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.EXPERT_OPINION,
        abi: EXPERT_OPINION_ABI,
        functionName: "getOpinionsForCase",
        args: caseId ? [BigInt(caseId)] : undefined,
        query: {
            enabled: !!caseId && !isNaN(Number(caseId)),
        },
    })

    useEffect(() => {
        if (caseId) {
            setIsLocalLoading(true)
            const opinions = getStoredOpinions()
            const caseOpinions = Object.values(opinions)
                .filter((opinion) => opinion.caseId === caseId)
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            setLocalOpinions(caseOpinions)
            setIsLocalLoading(false)
        }
    }, [caseId])

    return {
        data: localOpinions.length > 0 ? localOpinions : data,
        isLoading: isLocalLoading || isLoading,
        error,
    }
}

export function useExpertOpinions(expertAddress?: string) {
    const [opinions, setOpinions] = useState<ExpertOpinion[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (expertAddress) {
            setIsLoading(true)
            const storedOpinions = getStoredOpinions()
            const expertOpinions = Object.values(storedOpinions)
                .filter((opinion) => opinion.expertAddress.toLowerCase() === expertAddress.toLowerCase())
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            setOpinions(expertOpinions)
            setIsLoading(false)
        }
    }, [expertAddress])

    return {
        opinions,
        isLoading,
    }
}

export function useSubmitOpinion() {
    const { writeContract, isPending, error, ...rest } = useWriteContract()

    const submitOpinion = useCallback(
        async (
            caseId: string,
            opinionData: OpinionSubmission,
            expertAddress: string,
            expertName: string,
            expertSpecialty: string,
        ) => {
            try {
                // Generate unique opinion ID
                const opinionId = `opinion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                // Create opinion object
                const newOpinion: ExpertOpinion = {
                    id: opinionId,
                    caseId,
                    expertAddress,
                    expertName,
                    expertSpecialty,
                    diagnosis: opinionData.diagnosis,
                    recommendations: opinionData.recommendations,
                    additionalTests: opinionData.additionalTests,
                    prognosis: opinionData.prognosis,
                    confidence: opinionData.confidence as ExpertOpinion["confidence"],
                    submittedAt: new Date().toISOString(),
                    status: "submitted",
                    peerRatings: [],
                    averageRating: 0,
                    lastUpdated: new Date().toISOString(),
                }

                // Store in local storage for demo
                storeOpinion(newOpinion)

                // Update case opinion count
                updateCaseOpinionCount(caseId)

                toast.success("Expert opinion submitted successfully!")

                return { opinionId }
            } catch (error) {
                console.error("Error submitting opinion:", error)
                toast.error("Failed to submit opinion")
                throw error
            }
        },
        [writeContract],
    )

    return {
        submitOpinion,
        isPending,
        error,
        ...rest,
    }
}

function updateCaseOpinionCount(caseId: string) {
    try {
        const casesKey = "medical_dapp_cases"
        const casesStored = localStorage.getItem(casesKey)
        if (casesStored) {
            const cases = JSON.parse(casesStored)
            if (cases[caseId]) {
                cases[caseId].expertOpinions = (cases[caseId].expertOpinions || 0) + 1
                cases[caseId].status = "under_review"
                cases[caseId].lastUpdated = new Date().toISOString()
                localStorage.setItem(casesKey, JSON.stringify(cases))
            }
        }
    } catch (error) {
        console.error("Error updating case opinion count:", error)
    }
}

export function useRateOpinion() {
    const rateOpinion = useCallback((opinionId: string, rating: number) => {
        try {
            const opinions = getStoredOpinions()
            if (opinions[opinionId]) {
                opinions[opinionId].peerRatings.push(rating)
                const ratings = opinions[opinionId].peerRatings
                opinions[opinionId].averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                opinions[opinionId].status = "peer_reviewed"
                opinions[opinionId].lastUpdated = new Date().toISOString()
                localStorage.setItem(OPINIONS_STORAGE_KEY, JSON.stringify(opinions))
                toast.success("Opinion rated successfully!")
            }
        } catch (error) {
            console.error("Error rating opinion:", error)
            toast.error("Failed to rate opinion")
        }
    }, [])

    return { rateOpinion }
}

export function getOpinionStats(opinions: ExpertOpinion[]) {
    const stats = {
        total: opinions.length,
        submitted: opinions.filter((o) => o.status === "submitted").length,
        peerReviewed: opinions.filter((o) => o.status === "peer_reviewed").length,
        averageRating: opinions.length > 0 ? opinions.reduce((sum, o) => sum + o.averageRating, 0) / opinions.length : 0,
        byConfidence: {
            high: opinions.filter((o) => o.confidence === "high").length,
            medium: opinions.filter((o) => o.confidence === "medium").length,
            low: opinions.filter((o) => o.confidence === "low").length,
        },
    }

    return stats
}
