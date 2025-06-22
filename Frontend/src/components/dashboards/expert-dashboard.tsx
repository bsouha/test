"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCaseCount, useCase } from "@/hooks/useMedicalCase"
import { useSubmitOpinion } from "@/hooks/useExpertOpinion"
import { useExpertReputation } from "@/hooks/useReputation"
import { ipfsService } from "@/lib/ipfs"
import { CONTRACT_ADDRESSES, EXPERT_OPINION_ABI } from "@/lib/contracts"
import { Star, FileText, Clock, CheckCircle, MessageSquare, ExternalLink, Shield } from "lucide-react"
import { toast } from "sonner"

export function ExpertDashboard() {
    const { address } = useAccount()
    const { data: caseCount } = useCaseCount()
    const { writeContract, isPending } = useSubmitOpinion()

    // Mock expert ID - in real app, this would come from user profile
    const expertId = address ? Number.parseInt(address.slice(-8), 16) % 10000 : 0
    const { data: reputation } = useExpertReputation(expertId)

    const [selectedCase, setSelectedCase] = useState<number | null>(null)
    const [opinion, setOpinion] = useState({
        diagnosis: "",
        recommendations: "",
        treatment: "",
        prognosis: "",
        additionalTests: "",
        confidence: "moderate",
    })
    const [caseDetails, setCaseDetails] = useState<any>(null)
    const [loadingCaseData, setLoadingCaseData] = useState(false)

    const { data: caseData } = useCase(selectedCase || undefined)

    // Load case details from IPFS when a case is selected
    const loadCaseFromIPFS = async (caseId: number) => {
        if (!caseData || !caseData[1]) return

        setLoadingCaseData(true)
        try {
            toast.info("Loading case details from IPFS...")
            const ipfsHash = caseData[1] // Assuming IPFS hash is at index 1
            const details = await ipfsService.retrieveJSON(ipfsHash)
            setCaseDetails(details)
            toast.success("Case details loaded from IPFS")
        } catch (error) {
            console.error("Error loading case from IPFS:", error)
            toast.error("Failed to load case details from IPFS")
        } finally {
            setLoadingCaseData(false)
        }
    }

    const handleCaseSelect = (caseId: number) => {
        setSelectedCase(caseId)
        loadCaseFromIPFS(caseId)
    }

    const handleSubmitOpinion = async () => {
        if (!selectedCase || !opinion.diagnosis.trim() || !opinion.recommendations.trim()) {
            toast.error("Please provide at least a diagnosis and recommendations")
            return
        }

        try {
            toast.info("Preparing expert opinion for IPFS...")

            // Prepare comprehensive expert opinion for IPFS
            const opinionData = {
                expertOpinion: {
                    diagnosis: opinion.diagnosis,
                    recommendations: opinion.recommendations,
                    treatmentPlan: opinion.treatment,
                    prognosis: opinion.prognosis,
                    additionalTests: opinion.additionalTests,
                    confidenceLevel: opinion.confidence,
                },
                expertInfo: {
                    expertId: expertId,
                    expertAddress: address,
                    specialty: "Cardiology", // This would come from expert profile
                    reputation: reputation?.toString() || "0",
                    timestamp: Date.now(),
                },
                caseReference: {
                    caseId: selectedCase,
                    originalCaseHash: caseData?.[1], // Reference to original case IPFS hash
                },
                metadata: {
                    opinionId: `OPINION_${Date.now()}`,
                    version: "1.0",
                    timestamp: Date.now(),
                    encrypted: false,
                },
                verification: {
                    expertSignature: address, // In real implementation, this would be a cryptographic signature
                    submissionTime: new Date().toISOString(),
                },
            }

            toast.info("Uploading opinion to IPFS...")

            // Upload to IPFS using expert-specific method
            const ipfsHash = await ipfsService.uploadExpertOpinion(opinionData)

            toast.success(`Opinion uploaded to IPFS: ${ipfsHash}`)
            toast.info("Submitting to blockchain...")

            // Submit to blockchain
            writeContract({
                address: CONTRACT_ADDRESSES.EXPERT_OPINION,
                abi: EXPERT_OPINION_ABI,
                functionName: "submitOpinion",
                args: [BigInt(selectedCase), BigInt(expertId), ipfsHash],
            })

            toast.success("Expert opinion submitted successfully! IPFS Hash: " + ipfsHash.substring(0, 12) + "...")

            // Reset form
            setOpinion({
                diagnosis: "",
                recommendations: "",
                treatment: "",
                prognosis: "",
                additionalTests: "",
                confidence: "moderate",
            })
        } catch (error) {
            console.error("Error submitting opinion:", error)
            toast.error("Failed to submit opinion. Please try again.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reputation?.toString() || "0"}</div>
                        <p className="text-xs text-muted-foreground">Out of 1000</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Cases</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{caseCount?.toString() || "0"}</div>
                        <p className="text-xs text-muted-foreground">Cases on IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Awaiting your input</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
                        <CardTitle>Available Cases from IPFS</CardTitle>
                        <CardDescription>Select a case to load details from IPFS and provide your opinion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: Number(caseCount) || 0 }, (_, i) => i + 1).map((caseId) => (
                            <CaseCard
                                key={caseId}
                                caseId={caseId}
                                isSelected={selectedCase === caseId}
                                onSelect={() => handleCaseSelect(caseId)}
                            />
                        ))}
                        {(!caseCount || Number(caseCount) === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No cases available</p>
                                <p className="text-sm">Cases stored on IPFS will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Submit Opinion to IPFS
                        </CardTitle>
                        <CardDescription>
                            {selectedCase
                                ? `Provide expert opinion for Case #${selectedCase} (stored on IPFS)`
                                : "Select a case to submit your opinion"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedCase && caseData && (
                            <div className="space-y-4">
                                {/* Case Summary from IPFS */}
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Case Details from IPFS</h4>
                                        {loadingCaseData && <div className="text-xs text-muted-foreground">Loading...</div>}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <strong>Case ID:</strong> {caseData[0]?.toString()}
                                        </p>
                                        <p>
                                            <strong>Category:</strong> {caseData[4]}
                                        </p>
                                        <p>
                                            <strong>IPFS Hash:</strong>
                                            <span className="font-mono text-xs ml-1">{caseData[1]?.substring(0, 12)}...</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-1 h-4 w-4 p-0"
                                                onClick={() => window.open(ipfsService.getFileUrl(caseData[1]), "_blank")}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </p>
                                        <p>
                                            <strong>Status:</strong>
                                            <Badge variant={caseData[5] ? "default" : "secondary"} className="ml-2">
                                                {caseData[5] ? "Open" : "Closed"}
                                            </Badge>
                                        </p>
                                    </div>

                                    {/* Display loaded case details */}
                                    {caseDetails && (
                                        <div className="mt-4 p-3 bg-background rounded border">
                                            <h5 className="font-medium mb-2">Clinical Information:</h5>
                                            <div className="space-y-1 text-sm">
                                                {caseDetails.caseInfo?.title && (
                                                    <p>
                                                        <strong>Title:</strong> {caseDetails.caseInfo.title}
                                                    </p>
                                                )}
                                                {caseDetails.clinicalData?.symptoms && (
                                                    <p>
                                                        <strong>Symptoms:</strong> {caseDetails.clinicalData.symptoms}
                                                    </p>
                                                )}
                                                {caseDetails.clinicalData?.medicalHistory && (
                                                    <p>
                                                        <strong>History:</strong> {caseDetails.clinicalData.medicalHistory}
                                                    </p>
                                                )}
                                                {caseDetails.attachments?.fileHashes?.length > 0 && (
                                                    <p>
                                                        <strong>Attachments:</strong> {caseDetails.attachments.fileHashes.length} files on IPFS
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Opinion Form */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
                                        <Textarea
                                            id="diagnosis"
                                            placeholder="Your primary diagnosis based on the case information..."
                                            rows={3}
                                            value={opinion.diagnosis}
                                            onChange={(e) => setOpinion({ ...opinion, diagnosis: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="recommendations">Clinical Recommendations *</Label>
                                        <Textarea
                                            id="recommendations"
                                            placeholder="Your recommendations for patient management..."
                                            rows={3}
                                            value={opinion.recommendations}
                                            onChange={(e) => setOpinion({ ...opinion, recommendations: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="treatment">Treatment Plan</Label>
                                        <Textarea
                                            id="treatment"
                                            placeholder="Suggested treatment approach..."
                                            rows={2}
                                            value={opinion.treatment}
                                            onChange={(e) => setOpinion({ ...opinion, treatment: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="additionalTests">Additional Tests</Label>
                                        <Textarea
                                            id="additionalTests"
                                            placeholder="Recommended additional tests..."
                                            rows={2}
                                            value={opinion.additionalTests}
                                            onChange={(e) => setOpinion({ ...opinion, additionalTests: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="prognosis">Prognosis</Label>
                                            <Textarea
                                                id="prognosis"
                                                placeholder="Expected outcome..."
                                                rows={2}
                                                value={opinion.prognosis}
                                                onChange={(e) => setOpinion({ ...opinion, prognosis: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confidence">Confidence Level</Label>
                                            <Select
                                                value={opinion.confidence}
                                                onValueChange={(value) => setOpinion({ ...opinion, confidence: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="high">High Confidence</SelectItem>
                                                    <SelectItem value="moderate">Moderate Confidence</SelectItem>
                                                    <SelectItem value="low">Low Confidence</SelectItem>
                                                    <SelectItem value="uncertain">Uncertain - Need More Info</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmitOpinion}
                                    disabled={isPending || !opinion.diagnosis.trim() || !opinion.recommendations.trim()}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isPending ? (
                                        <>
                                            <Shield className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting to IPFS & Blockchain...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Submit Opinion to IPFS
                                        </>
                                    )}
                                </Button>

                                {/* IPFS Info */}
                                <div className="p-3 bg-green-50 rounded border border-green-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="h-4 w-4 text-green-600" />
                                        <span className="font-medium text-green-900 text-sm">IPFS Storage</span>
                                    </div>
                                    <p className="text-xs text-green-800">
                                        Your expert opinion will be permanently stored on IPFS with a unique hash for verification.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!selectedCase && (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Select a case from the left panel</p>
                                <p className="text-sm">Case details will be loaded from IPFS</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function CaseCard({
    caseId,
    isSelected,
    onSelect,
}: {
    caseId: number
    isSelected: boolean
    onSelect: () => void
}) {
    const { data: caseData } = useCase(caseId)

    if (!caseData) return null

    return (
        <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
            onClick={onSelect}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">Case #{caseData[0]?.toString()}</h4>
                <Badge variant={caseData[5] ? "default" : "secondary"}>{caseData[5] ? "Open" : "Closed"}</Badge>
            </div>
            <div className="space-y-1 text-sm">
                <p>
                    <strong>Category:</strong> {caseData[4]}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    <strong>IPFS:</strong> {caseData[1]?.substring(0, 20)}...
                </p>
                <p className="text-xs text-muted-foreground">
                    <strong>Expires:</strong> {new Date(Number(caseData[3]) * 1000).toLocaleDateString()}
                </p>
            </div>
        </div>
    )
}
