const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IPFSStorage Contract", function () {
    let IPFSStorage, ipfsStorage, owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        IPFSStorage = await ethers.getContractFactory("IPFSStorage");
        ipfsStorage = await IPFSStorage.deploy();
        await ipfsStorage.waitForDeployment();
    });

    it("Should store and retrieve case data hash", async function () {
        const caseId = 1;
        const ipfsHash = "QmCaseHash";

        await ipfsStorage.storeCaseData(caseId, ipfsHash);
        const storedHash = await ipfsStorage.getCaseDataHash(caseId);
        expect(storedHash).to.equal(ipfsHash);
    });

    it("Should store and retrieve expert opinion hash", async function () {
        const opinionId = 1;
        const ipfsHash = "QmOpinionHash";

        await ipfsStorage.storeOpinion(opinionId, ipfsHash);
        const storedHash = await ipfsStorage.getOpinionHash(opinionId);
        expect(storedHash).to.equal(ipfsHash);
    });
});