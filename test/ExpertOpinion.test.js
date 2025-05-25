const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ExpertOpinion Contract", function () {
    let ExpertOpinion, expertOpinion, owner, expert;

    beforeEach(async function () {
        [owner, expert] = await ethers.getSigners();
        ExpertOpinion = await ethers.getContractFactory("ExpertOpinion");
        expertOpinion = await ExpertOpinion.deploy();
        await expertOpinion.waitForDeployment();

        // Register expert wallet (if used in logic)
        await expertOpinion.connect(owner).registerExpertWallet(1, expert.address);
    });

    it("Should allow expert to submit opinion", async function () {
        const caseId = 1;
        const expertId = 1;
        const opinionHash = "QmOpinionHash";

        await expertOpinion.connect(expert).submitOpinion(caseId, expertId, opinionHash);

        const opinion = await expertOpinion.getOpinionsForCase(caseId);
        expect(opinion.length).to.equal(1);
        expect(opinion[0].opinionHash).to.equal(opinionHash);
    });
});