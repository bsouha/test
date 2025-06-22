import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, MEDICAL_CASE_ABI } from "@/lib/contracts"

export function useCaseCount() {
    return useReadContract({
        address: CONTRACT_ADDRESSES.MEDICAL_CASE,
        abi: MEDICAL_CASE_ABI,
        functionName: "caseCount",
    })
}

export function useCase(caseId?: number) {
    return useReadContract({
        address: CONTRACT_ADDRESSES.MEDICAL_CASE,
        abi: MEDICAL_CASE_ABI,
        functionName: "getCase",
        args: caseId ? [BigInt(caseId)] : undefined,
        query: {
            enabled: !!caseId,
        },
    })
}

export function useSubmitCase() {
    return useWriteContract()
}