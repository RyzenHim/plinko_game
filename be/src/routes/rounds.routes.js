const router = require("express").Router();

router.post("/commit", commitRound);

router.post("/:id/start", startRound);

router.post("/:id/reveal", revealRound);

router.get("/:id", getRound);

router.get("/", getRecentRounds);

module.exports = router;
