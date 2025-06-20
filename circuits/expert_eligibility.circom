pragma circom 2.1.4;

include "libs/poseidon.circom";
include "libs/comparators.circom";

template ExpertEligibility() {
    // Input signals (new syntax for Circom 2.1.4+)
    signal input expertId;
    signal input reputationScore;
    signal input specialtyHash;
    signal input caseId;
    signal input minReputation;
    signal input requiredSpecialtyHash;

    // Poseidon hashers
    component hashSpecialty = Poseidon(1);
    hashSpecialty.inputs[0] <== specialtyHash;
    
    component hashNullifier = Poseidon(2);
    hashNullifier.inputs[0] <== expertId;
    hashNullifier.inputs[1] <== caseId;

    // 1. Specialty match (quadratic check)
    signal specialtyMatch <== hashSpecialty.out - requiredSpecialtyHash;
    signal specialtyValid <== 1 - specialtyMatch*specialtyMatch;

    // 2. Reputation check (>= min)
    component repCheck = GreaterEqThan(32);
    repCheck.in[0] <== reputationScore;
    repCheck.in[1] <== minReputation;

    // Outputs
    signal output nullifier <== hashNullifier.out;
    signal output isValid <== specialtyValid * repCheck.out;
}

component main {public [caseId, minReputation, requiredSpecialtyHash]} = ExpertEligibility();