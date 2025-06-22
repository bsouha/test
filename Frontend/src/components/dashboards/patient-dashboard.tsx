"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Heart, FileText, Shield, Bell } from "lucide-react"

export function PatientDashboard() {
    const [consentGiven, setConsentGiven] = useState(false)
    const [notifications, setNotifications] = useState(true)

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Cases</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Cases involving you</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Active consultations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Privacy Status</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <Badge variant={consentGiven ? "default" : "secondary"}>{consentGiven ? "Active" : "Inactive"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Data sharing consent</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy & Consent
                        </CardTitle>
                        <CardDescription>Manage your data sharing preferences and consent settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="consent">Data Sharing Consent</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow your anonymized data to be used for medical consultations
                                </p>
                            </div>
                            <Switch id="consent" checked={consentGiven} onCheckedChange={setConsentGiven} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="notifications">Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive updates about your cases and consultations</p>
                            </div>
                            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2">Data Usage</h4>
                            <p className="text-sm text-muted-foreground">
                                Your medical data is encrypted and stored on IPFS. Only authorized medical professionals can access your
                                information with your consent.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            My Medical Cases
                        </CardTitle>
                        <CardDescription>View cases where your data has been used for consultation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No cases found</p>
                            <p className="text-sm">Cases involving your data will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Stay updated with the latest activity on your cases</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm">Updates and notifications will appear here</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
