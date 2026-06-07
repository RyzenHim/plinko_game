const crypto = require("crypto");

/**
 * Generates a SHA256 hash.
 * @param {string} data - The string to hash.
 * @returns {string} - The hex-encoded hash.
 */
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generates the commitHex for a round.
 * commitHex = SHA256(serverSeed + ":" + nonce)
 */
function generateCommit(serverSeed, nonce) {
  return sha256(`${serverSeed}:${nonce}`);
}

/**
 * Generates the combinedSeed for a round.
 * combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 */
function generateCombinedSeed(serverSeed, clientSeed, nonce) {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

module.exports = {
  sha256,
  generateCommit,
  generateCombinedSeed,
};
