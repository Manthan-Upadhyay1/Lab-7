const express = require("express");
const mongoose = require("mongoose");
const Profile = require("../models/Profile");

const router = express.Router();

// Only these fields can be written by a client (protects _id, createdAt, etc.)
const WRITABLE = [
  "profileName", "destination", "cuisine", "budget", "dietary",
  "groupSize", "ambience", "notes", "latitude", "longitude",
];
const pickWritable = (body = {}) =>
  Object.fromEntries(WRITABLE.filter((field) => field in body).map((field) => [field, body[field]]));

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Wrap async handlers so a rejected promise reaches the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Reject malformed ids before they hit MongoDB
router.param("id", (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : res.status(400).json({ message: "Invalid profile id" }),
);

/* READ – all profiles, newest first */
router.get("/", wrap(async (_req, res) => {
  res.json(await Profile.find().sort({ createdAt: -1 }));
}));

/* SEARCH – case-insensitive match across the text fields (declared before /:id) */
router.get("/search/:name", wrap(async (req, res) => {
  const pattern = new RegExp(escapeRegex(req.params.name.trim()), "i");
  const fields = ["profileName", "destination", "cuisine", "dietary", "ambience", "notes"];
  res.json(await Profile.find({ $or: fields.map((f) => ({ [f]: pattern })) }).sort({ createdAt: -1 }));
}));

/* CREATE */
router.post("/", wrap(async (req, res) => {
  const profile = await Profile.create(pickWritable(req.body));
  res.status(201).json(profile);
}));

/* UPDATE */
router.put("/:id", wrap(async (req, res) => {
  const profile = await Profile.findByIdAndUpdate(
    req.params.id,
    { $set: pickWritable(req.body) },
    { new: true, runValidators: true },
  );
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json(profile);
}));

/* DELETE */
router.delete("/:id", wrap(async (req, res) => {
  const profile = await Profile.findByIdAndDelete(req.params.id);
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json({ message: "Profile deleted successfully", id: req.params.id });
}));

module.exports = router;
