const mongoose = require("mongoose");

/**
 * Dining Profile – one saved set of restaurant preferences.
 * Collection name in MongoDB: "profiles"  (Mongoose pluralises the model name)
 */
const profileSchema = new mongoose.Schema(
  {
    profileName: {
      type: String,
      required: [true, "Profile name is required"],
      trim: true,
      minlength: [3, "Profile name must be at least 3 characters"],
      maxlength: [60, "Profile name must be 60 characters or fewer"],
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [80, "Destination must be 80 characters or fewer"],
    },
    cuisine: { type: String, enum: ["", "Indian", "Italian", "Chinese", "Asian", "Mexican"], default: "" },
    budget: { type: String, enum: ["", "budget", "moderate", "premium"], default: "" },
    dietary: { type: String, enum: ["", "vegetarian", "vegan", "gluten free"], default: "" },
    groupSize: {
      type: String,
      required: [true, "Group size is required"],
      enum: { values: ["1", "2", "4", "6+"], message: "Group size must be 1, 2, 4 or 6+" },
    },
    ambience: { type: String, enum: ["", "Casual", "Romantic", "Family", "Business"], default: "" },
    notes: { type: String, trim: true, maxlength: [500, "Notes must be 500 characters or fewer"], default: "" },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    toJSON: {
      versionKey: false,
      // The React app uses `id`, so expose MongoDB's _id under that name
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Profile", profileSchema);
