/**
 * xorshift32 PRNG implementation
 */
class Xorshift32 {
  constructor(seed) {
    // Seed must be a non-zero 32-bit unsigned integer
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 1;
  }

  /**
   * Generates next 32-bit unsigned integer
   */
  next() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /**
   * Generates a float in range [0, 1)
   */
  nextFloat() {
    return this.next() / 4294967296.0;
  }
}

/**
 * Creates a PRNG instance seeded from a combinedSeed hex string.
 * Uses first 4 bytes (8 hex chars) as big-endian seed.
 */
function createPRNG(combinedSeedHex) {
  // Extract first 4 bytes (8 hex characters)
  const seedHex = combinedSeedHex.substring(0, 8);
  const seed = parseInt(seedHex, 16) >>> 0;
  return new Xorshift32(seed);
}

module.exports = {
  createPRNG,
  Xorshift32,
};
