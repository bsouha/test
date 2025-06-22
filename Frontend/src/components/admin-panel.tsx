"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, UserCheck, UserX, Clock, Shield } from "lucide-react"
import { toast } from "sonner"
import { useAllUsers, useAssignRole, Role, getRoleName, getRoleColor } from "@/hooks/useAccessControl"
import { CONTRACT_ADDRESSES, ACCESS_CONTROL_ABI } from "@/lib/contracts"

export function AdminPanel() {
    const [activeTab, setActiveTab] = useState("users")
    const [newUser, setNewUser] = useState({
        address: "",
        role: "",
        name: "",
        specialty: "",
    })
    const { users, isLoading: usersLoading, refreshUsers } = useAllUsers()
    const { writeContract: assignRole, isPending: isAssigningRole } = useAssignRole()

    const handleSubmitNewUser = async () => {
        if (!newUser.address || !newUser.role || !newUser.name) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await assignRole({
                address: CONTRACT_ADDRESSES.ACCESS_CONTROL,
                abi: ACCESS_CONTROL_ABI,
                functionName: "assignRole",
                args: [newUser.address, Number(newUser.role), newUser.name, newUser.specialty],
            })

            toast.success(`User ${newUser.name} registered successfully!`)
            setNewUser({ address: "", role: "", name: "", specialty: "" })
            refreshUsers()
        } catch (error) {
            toast.error("Failed to register user")
        }
    }

    const handleDeactivateUser = (address: string) => {
        // In a real implementation, you'd call a contract function to deactivate the user
        // For this demo, we'll just remove the user from local storage
        const storedUsers = localStorage.getItem("medical_dapp_users")
        if (storedUsers) {
            const users = JSON.parse(storedUsers)
            delete users[address]
            localStorage.setItem("medical_dapp_users", JSON.stringify(users))
            toast.success("User deactivated successfully!")
            refreshUsers()
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <Shield className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
                <p className="text-gray-600">Manage users and platform settings</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Manage Users
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Register New User
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>View and manage registered users on the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="text-center">
                                    <Clock className="h-6 w-6 animate-spin mx-auto" />
                                    Loading users...
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {Object.entries(users).map(([address, user]) => (
                                        <Card key={address} className="hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{user.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2 mt-1">
                                                            <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                                                            <span>•</span>
                                                            <span>
                                                                {address.slice(0, 6)}...{address.slice(-4)}
                                                            </span>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-600">
                                                        <p>Specialty: {user.specialty || "N/A"}</p>
                                                        <p>Registered: {new Date(user.registeredAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeactivateUser(address)}
                                                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                                    >
                                                        <UserX className="h-4 w-4 mr-2" />
                                                        Deactivate
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {Object.keys(users).length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No users registered yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Register New User</CardTitle>
                            <CardDescription>Assign a role to a new user on the platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Wallet Address *</Label>
                                    <Input
                                        id="address"
                                        placeholder="0x..."
                                        value={newUser.address}
                                        onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">User Role *</Label>
                                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={String(Role.Physician)}>Physician</SelectItem>
                                            <SelectItem value={String(Role.Expert)}>Medical Expert</SelectItem>
                                            <SelectItem value={String(Role.Admin)}>Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Dr. John Smith"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialty">Medical Specialty</Label>
                                <Select
                                    value={newUser.specialty}
                                    onValueChange={(value) => setNewUser({ ...newUser, specialty: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select specialty (optional)" />
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
                                        <SelectItem value="general">General Medicine</SelectItem>
                                        <SelectItem value="administration">System Administration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setNewUser({ address: "", role: "", name: "", specialty: "" })}
                                >
                                    Clear Form
                                </Button>
                                <Button onClick={handleSubmitNewUser} disabled={isAssigningRole}>
                                    {isAssigningRole ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Register User
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
