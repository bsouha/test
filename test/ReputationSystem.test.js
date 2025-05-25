const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationSystem Contract", function () {
    let ReputationSystem, reputationSystem, owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        ReputationSystem = await ethers.getContractFactory("ReputationSystem");
        reputationSystem = await ReputationSystem.deploy();
        await reputationSystem.waitForDeployment();
    });

    it("Should initialize expert with given score", async function () {
        const expertId = 123;
        const initialScore = 700;

        await reputationSystem.connect(owner).initializeExpert(expertId, initialScore);
        const score = await reputationSystem.getReputation(expertId);
        expect(score).to.equal(initialScore);
    });

    it("Should update expert reputation correctly", async function () {
        const expertId = 456;

        await reputationSystem.connect(owner).updateReputation(expertId, 100); // reward
        let score = await reputationSystem.getReputation(expertId);
        expect(score).to.equal(100);

        await reputationSystem.connect(owner).updateReputation(expertId, -50); // penalty
        score = await reputationSystem.getReputation(expertId);
        expect(score).to.equal(50);
    });
});