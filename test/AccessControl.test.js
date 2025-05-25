const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControl Contract", function () {
    let AccessControl, accessControl, owner, physician, expert;

    beforeEach(async function () {
        [owner, physician, expert] = await ethers.getSigners();
        AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy();
        await accessControl.waitForDeployment();

        await accessControl.connect(owner).assignRole(physician.address, 1); // Physician role
        await accessControl.connect(owner).assignRole(expert.address, 2);   // Expert role
    });

    it("Should assign correct roles", async function () {
        expect(await accessControl.getRole(physician.address)).to.equal(1);
        expect(await accessControl.getRole(expert.address)).to.equal(2);
    });
});