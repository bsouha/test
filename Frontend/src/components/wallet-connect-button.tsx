"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function WalletConnectButton() {
    const { address, isConnected } = useAccount()
    const { connect, connectors, isPending, error } = useConnect()
    const { disconnect } = useDisconnect()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button disabled className="bg-gray-200">
                <Wallet className="h-4 w-4 mr-2" />
                Loading...
            </Button>
        )
    }

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                </Badge>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                </Button>
            </div>
        )
    }

    const isMetaMaskAvailable = typeof window !== "undefined" && window.ethereum?.isMetaMask

    if (!isMetaMaskAvailable) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                    onClick={() => window.open("https://metamask.io/download/", "_blank")}
                >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Install MetaMask
                </Button>
            </div>
        )
    }

    return (
        <div className="flex gap-2">
            {connectors.map((connector) => (
                <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Wallet className="h-4 w-4 mr-2" />
                    {isPending ? "Connecting..." : "Connect MetaMask"}
                </Button>
            ))}
            {error && <div className="text-sm text-red-600 mt-2">Connection failed. Please try again.</div>}
        </div>
    )
}
