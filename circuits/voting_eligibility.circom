pragma circom 2.1.4;

include "libs/poseidon.circom";
include "libs/comparators.circom";

// Import ExpertEligibility WITHOUT its main component
template ImportedExpertEligibility() {
    signal input expertId;
    signal input reputationScore;
    signal input specialtyHash;
    signal input caseId;
    signal input minReputation;
    signal input requiredSpecialtyHash;

    component hashSpecialty = Poseidon(1);
    hashSpecialty.inputs[0] <== specialtyHash;
    
    component hashNullifier = Poseidon(2);
    hashNullifier.inputs[0] <== expertId;
    hashNullifier.inputs[1] <== caseId;

    signal specialtyMatch <== hashSpecialty.out - requiredSpecialtyHash;
    signal specialtyValid <== 1 - specialtyMatch*specialtyMatch;

    component repCheck = GreaterEqThan(32);
    repCheck.in[0] <== reputationScore;
    repCheck.in[1] <== minReputation;

    signal output nullifier <== hashNullifier.out;
    signal output isValid <== specialtyValid * repCheck.out;
}

template VotingEligibility() {
    // Inputs
    signal input expertId;
    signal input reputationScore;
    signal input specialtyHash;
    signal input caseId;
    signal input minReputation;
    signal input requiredSpecialtyHash;
    signal input expiryTimestamp;
    signal input currentTimestamp;

    // Use imported template (not the original ExpertEligibility)
    component expertCheck = ImportedExpertEligibility();
    expertCheck.expertId <== expertId;
    expertCheck.reputationScore <== reputationScore;
    expertCheck.specialtyHash <== specialtyHash;
    expertCheck.caseId <== caseId;
    expertCheck.minReputation <== minReputation;
    expertCheck.requiredSpecialtyHash <== requiredSpecialtyHash;

    // Time validation
    component timeCheck = LessThan(32);
    timeCheck.in[0] <== currentTimestamp;
    timeCheck.in[1] <== expiryTimestamp;

    // Outputs
    signal output nullifier <== expertCheck.nullifier;
    signal output isValid <== expertCheck.isValid * timeCheck.out;
}

// Single main component
component main {public [caseId, minReputation, requiredSpecialtyHash, expiryTimestamp, currentTimestamp]} = VotingEligibility();