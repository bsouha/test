"use client"

import { useAccount } from "wagmi"
import { useUserRole, Role } from "@/hooks/useAccessControl"
import { WalletConnectButton } from "./wallet-connect-button"
import { NetworkSwitcher } from "./network-switcher"
import { PhysicianConsultation } from "./physician-consultation"
import { ExpertConsultation } from "./expert-consultation"
import { AdminPanel } from "./admin-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Stethoscope, Brain, Shield, AlertCircle, Globe, Lock, Users, Activity, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function MedicalConsultationPlatform() {
    const { address, isConnected, chain } = useAccount()
    const { data: userRole, isLoading: roleLoading, error: roleError } = useUserRole(address)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (roleError) {
            toast.error("Failed to load user role. Please try refreshing the page.")
        }
    }, [roleError])

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
                            Medical Expert Platform
                        </CardTitle>
                        <CardDescription>Loading platform...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Brain className="h-12 w-12 text-blue-600" />
                            <h1 className="text-4xl font-bold text-gray-900">Medical Expert Platform</h1>
                        </div>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            A decentralized platform leveraging Blockchain and AI for secure, transparent medical expert
                            consultations. Connect physicians with specialists worldwide for complex case analysis.
                        </p>
                        <div className="flex justify-center mb-8">
                            <WalletConnectButton />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Shield className="h-4 w-4" />
                            <span>Secure blockchain-based authentication required</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
                        <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <CardHeader>
                                <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <CardTitle>For Physicians</CardTitle>
                                <CardDescription>
                                    Submit complex medical cases and get expert opinions from specialists worldwide
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Secure case submission with pseudonymized data
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        AI-powered expert matching by specialty
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Transparent consultation process
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Global access to medical expertise
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <CardHeader>
                                <Brain className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <CardTitle>For Medical Experts</CardTitle>
                                <CardDescription>Review cases in your specialty and provide expert medical opinions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Specialty-based case filtering
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Secure opinion submission via blockchain
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Reputation-based scoring system
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Peer review and validation process
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <CardHeader>
                                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                                <CardTitle>Blockchain Security</CardTitle>
                                <CardDescription>
                                    Ensuring data integrity, transparency, and trust in medical consultations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Immutable case records on blockchain
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Smart contract automation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Decentralized consensus mechanism
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        IPFS encrypted data storage
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-8">Platform Features</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <Globe className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-semibold mb-2">Global Network</h3>
                                <p className="text-sm text-gray-600">
                                    Connect with medical experts worldwide, breaking geographical barriers
                                </p>
                            </div>
                            <div className="text-center">
                                <Lock className="h-8 w-8 text-green-600 mx-auto mb-3" />
                                <h3 className="font-semibold mb-2">Privacy First</h3>
                                <p className="text-sm text-gray-600">
                                    Patient data is pseudonymized and encrypted for maximum privacy protection
                                </p>
                            </div>
                            <div className="text-center">
                                <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-semibold mb-2">Peer Review</h3>
                                <p className="text-sm text-gray-600">
                                    Expert opinions are validated through decentralized peer review process
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Activity className="h-6 w-6 text-blue-600 animate-spin" />
                            Loading User Profile
                        </CardTitle>
                        <CardDescription>Verifying your credentials...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!userRole || userRole === Role.None) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                            Registration Required
                        </CardTitle>
                        <CardDescription>
                            Your wallet is connected but you need to be registered as a medical professional to access the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <Badge variant="outline" className="mb-4">
                                Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Badge>
                        </div>

                        {/* Network Switcher */}
                        <div className="flex justify-center">
                            <NetworkSwitcher />
                        </div>

                        <div className="text-sm text-gray-600">
                            <p className="mb-4 text-center font-medium">To access the platform, you must be registered as:</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <span className="font-medium">Physician</span>
                                        <p className="text-xs text-gray-500">Submit complex cases for expert review</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                    <Brain className="h-5 w-5 text-green-600" />
                                    <div>
                                        <span className="font-medium">Medical Expert</span>
                                        <p className="text-xs text-gray-500">Review cases and provide expert opinions</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                    <Shield className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <span className="font-medium">Administrator</span>
                                        <p className="text-xs text-gray-500">Manage platform and user registrations</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-4">Contact the platform administrator for registration</p>
                            <Button variant="outline" className="w-full mb-4">
                                Request Access
                            </Button>
                        </div>

                        <div className="flex justify-center pt-4 border-t">
                            <WalletConnectButton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <Brain className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Medical Expert Platform</h1>
                                <p className="text-sm text-gray-600">Decentralized Medical Consultation System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <NetworkSwitcher />
                            <Badge variant="secondary" className="flex items-center gap-2">
                                {userRole === Role.Physician && <Stethoscope className="h-4 w-4" />}
                                {userRole === Role.Expert && <Brain className="h-4 w-4" />}
                                {userRole === Role.Admin && <Shield className="h-4 w-4" />}
                                {userRole === Role.Physician && "Physician"}
                                {userRole === Role.Expert && "Medical Expert"}
                                {userRole === Role.Admin && "Administrator"}
                            </Badge>
                            <WalletConnectButton />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {userRole === Role.Physician && <PhysicianConsultation />}
                {userRole === Role.Expert && <ExpertConsultation />}
                {userRole === Role.Admin && <AdminPanel />}
            </main>
        </div>
    )
}
