const hashService = require("./hash.service");
const prngService = require("./prng.service");

/**
 * Deterministic Plinko Engine
 */

const ROWS = 12;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Generates the outcome of a Plinko round.
 */
function executeRound({ serverSeed, clientSeed, nonce, dropColumn }) {
  const combinedSeed = hashService.generateCombinedSeed(serverSeed, clientSeed, nonce);
  const prng = prngService.createPRNG(combinedSeed);

  // 1. Generate Peg Map
  // Row r (0-indexed) has r+1 pegs
  const pegMap = [];
  for (let r = 0; r < ROWS; r++) {
    const rowPegs = [];
    for (let p = 0; p <= r; p++) {
      const rnd = prng.nextFloat();
      const leftBias = parseFloat((0.5 + (rnd - 0.5) * 0.2).toFixed(6));
      rowPegs.push(leftBias);
    }
    pegMap.push(rowPegs);
  }

  const pegMapHash = hashService.sha256(JSON.stringify(pegMap));

  // 2. Play the Round
  const path = [];
  let pos = 0; // Number of Right moves (determines binIndex)

  for (let r = 0; r < ROWS; r++) {
    const pegIndex = Math.min(pos, r);
    const leftBias = pegMap[r][pegIndex];
    
    // Drop column adjustment
    const adj = (dropColumn - 6) * 0.01;
    const biasPrime = clamp(leftBias + adj, 0, 1);

    const rnd = prng.nextFloat();
    let move = "";
    if (rnd < biasPrime) {
      move = "LEFT";
      // pos remains same
    } else {
      move = "RIGHT";
      pos++;
    }
    
    path.push({
      row: r,
      pegIndex,
      move,
      rnd,
      biasPrime
    });
  }

  return {
    combinedSeed,
    outcome: {
      pegMapHash,
      binIndex: pos,
      path,
    }
  };
}

module.exports = {
  executeRound,
};
