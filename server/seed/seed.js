// Loads the 6 sample profiles into MongoDB.   Usage:  npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const sample = require("./profiles.json");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dinemateDB");
    await Profile.deleteMany({});
    // Go through the raw collection so the original createdAt dates are kept
    await Profile.collection.insertMany(
      sample.map((p) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })),
    );
    console.log(`Seeded ${sample.length} profiles into "${mongoose.connection.name}"`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
