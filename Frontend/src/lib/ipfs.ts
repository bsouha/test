// IPFS integration utilities
export interface IPFSConfig {
    gateway: string
    api: string
}

// You can use a public gateway or run your own IPFS node
const IPFS_CONFIG: IPFSConfig = {
    gateway: "https://ipfs.io/ipfs/",
    api: "https://api.pinata.cloud/pinning/pinJSONToIPFS", // Using Pinata as example
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
}

export interface IPFSExpertOpinion {
    diagnosis: string
    recommendations: string
    additionalTests: string
    prognosis: string
    confidence: "low" | "medium" | "high"
    submittedAt: string
    lastUpdated: string
}

// Upload data to IPFS
export async function uploadToIPFS(data: any): Promise<string> {
    try {
        // For demo purposes, we'll simulate IPFS upload
        // In production, you'd use a service like Pinata, Infura, or your own IPFS node

        const jsonData = JSON.stringify(data)
        const hash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

        // Store in localStorage for demo (simulating IPFS)
        localStorage.setItem(`ipfs_${hash}`, jsonData)

        console.log(`Data uploaded to IPFS with hash: ${hash}`)
        return hash
    } catch (error) {
        console.error("Error uploading to IPFS:", error)
        throw error
    }
}

// Retrieve data from IPFS
export async function getFromIPFS<T>(hash: string): Promise<T | null> {
    try {
        // For demo purposes, we'll retrieve from localStorage
        // In production, you'd fetch from IPFS gateway

        const data = localStorage.getItem(`ipfs_${hash}`)
        if (!data) {
            console.warn(`No data found for IPFS hash: ${hash}`)
            return null
        }

        return JSON.parse(data) as T
    } catch (error) {
        console.error("Error retrieving from IPFS:", error)
        return null
    }
}

// Upload file to IPFS (for medical attachments)
export async function uploadFileToIPFS(file: File): Promise<string> {
    try {
        // For demo purposes, we'll create a mock hash
        // In production, you'd upload the actual file

        const hash = `Qm${Math.random().toString(36).substring(2, 15)}file`

        // Store file info in localStorage for demo
        const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
        }

        localStorage.setItem(`ipfs_file_${hash}`, JSON.stringify(fileInfo))

        console.log(`File uploaded to IPFS with hash: ${hash}`)
        return hash
    } catch (error) {
        console.error("Error uploading file to IPFS:", error)
        throw error
    }
}

// Get file info from IPFS
export async function getFileFromIPFS(hash: string): Promise<any> {
    try {
        const fileInfo = localStorage.getItem(`ipfs_file_${hash}`)
        return fileInfo ? JSON.parse(fileInfo) : null
    } catch (error) {
        console.error("Error retrieving file from IPFS:", error)
        return null
    }
}

// Encrypt data before IPFS upload (for sensitive medical data)
export async function encryptAndUpload(data: any, publicKey?: string): Promise<string> {
    try {
        // For demo purposes, we'll just add a simple "encryption" marker
        // In production, you'd use proper encryption like AES or asymmetric encryption

        const encryptedData = {
            encrypted: true,
            data: btoa(JSON.stringify(data)), // Simple base64 encoding for demo
            timestamp: new Date().toISOString(),
        }

        return await uploadToIPFS(encryptedData)
    } catch (error) {
        console.error("Error encrypting and uploading:", error)
        throw error
    }
}

// Decrypt data from IPFS
export async function getAndDecrypt<T>(hash: string, privateKey?: string): Promise<T | null> {
    try {
        const encryptedData = await getFromIPFS<any>(hash)

        if (!encryptedData || !encryptedData.encrypted) {
            return encryptedData as T
        }

        // For demo purposes, we'll just decode the base64
        // In production, you'd use proper decryption
        const decryptedData = JSON.parse(atob(encryptedData.data))
        return decryptedData as T
    } catch (error) {
        console.error("Error decrypting data:", error)
        return null
    }
}
