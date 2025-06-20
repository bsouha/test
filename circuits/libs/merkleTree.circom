pragma circom 2.0.0;

include "poseidon.circom";

template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input root;

    component hashers[levels];
    signal computed[levels+1];
    
    computed[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        // If pathIndices[i] == 0, current is left, sibling is right
        hashers[i].inputs[0] <== pathIndices[i] == 0 ? computed[i] : pathElements[i];
        hashers[i].inputs[1] <== pathIndices[i] == 0 ? pathElements[i] : computed[i];
        
        computed[i+1] <== hashers[i].out;
    }
    
    // Final check
    computed[levels] === root;
}