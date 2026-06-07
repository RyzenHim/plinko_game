const express = require("express");
const router = express.Router();
const roundsController = require("../controllers/rounds.controller");

router.post("/commit", roundsController.commitRound);
router.post("/:id/start", roundsController.startRound);
router.post("/:id/reveal", roundsController.revealRound);
router.get("/:id", roundsController.getRound);

module.exports = router;
