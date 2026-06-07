require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: [
      "https://plinko-game-eight-ashen.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());

const roundRoutes = require("./src/routes/rounds.routes");
app.use("/api/rounds", roundRoutes);

const verifyRoutes = require("./src/routes/verify.routes");
app.use("/api/verify", verifyRoutes);

app.listen(port, () => console.log("The  server is running on port :-", port));
console.log(process.env.CORS_ORIGIN);
