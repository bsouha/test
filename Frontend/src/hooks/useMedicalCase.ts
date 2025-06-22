"use client"

import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, MEDICAL_CASE_ABI } from "@/lib/contracts"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

// Local storage for demo purposes
const CASES_STORAGE_KEY = "medical_dapp_cases"

export interface MedicalCase {
    id: string
    title: string
    specialty: string
    urgency: "low" | "medium" | "high" | "critical"
    status: "pending" | "under_review" | "completed" | "closed"
    submittedAt: string
    submittedBy: string
    physicianAddress: string
    symptoms: string
    medicalHistory: string
    currentTreatment: string
    specificQuestions: string
    attachments: string[]
    expertOpinions: number
    lastUpdated: string
}

export interface CaseSubmission {
    title: string
    specialty: string
    urgency: string
    symptoms: string
    medicalHistory: string
    currentTreatment: string
    specificQuestions: string
    attachments: File[]
}

function getStoredCases(): Record<string, MedicalCase> {
    if (typeof window === "undefined") return {}
    try {
        const stored = localStorage.getItem(CASES_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error("Error reading stored cases:", error)
        return {}
    }
}

function storeCase(caseData: MedicalCase) {
    if (typeof window === "undefined") return
    try {
        const cases = getStoredCases()
        cases[caseData.id] = caseData
        localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases))
    } catch (error) {
        console.error("Error storing case:", error)
    }
}

export function useCaseCount() {
    const [localCount, setLocalCount] = useState(0)

    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.MEDICAL_CASE,
        abi: MEDICAL_CASE_ABI,
        functionName: "caseCount",
    })

    useEffect(() => {
        const cases = getStoredCases()
        setLocalCount(Object.keys(cases).length)
    }, [])

    // Convert bigint to number safely
    const caseCount = data ? Number(data) : 0

    return {
        data: localCount || caseCount,
        isLoading,
        error,
    }
}

export function useCase(caseId?: string) {
    const [localCase, setLocalCase] = useState<MedicalCase | null>(null)
    const [isLocalLoading, setIsLocalLoading] = useState(true)

    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.MEDICAL_CASE,
        abi: MEDICAL_CASE_ABI,
        functionName: "getCase",
        args: caseId ? [BigInt(caseId)] : undefined,
        query: {
            enabled: !!caseId && !isNaN(Number(caseId)),
        },
    })

    useEffect(() => {
        if (caseId) {
            setIsLocalLoading(true)
            const cases = getStoredCases()
            const caseData = cases[caseId]
            setLocalCase(caseData || null)
            setIsLocalLoading(false)
        }
    }, [caseId])

    return {
        data: localCase || data,
        isLoading: isLocalLoading || isLoading,
        error,
    }
}

export function useAllCases() {
    const [cases, setCases] = useState<MedicalCase[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        const storedCases = getStoredCases()
        const casesArray = Object.values(storedCases).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
        setCases(casesArray)
        setIsLoading(false)
    }, [])

    const refreshCases = useCallback(() => {
        const storedCases = getStoredCases()
        const casesArray = Object.values(storedCases).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
        setCases(casesArray)
    }, [])

    return {
        cases,
        isLoading,
        refreshCases,
    }
}

export function useCasesByPhysician(physicianAddress?: string) {
    const [cases, setCases] = useState<MedicalCase[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (physicianAddress) {
            setIsLoading(true)
            const storedCases = getStoredCases()
            const physicianCases = Object.values(storedCases)
                .filter((case_) => case_.physicianAddress.toLowerCase() === physicianAddress.toLowerCase())
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            setCases(physicianCases)
            setIsLoading(false)
        }
    }, [physicianAddress])

    return {
        cases,
        isLoading,
    }
}

export function useCasesBySpecialty(specialty?: string) {
    const [cases, setCases] = useState<MedicalCase[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (specialty) {
            setIsLoading(true)
            const storedCases = getStoredCases()
            const specialtyCases = Object.values(storedCases)
                .filter((case_) => case_.specialty.toLowerCase() === specialty.toLowerCase())
                .filter((case_) => case_.status === "pending" || case_.status === "under_review")
                .sort((a, b) => {
                    // Sort by urgency first, then by date
                    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
                    if (urgencyDiff !== 0) return urgencyDiff
                    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                })
            setCases(specialtyCases)
            setIsLoading(false)
        }
    }, [specialty])

    return {
        cases,
        isLoading,
    }
}

export function useSubmitCase() {
    const { writeContract, isPending, error, ...rest } = useWriteContract()

    const submitCase = useCallback(
        async (caseData: CaseSubmission, physicianAddress: string, physicianName: string) => {
            try {
                // Generate unique case ID
                const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                // Create case object
                const newCase: MedicalCase = {
                    id: caseId,
                    title: caseData.title,
                    specialty: caseData.specialty,
                    urgency: caseData.urgency as MedicalCase["urgency"],
                    status: "pending",
                    submittedAt: new Date().toISOString(),
                    submittedBy: physicianName,
                    physicianAddress: physicianAddress,
                    symptoms: caseData.symptoms,
                    medicalHistory: caseData.medicalHistory,
                    currentTreatment: caseData.currentTreatment,
                    specificQuestions: caseData.specificQuestions,
                    attachments: [], // File handling would be implemented with IPFS
                    expertOpinions: 0,
                    lastUpdated: new Date().toISOString(),
                }

                // Store in local storage for demo
                storeCase(newCase)

                toast.success("Case submitted successfully! Experts will be notified.")

                return { caseId }
            } catch (error) {
                console.error("Error submitting case:", error)
                toast.error("Failed to submit case")
                throw error
            }
        },
        [writeContract],
    )

    return {
        submitCase,
        isPending,
        error,
        ...rest,
    }
}

export function useUpdateCaseStatus() {
    const updateStatus = useCallback((caseId: string, newStatus: MedicalCase["status"]) => {
        try {
            const cases = getStoredCases()
            if (cases[caseId]) {
                cases[caseId].status = newStatus
                cases[caseId].lastUpdated = new Date().toISOString()
                localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases))
                toast.success(`Case status updated to ${newStatus}`)
            }
        } catch (error) {
            console.error("Error updating case status:", error)
            toast.error("Failed to update case status")
        }
    }, [])

    return { updateStatus }
}

export function getCaseStats(cases: MedicalCase[]) {
    const stats = {
        total: cases.length,
        pending: cases.filter((c) => c.status === "pending").length,
        underReview: cases.filter((c) => c.status === "under_review").length,
        completed: cases.filter((c) => c.status === "completed").length,
        byUrgency: {
            critical: cases.filter((c) => c.urgency === "critical").length,
            high: cases.filter((c) => c.urgency === "high").length,
            medium: cases.filter((c) => c.urgency === "medium").length,
            low: cases.filter((c) => c.urgency === "low").length,
        },
        bySpecialty: cases.reduce(
            (acc, case_) => {
                acc[case_.specialty] = (acc[case_.specialty] || 0) + 1
                return acc
            },
            {} as Record<string, number>,
        ),
    }

    return stats
}
