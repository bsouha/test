"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAssignRole, Role } from "@/hooks/useAccessControl"
import { CONTRACT_ADDRESSES, ACCESS_CONTROL_ABI } from "@/lib/contracts"
import { ipfsService } from "@/lib/ipfs"
import { Shield, Users, UserPlus, Settings, Database, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export function AdminDashboard() {
    const { writeContract, isPending } = useAssignRole()

    const [userForm, setUserForm] = useState({
        address: "",
        role: "",
        name: "",
        specialty: "",
    })
    const [ipfsStats, setIpfsStats] = useState<any[]>([])
    const [loadingStats, setLoadingStats] = useState(false)

    const handleAssignRole = async () => {
        try {
            if (!userForm.address || !userForm.role || !userForm.name) {
                toast.error("Please fill in all required fields")
                return
            }

            // Store user profile on IPFS first
            toast.info("Storing user profile on IPFS...")

            const profileData = {
                address: userForm.address,
                role: Number.parseInt(userForm.role),
                name: userForm.name,
                specialty: userForm.specialty,
                registrationDate: new Date().toISOString(),
                status: "active",
                metadata: {
                    registeredBy: "admin", // In real app, this would be the admin's address
                    timestamp: Date.now(),
                },
            }

            const profileHash = await ipfsService.uploadUserProfile(profileData)
            toast.success(`User profile stored on IPFS: ${profileHash}`)

            // Then assign role on blockchain
            writeContract({
                address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
                abi: ACCESS_CONTROL_ABI,
                functionName: "assignRole",
                args: [
                    userForm.address as `0x${string}`,
                    Number.parseInt(userForm.role),
                    userForm.name,
                    userForm.specialty || "",
                ],
            })

            toast.success(
                `${userForm.name} registered as ${userForm.role === "1" ? "Physician" : userForm.role === "2" ? "Medical Expert" : "Admin"} with IPFS profile: ${profileHash.substring(0, 12)}...`,
            )

            // Reset form
            setUserForm({
                address: "",
                role: "",
                name: "",
                specialty: "",
            })
        } catch (error) {
            console.error("Error assigning role:", error)
            toast.error("Failed to assign role. Please try again.")
        }
    }

    const loadIPFSStats = async () => {
        setLoadingStats(true)
        try {
            toast.info("Loading IPFS statistics...")
            const pinnedFiles = await ipfsService.listPinnedFiles()
            setIpfsStats(pinnedFiles)
            toast.success(`Loaded ${pinnedFiles.length} files from IPFS`)
        } catch (error) {
            console.error("Error loading IPFS stats:", error)
            toast.error("Failed to load IPFS statistics")
        } finally {
            setLoadingStats(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Profiles on IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">IPFS Files</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ipfsStats.length}</div>
                        <p className="text-xs text-muted-foreground">Files stored on IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Medical Cases</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Cases on IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expert Opinions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Opinions on IPFS</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Register User with IPFS Profile
                        </CardTitle>
                        <CardDescription>Register users and store their profiles securely on IPFS</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Wallet Address *</Label>
                            <Input
                                id="address"
                                placeholder="0x..."
                                value={userForm.address}
                                onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={Role.Physician.toString()}>Physician</SelectItem>
                                    <SelectItem value={Role.Expert.toString()}>Expert</SelectItem>
                                    <SelectItem value={Role.Admin.toString()}>Admin</SelectItem>
                                    <SelectItem value={Role.Patient.toString()}>Patient</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="Dr. John Smith"
                                value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialty">Specialty</Label>
                            <Select
                                value={userForm.specialty}
                                onValueChange={(value) => setUserForm({ ...userForm, specialty: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specialty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cardiology">Cardiology</SelectItem>
                                    <SelectItem value="neurology">Neurology</SelectItem>
                                    <SelectItem value="oncology">Oncology</SelectItem>
                                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                                    <SelectItem value="dermatology">Dermatology</SelectItem>
                                    <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                                    <SelectItem value="pulmonology">Pulmonology</SelectItem>
                                    <SelectItem value="endocrinology">Endocrinology</SelectItem>
                                    <SelectItem value="rheumatology">Rheumatology</SelectItem>
                                    <SelectItem value="infectious-disease">Infectious Disease</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Required for medical professionals</p>
                        </div>

                        <Button onClick={handleAssignRole} disabled={isPending} className="w-full">
                            {isPending ? "Storing on IPFS & Blockchain..." : "Register User with IPFS Profile"}
                        </Button>

                        {/* IPFS Info */}
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Database className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900 text-sm">IPFS Storage</span>
                            </div>
                            <p className="text-xs text-blue-800">
                                User profiles are stored on IPFS for decentralized, tamper-proof record keeping.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            IPFS Management
                        </CardTitle>
                        <CardDescription>Monitor and manage IPFS storage and files</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={loadIPFSStats}
                                disabled={loadingStats}
                            >
                                <Database className="mr-2 h-4 w-4" />
                                {loadingStats ? "Loading..." : "Load IPFS Statistics"}
                            </Button>

                            <Button variant="outline" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                View All User Profiles
                            </Button>

                            <Button variant="outline" className="w-full justify-start">
                                <Shield className="mr-2 h-4 w-4" />
                                Monitor Medical Cases
                            </Button>

                            <Button variant="outline" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                IPFS Gateway Settings
                            </Button>
                        </div>

                        {/* IPFS Files List */}
                        {ipfsStats.length > 0 && (
                            <div className="space-y-2">
                                <Label>Recent IPFS Files:</Label>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {ipfsStats.slice(0, 5).map((file: any) => (
                                        <div
                                            key={file.ipfs_pin_hash}
                                            className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                                        >
                                            <span className="font-mono">{file.ipfs_pin_hash.substring(0, 12)}...</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">{file.metadata?.name || "Unknown"}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0"
                                                    onClick={() => window.open(ipfsService.getFileUrl(file.ipfs_pin_hash), "_blank")}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2">Platform Status</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Blockchain Network:</span>
                                    <span className="text-green-600">Connected</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>IPFS Storage:</span>
                                    <span className="text-green-600">Operational</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pinata Gateway:</span>
                                    <span className="text-green-600">Active</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Smart Contracts:</span>
                                    <span className="text-green-600">Deployed</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
