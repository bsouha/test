const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalCase Contract", function () {
    let MedicalCase, medicalCase;
    let owner, physician, otherPhysician;
    const CATEGORY = "Cardiology";
    const DURATION_DAYS = 7;

    beforeEach(async function () {
        [owner, physician, otherPhysician] = await ethers.getSigners();

        // Deploy MedicalCase contract
        MedicalCase = await ethers.getContractFactory("MedicalCase");
        medicalCase = await MedicalCase.deploy();
        await medicalCase.waitForDeployment();

        // Add physician role to test account
        await medicalCase.connect(owner).addPhysician(physician.address);
    });

    it("Should allow a physician to submit a case", async function () {
        const ipfsHash = "QmTestIPFSHash";

        // Submit case
        await medicalCase.connect(physician).submitCase(ipfsHash, CATEGORY, DURATION_DAYS);

        // Get case data
        const caseData = await medicalCase.getCase(1);

        // Destructure returned values for clarity
        const [
            caseId,
            ipfsHashReturned,
            physicianAddress,
            expiryTime,
            category,
            isOpen,
            timestamp
        ] = caseData;

        // Assertions
        expect(caseId).to.equal(1);
        expect(ipfsHashReturned).to.equal(ipfsHash);
        expect(physicianAddress).to.equal(physician.address);
        expect(category).to.equal(CATEGORY);
        expect(isOpen).to.be.true;
    });

    it("Should increment case ID correctly", async function () {
        // Submit two cases
        await medicalCase.connect(physician).submitCase("hash1", "Neurology", 5);
        await medicalCase.connect(physician).submitCase("hash2", "Dermatology", 10);

        // Fetch second case
        const caseData = await medicalCase.getCase(2);

        const [
            caseId,
            ipfsHashReturned,
            ,
            ,
            category
        ] = caseData;

        // Assertions
        expect(caseId).to.equal(2);
        expect(ipfsHashReturned).to.equal("hash2");
        expect(category).to.equal("Dermatology");
    });

    it("Should not allow non-physicians to submit cases", async function () {
        await expect(
            medicalCase.connect(otherPhysician).submitCase("invalidHash", CATEGORY, DURATION_DAYS)
        ).to.be.revertedWith("Caller is not an authorized physician");
    });

    it("Should return correct expert count", async function () {
        // Submit case
        await medicalCase.connect(physician).submitCase("case1", CATEGORY, DURATION_DAYS);

        // Assign expert
        await medicalCase.connect(owner).assignExpert(1, 101); // caseId=1, expertId=101

        // Check expert count
        const count = await medicalCase.getExpertCount(1);
        expect(count).to.equal(1);
    });
});