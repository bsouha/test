"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, MessageSquare, Star } from 'lucide-react'

export function ExpertConsultation() {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <Brain className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Medical Expert Dashboard</h2>
                <p className="text-gray-600">Review cases and provide expert medical opinions</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Available Cases
                        </CardTitle>
                        <CardDescription>Cases awaiting your expert opinion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Cases requiring expert review will appear here once physicians start submitting them.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Reputation Score
                        </CardTitle>
                        <CardDescription>Your expert reputation and peer reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Your reputation score will be calculated based on peer reviews of your opinions.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}