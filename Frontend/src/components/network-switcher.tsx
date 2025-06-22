"use client"

import { useAccount, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Network } from "lucide-react"
import { useEffect, useState } from "react"

const GANACHE_CHAIN_ID = 1337

export function NetworkSwitcher() {
    const { chain } = useAccount()
    const { switchChain, isPending } = useSwitchChain()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const isOnGanache = chain?.id === GANACHE_CHAIN_ID
    const isWrongNetwork = chain && !isOnGanache

    const addGanacheNetwork = async () => {
        try {
            await window.ethereum?.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x539", // 1337 in hex
                        chainName: "Ganache",
                        nativeCurrency: {
                            name: "Ether",
                            symbol: "ETH",
                            decimals: 18,
                        },
                        rpcUrls: ["http://127.0.0.1:8545"], // Updated to your port
                        blockExplorerUrls: null,
                    },
                ],
            })
        } catch (error) {
            console.error("Failed to add Ganache network:", error)
        }
    }

    const switchToGanache = async () => {
        try {
            await switchChain({ chainId: GANACHE_CHAIN_ID })
        } catch (error) {
            // If the network doesn't exist, add it first
            await addGanacheNetwork()
            await switchChain({ chainId: GANACHE_CHAIN_ID })
        }
    }

    if (isWrongNetwork) {
        return (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">Wrong Network</p>
                    <p className="text-xs text-orange-600">Please switch to Ganache network to interact with contracts</p>
                </div>
                <Button
                    size="sm"
                    onClick={switchToGanache}
                    disabled={isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                    {isPending ? "Switching..." : "Switch to Ganache"}
                </Button>
            </div>
        )
    }

    if (isOnGanache) {
        return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Network className="h-3 w-3 mr-1" />
                Ganache Network
            </Badge>
        )
    }

    return (
        <Button variant="outline" size="sm" onClick={switchToGanache} disabled={isPending}>
            <Network className="h-4 w-4 mr-2" />
            {isPending ? "Connecting..." : "Connect to Ganache"}
        </Button>
    )
}
