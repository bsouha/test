import { useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, REPUTATION_SYSTEM_ABI } from "@/lib/contracts"

export function useExpertReputation(expertId?: number) {
    return useReadContract({
        address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
        abi: REPUTATION_SYSTEM_ABI,
        functionName: "getReputation",
        args: expertId ? [BigInt(expertId)] : undefined,
        query: {
            enabled: !!expertId,
        },
    })
}