require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
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
