// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccessControl.sol";

contract PatientData is Ownable {
    struct PatientProfile {
        address wallet;
        string preferences;
        bool consentGiven;
        string ipfsHash;
        bool exists;
    }

    mapping(address => PatientProfile) public patientProfiles;
    AccessControl private accessControl;

    event ConsentUpdated(address indexed patient, bool consentGiven);
    event PatientRegistered(address indexed patient, string ipfsHash);
    event PatientDataUpdated(address indexed patient, string newPreferences, string newIpfsHash);

    constructor() Ownable(msg.sender) {}

    function setAccessControlAddress(address _addr) external onlyOwner {
        accessControl = AccessControl(_addr);
    }

    function registerPatient(
        address patientWallet,
        string memory preferences,
        string memory ipfsHash
    ) external onlyOwner {
        require(accessControl.isPatient(patientWallet), "Only registered patients can be added");
        require(!patientProfiles[patientWallet].exists, "Patient already registered");

        patientProfiles[patientWallet] = PatientProfile({
            wallet: patientWallet,
            preferences: preferences,
            consentGiven: false,
            ipfsHash: ipfsHash,
            exists: true
        });

        emit PatientRegistered(patientWallet, ipfsHash);
    }

    function updatePatientData(
        string memory newPreferences,
        string memory newIpfsHash
    ) external {
        require(accessControl.isPatient(msg.sender), "Only patients can update data");
        require(patientProfiles[msg.sender].exists, "Patient not registered");

        patientProfiles[msg.sender].preferences = newPreferences;
        patientProfiles[msg.sender].ipfsHash = newIpfsHash;

        emit PatientDataUpdated(msg.sender, newPreferences, newIpfsHash);
    }

    function giveConsent(bool _consent) external {
        require(accessControl.isPatient(msg.sender), "Only patients can update consent");
        require(patientProfiles[msg.sender].exists, "Patient not registered");

        patientProfiles[msg.sender].consentGiven = _consent;
        emit ConsentUpdated(msg.sender, _consent);
    }

    function getConsentStatus(address patient) external view returns (bool) {
        return patientProfiles[patient].consentGiven;
    }

    function getPatientProfile(address patient)
        external
        view
        returns (
            address wallet,
            string memory preferences,
            bool consentGiven,
            string memory ipfsHash
        )
    {
        require(patientProfiles[patient].exists, "Patient not registered");
        PatientProfile memory profile = patientProfiles[patient];
        return (profile.wallet, profile.preferences, profile.consentGiven, profile.ipfsHash);
    }
}
