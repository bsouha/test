pragma circom 2.1.4;

include "libs/poseidon.circom";

template RoleVerification() {
    signal input secretSalt;
    signal input role; // 1=Patient, 2=Expert, 3=Physician
    signal input storedCommitment;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== secretSalt;
    poseidon.inputs[1] <== role;

    // Quadratic role validation
    signal role1 <== (role - 1);
    signal role2 <== (role - 2);
    signal role3 <== (role - 3);
    
    // Product will be 0 if role is 1, 2 or 3
    component mul12 = Multiplier();
    mul12.a <== role1;
    mul12.b <== role2;
    
    component mul123 = Multiplier();
    mul123.a <== mul12.out;
    mul123.b <== role3;
    
    // Final validation (1 when valid, 0 when invalid)
    signal roleValid <== 1 - mul123.out * mul123.out;

    // Commitment check
    signal commitmentValid <== poseidon.out - storedCommitment;
    
    // Final output (using AND gate pattern)
    signal output isValid <== roleValid + (1 - commitmentValid * commitmentValid) - 1;
}

template Multiplier() {
    signal input a;
    signal input b;
    signal output out <== a * b;
}

component main {public [storedCommitment]} = RoleVerification();