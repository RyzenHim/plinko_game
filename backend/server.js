require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

const roundRoutes = require("./src/routes/rounds.routes");
app.use("/api/rounds", roundRoutes);

const verifyRoutes = require("./src/routes/verify.routes");
app.use("/api/verify", verifyRoutes);

app.listen(port, () => console.log("The  server is running on port :-", port));
