pragma circom 2.1.4;

include "libs/poseidon.circom";

template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input root;

    component hashers[levels];
    signal computed[levels + 1];
    signal notPathIndices[levels];

    // Declare selectors outside the loop
    component leftSelector[levels];
    component rightSelector[levels];

    computed[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        notPathIndices[i] <== 1 - pathIndices[i];

        hashers[i] = Poseidon(2);
        leftSelector[i] = Poseidon(2);
        rightSelector[i] = Poseidon(2);

        // Left input = computed[i] when pathIndices[i] == 0, else pathElements[i]
        leftSelector[i].inputs[0] <== computed[i] * notPathIndices[i];
        leftSelector[i].inputs[1] <== pathElements[i] * pathIndices[i];

        // Right input = pathElements[i] when pathIndices[i] == 0, else computed[i]
        rightSelector[i].inputs[0] <== pathElements[i] * notPathIndices[i];
        rightSelector[i].inputs[1] <== computed[i] * pathIndices[i];

        hashers[i].inputs[0] <== leftSelector[i].out;
        hashers[i].inputs[1] <== rightSelector[i].out;

        computed[i + 1] <== hashers[i].out;
    }

    signal diff <== computed[levels] - root;
    signal output isValid <== 1 - diff * diff;
}

template PrivateConsent() {
    signal input patientSecret;
    signal input ipfsHash;
    signal input pathElements[20];
    signal input pathIndices[20];
    signal input root;

    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== patientSecret;
    leafHasher.inputs[1] <== ipfsHash;

    component mt = MerkleTreeInclusionProof(20);
    mt.leaf <== leafHasher.out;
    mt.pathElements <== pathElements;
    mt.pathIndices <== pathIndices;
    mt.root <== root;

    component nullifierGen = Poseidon(2);
    nullifierGen.inputs[0] <== patientSecret;
    nullifierGen.inputs[1] <== ipfsHash;

    signal output nullifier <== nullifierGen.out;
    signal output isValid <== mt.isValid;
}

component main {public [root]} = PrivateConsent();
