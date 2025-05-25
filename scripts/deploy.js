// SPDX-License-Identifier: MIT
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy MedicalCase contract
    const MedicalCase = await hre.ethers.getContractFactory("MedicalCase");
    const medicalCase = await MedicalCase.deploy();
    await medicalCase.waitForDeployment();
    console.log("MedicalCase deployed to:", await medicalCase.getAddress());

    // Deploy ExpertOpinion contract
    const ExpertOpinion = await hre.ethers.getContractFactory("ExpertOpinion");
    const expertOpinion = await ExpertOpinion.deploy();
    await expertOpinion.waitForDeployment();
    console.log("ExpertOpinion deployed to:", await expertOpinion.getAddress());

    // Deploy ReputationSystem contract
    const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
    const reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();
    console.log("ReputationSystem deployed to:", await reputationSystem.getAddress());

    // Deploy AccessControl contract
    const AccessControl = await hre.ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    console.log("AccessControl deployed to:", await accessControl.getAddress());

    // Deploy IPFSStorage contract
    const IPFSStorage = await hre.ethers.getContractFactory("IPFSStorage");
    const ipfsStorage = await IPFSStorage.deploy();
    await ipfsStorage.waitForDeployment();
    console.log("IPFSStorage deployed to:", await ipfsStorage.getAddress());

    console.log("All contracts deployed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });