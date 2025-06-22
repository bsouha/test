"use client"

import { useAccount } from "wagmi"
import { useUserRole, useUserProfile, getRoleName, Role } from "@/hooks/useAccessControl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhysicianDashboard } from "./dashboards/physician-dashboard"
import { ExpertDashboard } from "./dashboards/expert-dashboard"
import { AdminDashboard } from "./dashboards/admin-dashboard"
import { PatientDashboard } from "./dashboards/patient-dashboard"
import { WalletConnectButton } from "./wallet-connect-button"
import { User, Shield, Stethoscope, UserCheck } from "lucide-react"
import { useEffect, useState } from "react"

export function Dashboard() {
    const { address, isConnected } = useAccount()
    const { data: userRole } = useUserRole(address)
    const { data: userProfile } = useUserProfile(address)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Stethoscope className="h-6 w-6 text-blue-600" />
                            Medical DApp
                        </CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Stethoscope className="h-6 w-6 text-blue-600" />
                            Medical DApp
                        </CardTitle>
                        <CardDescription>Connect your wallet to access the medical consultation platform</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <WalletConnectButton />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!userRole || userRole === Role.None) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <User className="h-6 w-6 text-orange-600" />
                            No Role Assigned
                        </CardTitle>
                        <CardDescription>
                            Your wallet is connected but you don't have a role assigned yet. Please contact an administrator to get
                            access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <Badge variant="outline">
                                Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Badge>
                        </div>
                        <div className="flex justify-center">
                            <WalletConnectButton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getRoleIcon = (role: number) => {
        switch (role) {
            case Role.Physician:
                return <Stethoscope className="h-5 w-5" />
            case Role.Expert:
                return <UserCheck className="h-5 w-5" />
            case Role.Admin:
                return <Shield className="h-5 w-5" />
            case Role.Patient:
                return <User className="h-5 w-5" />
            default:
                return <User className="h-5 w-5" />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <Stethoscope className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Medical DApp</h1>
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(userRole)}
                                    <Badge variant="secondary">{getRoleName(userRole)}</Badge>
                                    {userProfile && (
                                        <span className="text-sm text-gray-600">
                                            {userProfile[1]} {userProfile[2] && `- ${userProfile[2]}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <WalletConnectButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {userRole === Role.Physician && <PhysicianDashboard />}
                {userRole === Role.Expert && <ExpertDashboard />}
                {userRole === Role.Admin && <AdminDashboard />}
                {userRole === Role.Patient && <PatientDashboard />}
            </main>
        </div>
    )
}
