interface PinataResponse {
    IpfsHash: string
    PinSize: number
    Timestamp: string
}

interface PinataMetadata {
    name: string
    keyvalues?: Record<string, string>
}

export class IPFSService {
    private static instance: IPFSService
    private apiKey: string
    private secretKey: string
    private baseUrl = "https://api.pinata.cloud"

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || ""
        this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || ""

        if (!this.apiKey || !this.secretKey) {
            console.warn("Pinata API keys not found. IPFS functionality will be limited.")
        }
    }

    static getInstance(): IPFSService {
        if (!IPFSService.instance) {
            IPFSService.instance = new IPFSService()
        }
        return IPFSService.instance
    }

    private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                pinata_api_key: this.apiKey,
                pinata_secret_api_key: this.secretKey,
            },
        })

        if (!response.ok) {
            throw new Error(`IPFS request failed: ${response.statusText}`)
        }

        return response.json()
    }

    async uploadJSON(data: any, metadata?: Partial<PinataMetadata>): Promise<string> {
        try {
            if (!this.apiKey || !this.secretKey) {
                // Fallback to mock for development
                console.log("Using mock IPFS upload:", data)
                return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
            }

            const pinataMetadata: PinataMetadata = {
                name: metadata?.name || `medical-data-${Date.now()}`,
                keyvalues: {
                    type: "medical-data",
                    timestamp: new Date().toISOString(),
                    ...metadata?.keyvalues,
                },
            }

            const requestBody = {
                pinataContent: data,
                pinataMetadata,
                pinataOptions: {
                    cidVersion: 1,
                },
            }

            const result: PinataResponse = await this.makeRequest("/pinning/pinJSONToIPFS", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            console.log(`Data uploaded to IPFS: ${result.IpfsHash}`)
            return result.IpfsHash
        } catch (error) {
            console.error("Error uploading to IPFS:", error)
            // Fallback to mock hash for development
            return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        }
    }

    async uploadFile(file: File, metadata?: Partial<PinataMetadata>): Promise<string> {
        try {
            if (!this.apiKey || !this.secretKey) {
                console.log("Using mock file upload:", file.name)
                return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
            }

            const formData = new FormData()
            formData.append("file", file)

            const pinataMetadata: PinataMetadata = {
                name: metadata?.name || file.name,
                keyvalues: {
                    type: "medical-file",
                    originalName: file.name,
                    fileType: file.type,
                    timestamp: new Date().toISOString(),
                    ...metadata?.keyvalues,
                },
            }

            formData.append("pinataMetadata", JSON.stringify(pinataMetadata))
            formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }))

            const result: PinataResponse = await this.makeRequest("/pinning/pinFileToIPFS", {
                method: "POST",
                body: formData,
            })

            console.log(`File uploaded to IPFS: ${result.IpfsHash}`)
            return result.IpfsHash
        } catch (error) {
            console.error("Error uploading file to IPFS:", error)
            return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        }
    }

    async retrieveJSON(hash: string): Promise<any> {
        try {
            const response = await fetch(this.getFileUrl(hash))
            if (!response.ok) {
                throw new Error(`Failed to retrieve data: ${response.statusText}`)
            }
            return response.json()
        } catch (error) {
            console.error("Error retrieving from IPFS:", error)
            throw error
        }
    }

    async retrieveFile(hash: string): Promise<Blob> {
        try {
            const response = await fetch(this.getFileUrl(hash))
            if (!response.ok) {
                throw new Error(`Failed to retrieve file: ${response.statusText}`)
            }
            return response.blob()
        } catch (error) {
            console.error("Error retrieving file from IPFS:", error)
            throw error
        }
    }

    getFileUrl(hash: string): string {
        return `https://gateway.pinata.cloud/ipfs/${hash}`
    }

    async listPinnedFiles(): Promise<any[]> {
        try {
            if (!this.apiKey || !this.secretKey) {
                return []
            }

            const result = await this.makeRequest("/data/pinList?status=pinned", {
                method: "GET",
            })

            return result.rows || []
        } catch (error) {
            console.error("Error listing pinned files:", error)
            return []
        }
    }

    async unpinFile(hash: string): Promise<boolean> {
        try {
            if (!this.apiKey || !this.secretKey) {
                return false
            }

            await this.makeRequest(`/pinning/unpin/${hash}`, {
                method: "DELETE",
            })

            console.log(`File unpinned: ${hash}`)
            return true
        } catch (error) {
            console.error("Error unpinning file:", error)
            return false
        }
    }

    // Medical-specific methods
    async uploadMedicalCase(caseData: any): Promise<string> {
        return this.uploadJSON(caseData, {
            name: `medical-case-${caseData.metadata?.caseId || Date.now()}`,
            keyvalues: {
                type: "medical-case",
                specialty: caseData.consultation?.requestedSpecialty || "general",
                urgency: caseData.consultation?.urgencyLevel || "routine",
                physician: caseData.metadata?.submittedBy || "unknown",
            },
        })
    }

    async uploadExpertOpinion(opinionData: any): Promise<string> {
        return this.uploadJSON(opinionData, {
            name: `expert-opinion-${opinionData.metadata?.opinionId || Date.now()}`,
            keyvalues: {
                type: "expert-opinion",
                caseId: opinionData.metadata?.caseId?.toString() || "unknown",
                expertId: opinionData.expertInfo?.expertId?.toString() || "unknown",
                confidence: opinionData.expertOpinion?.confidenceLevel || "unknown",
            },
        })
    }

    async uploadUserProfile(profileData: any): Promise<string> {
        return this.uploadJSON(profileData, {
            name: `user-profile-${profileData.address || Date.now()}`,
            keyvalues: {
                type: "user-profile",
                role: profileData.role || "unknown",
                specialty: profileData.specialty || "general",
                address: profileData.address || "unknown",
            },
        })
    }

    async uploadPatientData(patientData: any): Promise<string> {
        // Ensure patient data is properly anonymized
        const anonymizedData = {
            ...patientData,
            // Remove any potential identifying information
            patientId: undefined,
            name: undefined,
            ssn: undefined,
            address: undefined,
            phone: undefined,
            email: undefined,
            // Keep only medical data
            medicalHistory: patientData.medicalHistory,
            symptoms: patientData.symptoms,
            diagnostics: patientData.diagnostics,
            demographics: {
                age: patientData.age,
                gender: patientData.gender,
                // Only general location if needed
                region: patientData.region,
            },
            timestamp: Date.now(),
        }

        return this.uploadJSON(anonymizedData, {
            name: `patient-data-${Date.now()}`,
            keyvalues: {
                type: "patient-data",
                anonymized: "true",
                age: patientData.age?.toString() || "unknown",
                gender: patientData.gender || "unknown",
            },
        })
    }
}

export const ipfsService = IPFSService.getInstance()

// Utility functions for IPFS operations
export const ipfsUtils = {
    // Validate IPFS hash format
    isValidIPFSHash: (hash: string): boolean => {
        return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || /^bafy[a-z2-7]{55}$/.test(hash)
    },

    // Extract metadata from IPFS response
    extractMetadata: (ipfsData: any) => {
        return {
            timestamp: ipfsData.metadata?.timestamp,
            type: ipfsData.metadata?.type,
            hash: ipfsData.hash,
            size: ipfsData.size,
        }
    },

    // Create IPFS URL from hash
    createIPFSUrl: (hash: string, gateway = "https://gateway.pinata.cloud/ipfs/") => {
        return `${gateway}${hash}`
    },

    // Batch upload multiple files
    batchUpload: async (files: { data: any; metadata?: any }[]): Promise<string[]> => {
        const hashes = await Promise.all(files.map(({ data, metadata }) => ipfsService.uploadJSON(data, metadata)))
        return hashes
    },
}
