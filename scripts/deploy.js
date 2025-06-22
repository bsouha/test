// scripts/deploy.js
// SPDX-License-Identifier: MIT
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // --- Step 1: Deploy Core Contracts ---

    const AccessControl = await hre.ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    console.log("AccessControl deployed to:", await accessControl.getAddress());

    const MedicalCase = await hre.ethers.getContractFactory("MedicalCase");
    const medicalCase = await MedicalCase.deploy();
    await medicalCase.waitForDeployment();
    console.log("MedicalCase deployed to:", await medicalCase.getAddress());

    const ExpertOpinion = await hre.ethers.getContractFactory("ExpertOpinion");
    const expertOpinion = await ExpertOpinion.deploy();
    await expertOpinion.waitForDeployment();
    console.log("ExpertOpinion deployed to:", await expertOpinion.getAddress());

    const IPFSStorage = await hre.ethers.getContractFactory("IPFSStorage");
    const ipfsStorage = await IPFSStorage.deploy();
    await ipfsStorage.waitForDeployment();
    console.log("IPFSStorage deployed to:", await ipfsStorage.getAddress());

    const PatientData = await hre.ethers.getContractFactory("PatientData");
    const patientData = await PatientData.deploy();
    await patientData.waitForDeployment();
    console.log("PatientData deployed to:", await patientData.getAddress());

    const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
    const reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();
    console.log("ReputationSystem deployed to:", await reputationSystem.getAddress());

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();
    console.log("Voting deployed to:", await voting.getAddress());

    // --- Step 2: Set Contract Dependencies ---

    // Set AccessControl in MedicalCase
    await medicalCase.setAccessControlAddress(await accessControl.getAddress());
    console.log("MedicalCase set AccessControl address");

    // Set dependencies in ExpertOpinion
    await expertOpinion.setMedicalCaseAddress(await medicalCase.getAddress());
    await expertOpinion.setVotingAddress(await voting.getAddress());
    console.log("ExpertOpinion set dependencies");

    // Set authorized contracts in IPFSStorage
    await ipfsStorage.setAuthorizedContracts(
        await medicalCase.getAddress(),
        await expertOpinion.getAddress()
    );
    console.log("IPFSStorage set authorized addresses");

    // Set AccessControl in PatientData
    await patientData.setAccessControlAddress(await accessControl.getAddress());
    console.log("PatientData set AccessControl address");

    // Set contract dependencies in Voting
    await voting.setContracts(
        await accessControl.getAddress(),
        await medicalCase.getAddress(),
        await reputationSystem.getAddress()
    );
    console.log("Voting set contract addresses");

    // Optional: Initialize some experts in ReputationSystem (example)
    // await reputationSystem.initializeExpert(1, 800); // expertId = 1, starting score = 800
    // await reputationSystem.initializeExpert(2, 750);

    console.log("✅ All contracts deployed and linked successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });