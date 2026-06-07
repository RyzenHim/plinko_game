import { describe, it, expect } from "vitest";
const hashService = require("./hash.service");
const prngService = require("./prng.service");
const plinkoService = require("./plinko.service");

describe("Plinko Lab Fairness & Engine", () => {
  
  // 1. SHA256 Correctness
  it("should generate correct SHA256 hashes", () => {
    const hash = hashService.sha256("hello");
    // Expected SHA256 of "hello"
    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  // 2. xorshift32 Reproducibility
  it("should produce deterministic PRNG sequence for a given seed", () => {
    const seedHex = "abc12345"; // first 4 bytes of some combinedSeed
    const prng1 = prngService.createPRNG(seedHex);
    const prng2 = prngService.createPRNG(seedHex);

    const seq1 = [prng1.nextFloat(), prng1.nextFloat(), prng1.nextFloat()];
    const seq2 = [prng2.nextFloat(), prng2.nextFloat(), prng2.nextFloat()];

    expect(seq1).toEqual(seq2);
    expect(seq1[0]).toBeGreaterThanOrEqual(0);
    expect(seq1[0]).toBeLessThan(1);
  });

  // 3. Deterministic Engine Replay
  it("should produce the same outcome for identical inputs", () => {
    const inputs = {
      serverSeed: "ss-1",
      clientSeed: "cs-1",
      nonce: "n-1",
      dropColumn: 6
    };

    const run1 = plinkoService.executeRound(inputs);
    const run2 = plinkoService.executeRound(inputs);

    expect(run1.combinedSeed).toBe(run2.combinedSeed);
    expect(run1.outcome.binIndex).toBe(run2.outcome.binIndex);
    expect(run1.outcome.pegMapHash).toBe(run2.outcome.pegMapHash);
    expect(run1.outcome.path).toEqual(run2.outcome.path);
  });

  // 4. Commit-Reveal Validation
  it("should verify that commitHex matches (serverSeed + nonce)", () => {
    const serverSeed = "secret-server-seed";
    const nonce = "42";
    const commitHex = hashService.generateCommit(serverSeed, nonce);
    
    // Verifier side
    const recomputedCommit = hashService.sha256(`${serverSeed}:${nonce}`);
    expect(commitHex).toBe(recomputedCommit);
  });

  // 5. Test Vectors (based on PDF example)
  // PDF Inputs:
  // serverSeed = "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc"
  // nonce = "42"
  // clientSeed = "candidate-hello"
  it("should match official test vectors for commitHex and combinedSeed", () => {
    const serverSeed = "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc";
    const nonce = "42";
    const clientSeed = "candidate-hello";

    const commitHex = hashService.generateCommit(serverSeed, nonce);
    const combinedSeed = hashService.generateCombinedSeed(serverSeed, clientSeed, nonce);

    // From PDF:
    // commitHex = bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34
    // combinedSeed = e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0
    
    expect(commitHex).toBe("bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34");
    expect(combinedSeed).toBe("e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0");
  });
});
