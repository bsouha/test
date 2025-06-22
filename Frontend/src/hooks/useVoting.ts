import { useWriteContract } from "wagmi"

export function useCastVote() {
    return useWriteContract()
}

export function useFinalizeVote() {
    return useWriteContract()
}
