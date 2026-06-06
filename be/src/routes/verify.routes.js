const router = require("express").Router();

router.get("/", verifyRound);

module.exports = router;
