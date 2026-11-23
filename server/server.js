require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const profileRoutes = require("./routes/profiles");

const app = express();

const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dinemateDB";

app.use(
  cors({
    origin: ["http://localhost:5173", "https://lab-7-1-hjs3.onrender.com`"],
    credentials: true,
  }),
);

app.use(express.json());

// Keep your existing MongoDB connection,
// routes, error handling and app.listen code unchanged.

/* ---------- MongoDB connection ---------- */
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 }) // fail fast instead of hanging for 30 s
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error(
      "Is MongoDB running?  (e.g. `mongod --dbpath ~/data/db` or the Windows service)",
    );
  });

// Answer with a clear 503 instead of hanging when the database is down
const requireDatabase = (_req, res, next) =>
  mongoose.connection.readyState === 1
    ? next()
    : res
        .status(503)
        .json({
          message:
            "Database is not connected. Start MongoDB and restart the server.",
        });

/* ---------- Routes ---------- */
app.get("/", (_req, res) => {
  res.send("MERN Stack DineMate API Running...");
});

app.use("/profiles", requireDatabase, profileRoutes);

/* ---------- Error handling ---------- */
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message]),
    );
    return res.status(400).json({ message: Object.values(errors)[0], errors });
  }
  if (err.name === "CastError")
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  if (
    /MongoNetwork|MongoServerSelection|MongooseServerSelection|MongoNotConnected|MongoTopology/.test(
      err.name,
    )
  ) {
    return res
      .status(503)
      .json({
        message:
          "Cannot reach MongoDB. Make sure it is running, then try again.",
      });
  }
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid JSON body" });
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
