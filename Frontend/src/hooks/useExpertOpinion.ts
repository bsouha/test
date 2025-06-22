import { useReadContract, useWriteContract } from "wagmi"
import { CONTRACT_ADDRESSES, EXPERT_OPINION_ABI } from "@/lib/contracts"

export function useCaseOpinions(caseId?: number) {
    return useReadContract({
        address: CONTRACT_ADDRESSES.EXPERT_OPINION,
        abi: EXPERT_OPINION_ABI,
        functionName: "getOpinionsForCase",
        args: caseId ? [BigInt(caseId)] : undefined,
        query: {
            enabled: !!caseId,
        },
    })
}

export function useSubmitOpinion() {
    return useWriteContract()
}