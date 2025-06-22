"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSubmitCase, useCaseCount } from "@/hooks/useMedicalCase"
import { ipfsService } from "@/lib/ipfs"
import { CONTRACT_ADDRESSES, MEDICAL_CASE_ABI } from "@/lib/contracts"
import { FileText, Upload, Plus, Activity, ExternalLink, Shield } from "lucide-react"
import { toast } from "sonner"

export function PhysicianDashboard() {
    const { address } = useAccount()
    const { writeContract, isPending } = useSubmitCase()
    const { data: caseCount } = useCaseCount()

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        duration: "7",
        patientData: "",
        symptoms: "",
        medicalHistory: "",
        diagnosticTests: "",
        urgency: "routine",
    })
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploadedHashes, setUploadedHashes] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setIsUploading(true)
        const newHashes: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                toast.info(`Uploading ${file.name} to IPFS...`)

                const hash = await ipfsService.uploadFile(file, {
                    name: `medical-file-${Date.now()}-${file.name}`,
                    keyvalues: {
                        caseRelated: "true",
                        fileType: file.type,
                        physician: address || "unknown",
                    },
                })

                newHashes.push(hash)
                toast.success(`${file.name} uploaded to IPFS: ${hash.substring(0, 12)}...`)
            }

            setUploadedHashes([...uploadedHashes, ...newHashes])
            setSelectedFiles([...selectedFiles, ...Array.from(files)])
        } catch (error) {
            console.error("File upload error:", error)
            toast.error("Failed to upload some files to IPFS")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmitCase = async () => {
        try {
            if (!formData.title || !formData.description || !formData.category) {
                toast.error("Please fill in all required fields")
                return
            }

            toast.info("Preparing case data for IPFS storage...")

            // Prepare comprehensive case data for IPFS
            const caseData = {
                caseInfo: {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    urgency: formData.urgency,
                },
                clinicalData: {
                    symptoms: formData.symptoms,
                    medicalHistory: formData.medicalHistory,
                    diagnosticTests: formData.diagnosticTests,
                    patientData: formData.patientData,
                },
                attachments: {
                    fileHashes: uploadedHashes,
                    fileNames: selectedFiles.map((f) => f.name),
                    fileTypes: selectedFiles.map((f) => f.type),
                },
                metadata: {
                    submittedBy: address,
                    timestamp: Date.now(),
                    caseId: `CASE_${Date.now()}`,
                    version: "1.0",
                    encrypted: false, // Set to true if implementing encryption
                },
                consultation: {
                    duration: Number.parseInt(formData.duration),
                    requestedSpecialty: formData.category,
                    urgencyLevel: formData.urgency,
                },
            }

            toast.info("Uploading case to IPFS...")

            // Upload to IPFS using medical-specific method
            const ipfsHash = await ipfsService.uploadMedicalCase(caseData)

            toast.success(`Case uploaded to IPFS: ${ipfsHash}`)
            toast.info("Submitting to blockchain...")

            // Submit to blockchain with IPFS hash
            writeContract({
                address: CONTRACT_ADDRESSES.MEDICAL_CASE,
                abi: MEDICAL_CASE_ABI,
                functionName: "submitCase",
                args: [ipfsHash, formData.category, BigInt(formData.duration)],
            })

            toast.success("Case submitted successfully! IPFS Hash: " + ipfsHash.substring(0, 12) + "...")

            // Reset form
            setFormData({
                title: "",
                description: "",
                category: "",
                duration: "7",
                patientData: "",
                symptoms: "",
                medicalHistory: "",
                diagnosticTests: "",
                urgency: "routine",
            })
            setSelectedFiles([])
            setUploadedHashes([])
        } catch (error) {
            console.error("Error submitting case:", error)
            toast.error("Failed to submit case. Please try again.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{caseCount?.toString() || "0"}</div>
                        <p className="text-xs text-muted-foreground">Cases submitted to IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">IPFS Files</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uploadedHashes.length}</div>
                        <p className="text-xs text-muted-foreground">Files stored on IPFS</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Awaiting expert opinions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Submit New Case to IPFS
                    </CardTitle>
                    <CardDescription>
                        Submit a new medical case with secure IPFS storage. All data will be stored on the decentralized network.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Case Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Case Title *</Label>
                            <Input
                                id="title"
                                placeholder="Brief case title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Medical Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
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
                                    <SelectItem value="general">General Medicine</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Clinical Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Clinical Information</h3>

                        <div className="space-y-2">
                            <Label htmlFor="symptoms">Presenting Symptoms *</Label>
                            <Textarea
                                id="symptoms"
                                placeholder="Describe the patient's current symptoms..."
                                rows={3}
                                value={formData.symptoms}
                                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medicalHistory">Medical History</Label>
                            <Textarea
                                id="medicalHistory"
                                placeholder="Relevant medical history..."
                                rows={3}
                                value={formData.medicalHistory}
                                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="diagnosticTests">Diagnostic Tests & Results</Label>
                            <Textarea
                                id="diagnosticTests"
                                placeholder="Lab results, imaging findings..."
                                rows={3}
                                value={formData.diagnosticTests}
                                onChange={(e) => setFormData({ ...formData, diagnosticTests: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Case Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Detailed case description and clinical question..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Medical Files (IPFS Storage)</h3>

                        <div className="space-y-2">
                            <Label htmlFor="files">Upload Medical Files</Label>
                            <Input
                                id="files"
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.dcm,.doc,.docx"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                disabled={isUploading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Supported: PDF, Images, DICOM, Documents. Files will be stored on IPFS.
                            </p>
                        </div>

                        {/* Display uploaded files */}
                        {uploadedHashes.length > 0 && (
                            <div className="space-y-2">
                                <Label>Uploaded Files on IPFS:</Label>
                                <div className="space-y-2">
                                    {uploadedHashes.map((hash, index) => (
                                        <div key={hash} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <span className="text-sm font-mono">{selectedFiles[index]?.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{hash.substring(0, 12)}...</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(ipfsService.getFileUrl(hash), "_blank")}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Case Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="urgency">Urgency Level</Label>
                            <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="routine">Routine</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Consultation Duration (days)</Label>
                            <Select
                                value={formData.duration}
                                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 days (Emergency)</SelectItem>
                                    <SelectItem value="7">7 days (Standard)</SelectItem>
                                    <SelectItem value="14">14 days (Complex)</SelectItem>
                                    <SelectItem value="30">30 days (Research)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleSubmitCase} disabled={isPending || isUploading} className="w-full" size="lg">
                        {isPending ? (
                            <>
                                <Upload className="mr-2 h-4 w-4 animate-spin" />
                                Submitting to Blockchain...
                            </>
                        ) : isUploading ? (
                            <>
                                <Upload className="mr-2 h-4 w-4 animate-spin" />
                                Uploading to IPFS...
                            </>
                        ) : (
                            <>
                                <Shield className="mr-2 h-4 w-4" />
                                Submit Case to IPFS & Blockchain
                            </>
                        )}
                    </Button>

                    {/* IPFS Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">IPFS Storage</span>
                        </div>
                        <p className="text-sm text-blue-800">
                            Your medical data will be securely stored on IPFS (InterPlanetary File System), ensuring decentralized,
                            tamper-proof storage. Each file gets a unique hash for verification.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
