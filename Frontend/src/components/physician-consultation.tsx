"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Plus, FileText } from 'lucide-react'

export function PhysicianConsultation() {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Physician Dashboard</h2>
                <p className="text-gray-600">Submit complex medical cases for expert consultation</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Submit New Case
                        </CardTitle>
                        <CardDescription>Submit a complex medical case for expert review</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Case submission form will be available once smart contracts are deployed.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            My Cases
                        </CardTitle>
                        <CardDescription>View your submitted cases and expert opinions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Your cases will appear here once you start submitting them.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}