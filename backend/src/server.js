require("dotenv").config();
const express = require("express");
const cors = require("cors");
const roundsRoutes = require("./routes/rounds.routes");
const verifyRoutes = require("./routes/verify.routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/rounds", roundsRoutes);
app.use("/api/verify", verifyRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
