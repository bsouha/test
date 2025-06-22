// Pinata IPFS integration
export interface PinataConfig {
    apiKey: string
    apiSecret: string
    jwt: string
    gateway: string
}

// You'll need to get these from your Pinata dashboard
const PINATA_CONFIG: PinataConfig = {
    apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
    apiSecret: process.env.NEXT_PUBLIC_PINATA_API_SECRET || "",
    jwt: process.env.NEXT_PUBLIC_PINATA_JWT || "",
    gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
}

export interface PinataResponse {
    IpfsHash: string
    PinSize: number
    Timestamp: string
}

export interface IPFSUserProfile {
    name: string
    specialty: string
    email?: string
    licenseNumber?: string
    institution?: string
    bio?: string
    avatar?: string
    registeredAt: string
    isActive: boolean
    role: number
}

export interface IPFSMedicalCase {
    title: string
    specialty: string
    urgency: "low" | "medium" | "high" | "critical"
    symptoms: string
    medicalHistory: string
    currentTreatment: string
    specificQuestions: string
    attachments: string[] // IPFS hashes of files
    submittedAt: string
    lastUpdated: string
    physicianAddress: string
    physicianName: string
}

export interface IPFSExpertOpinion {
    caseId: string
    expertAddress: string
    expertName: string
    expertSpecialty: string
    diagnosis: string
    recommendations: string
    additionalTests: string
    prognosis: string
    confidence: "low" | "medium" | "high"
    submittedAt: string
    lastUpdated: string
}

// Upload JSON data to Pinata IPFS
export async function uploadJSONToPinata(data: any, name?: string): Promise<string> {
    try {
        if (!PINATA_CONFIG.jwt) {
            // Fallback to localStorage for demo if no Pinata credentials
            console.warn("No Pinata JWT found, using localStorage fallback")
            return uploadToLocalStorage(data)
        }

        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PINATA_CONFIG.jwt}`,
            },
            body: JSON.stringify({
                pinataContent: data,
                pinataMetadata: {
                    name: name || `medical-dapp-${Date.now()}`,
                    keyvalues: {
                        app: "medical-consultation-dapp",
                        timestamp: new Date().toISOString(),
                    },
                },
                pinataOptions: {
                    cidVersion: 1,
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`Pinata API error: ${response.statusText}`)
        }

        const result: PinataResponse = await response.json()
        console.log(`Data uploaded to Pinata IPFS: ${result.IpfsHash}`)
        return result.IpfsHash
    } catch (error) {
        console.error("Error uploading to Pinata:", error)
        // Fallback to localStorage for demo
        return uploadToLocalStorage(data)
    }
}

// Upload file to Pinata IPFS
export async function uploadFileToPinata(file: File): Promise<string> {
    try {
        if (!PINATA_CONFIG.jwt) {
            console.warn("No Pinata JWT found, using localStorage fallback")
            return uploadFileToLocalStorage(file)
        }

        const formData = new FormData()
        formData.append("file", file)

        const metadata = JSON.stringify({
            name: `medical-file-${file.name}`,
            keyvalues: {
                app: "medical-consultation-dapp",
                filename: file.name,
                filetype: file.type,
                timestamp: new Date().toISOString(),
            },
        })
        formData.append("pinataMetadata", metadata)

        const options = JSON.stringify({
            cidVersion: 1,
        })
        formData.append("pinataOptions", options)

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_CONFIG.jwt}`,
            },
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Pinata API error: ${response.statusText}`)
        }

        const result: PinataResponse = await response.json()
        console.log(`File uploaded to Pinata IPFS: ${result.IpfsHash}`)
        return result.IpfsHash
    } catch (error) {
        console.error("Error uploading file to Pinata:", error)
        return uploadFileToLocalStorage(file)
    }
}

// Retrieve data from Pinata IPFS
export async function getFromPinata<T>(hash: string): Promise<T | null> {
    try {
        const url = `${PINATA_CONFIG.gateway}${hash}`
        const response = await fetch(url)

        if (!response.ok) {
            // Fallback to localStorage
            return getFromLocalStorage<T>(hash)
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error("Error retrieving from Pinata:", error)
        // Fallback to localStorage
        return getFromLocalStorage<T>(hash)
    }
}

// Encrypt data before uploading (for sensitive medical data)
export async function encryptAndUploadToPinata(data: any, name?: string): Promise<string> {
    try {
        // Simple encryption for demo - in production use proper encryption
        const encryptedData = {
            encrypted: true,
            data: btoa(JSON.stringify(data)), // Base64 encoding for demo
            timestamp: new Date().toISOString(),
            version: "1.0",
        }

        return await uploadJSONToPinata(encryptedData, `encrypted-${name}`)
    } catch (error) {
        console.error("Error encrypting and uploading:", error)
        throw error
    }
}

// Decrypt data from Pinata IPFS
export async function getAndDecryptFromPinata<T>(hash: string): Promise<T | null> {
    try {
        const encryptedData = await getFromPinata<any>(hash)

        if (!encryptedData) {
            return null
        }

        if (!encryptedData.encrypted) {
            return encryptedData as T
        }

        // Simple decryption for demo - in production use proper decryption
        const decryptedData = JSON.parse(atob(encryptedData.data))
        return decryptedData as T
    } catch (error) {
        console.error("Error decrypting data:", error)
        return null
    }
}

// Fallback functions for localStorage (when Pinata is not configured)
function uploadToLocalStorage(data: any): string {
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(`ipfs_${hash}`, JSON.stringify(data))
    console.log(`Data stored locally with hash: ${hash}`)
    return hash
}

function uploadFileToLocalStorage(file: File): string {
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}file`
    const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
    }
    localStorage.setItem(`ipfs_file_${hash}`, JSON.stringify(fileInfo))
    console.log(`File info stored locally with hash: ${hash}`)
    return hash
}

function getFromLocalStorage<T>(hash: string): T | null {
    try {
        const data = localStorage.getItem(`ipfs_${hash}`)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error("Error retrieving from localStorage:", error)
        return null
    }
}

// Test Pinata connection
export async function testPinataConnection(): Promise<boolean> {
    try {
        if (!PINATA_CONFIG.jwt) {
            console.warn("No Pinata JWT configured")
            return false
        }

        const response = await fetch("https://api.pinata.cloud/data/testAuthentication", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PINATA_CONFIG.jwt}`,
            },
        })

        const result = await response.json()
        console.log("Pinata connection test:", result)
        return response.ok
    } catch (error) {
        console.error("Pinata connection test failed:", error)
        return false
    }
}
