const plinkoService = require("../services/plinko.service");
const hashService = require("../services/hash.service");

async function verifyRound(req, res) {
  const { serverSeed, clientSeed, nonce, dropColumn } = req.query;

  if (!serverSeed || !clientSeed || !nonce || dropColumn === undefined) {
    return res
      .status(400)
      .json({ error: "Missing required verification parameters." });
  }

  try {
    const dc = parseInt(dropColumn, 10);
    const commitHex = hashService.generateCommit(serverSeed, nonce);

    const { combinedSeed, outcome } = plinkoService.executeRound({
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: dc,
    });

    return res.status(200).json({
      commitHex,
      combinedSeed,
      pegMapHash: outcome.pegMapHash,
      binIndex: outcome.binIndex,
      // Adding path for frontend verifier to render replay
      path: outcome.path,
    });
  } catch (error) {
    console.error("Verify Error:", error);
    return res.status(500).json({ error: "Failed to verify round." });
  }
}

module.exports = {
  verifyRound,
};
