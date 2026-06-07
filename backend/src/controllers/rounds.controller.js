const prisma = require("../prisma/client");
const hashService = require("../services/hash.service");
const prngService = require("../services/prng.service");
const plinkoService = require("../services/plinko.service");
const { v4: uuidv4 } = require("uuid");

/**
 * POST /api/rounds/commit
 * Creates a round with a serverSeed and nonce.
 */
async function commitRound(req, res) {
  try {
    const serverSeed = uuidv4();
    const nonce = uuidv4();
    const commitHex = hashService.generateCommit(serverSeed, nonce);

    const round = await prisma.round.create({
      data: {
        serverSeed,
        nonce,
        commitHex,
        status: "CREATED",
        clientSeed: "",
        combinedSeed: "",
        pegMapHash: "",
        rows: 12,
        dropColumn: 0,
        binIndex: 0,
        payoutMultiplier: 0,
        betCents: 0,
        pathJson: {},
      },
    });

    return res.status(201).json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error("Commit Error:", error);
    return res.status(500).json({ error: "Failed to commit round." });
  }
}

/**
 * POST /api/rounds/:id/start
 * Executes the round with the provided clientSeed.
 */
async function startRound(req, res) {
  const { id } = req.params;
  const { clientSeed, betCents, dropColumn } = req.body;

  try {
    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: "Round not found." });
    }

    if (round.status !== "CREATED") {
      return res.status(400).json({ error: "Round already started or revealed." });
    }

    const { combinedSeed, outcome } = plinkoService.executeRound({
      serverSeed: round.serverSeed,
      clientSeed,
      nonce: round.nonce,
      dropColumn,
    });

    const PAYOUTS = [10, 5, 3, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 3, 5, 10];
    const payoutMultiplier = PAYOUTS[outcome.binIndex];

    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: "STARTED",
        clientSeed,
        combinedSeed,
        pegMapHash: outcome.pegMapHash,
        dropColumn,
        binIndex: outcome.binIndex,
        payoutMultiplier,
        betCents,
        pathJson: outcome.path,
      },
    });

    return res.status(200).json({
      pegMapHash: updatedRound.pegMapHash,
      rows: updatedRound.rows,
      binIndex: updatedRound.binIndex,
    });
  } catch (error) {
    console.error("Start Error:", error);
    return res.status(500).json({ error: "Failed to start round." });
  }
}

/**
 * POST /api/rounds/:id/reveal
 * Reveals the serverSeed for verification.
 */
async function revealRound(req, res) {
  const { id } = req.params;

  try {
    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: "Round not found." });
    }

    if (round.status !== "STARTED") {
      return res.status(400).json({ error: "Round must be started first." });
    }

    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: "REVEALED",
        revealedAt: new Date(),
      },
    });

    return res.status(200).json({
      serverSeed: updatedRound.serverSeed,
    });
  } catch (error) {
    console.error("Reveal Error:", error);
    return res.status(500).json({ error: "Failed to reveal round." });
  }
}

/**
 * GET /api/rounds/:id
 * Returns full round details.
 */
async function getRound(req, res) {
  const { id } = req.params;

  try {
    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: "Round not found." });
    }

    return res.status(200).json(round);
  } catch (error) {
    console.error("Get Round Error:", error);
    return res.status(500).json({ error: "Failed to fetch round." });
  }
}

module.exports = {
  commitRound,
  startRound,
  revealRound,
  getRound,
};
