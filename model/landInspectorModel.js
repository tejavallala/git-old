const mongoose = require("mongoose");

const landInspectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LandInspector = mongoose.model("LandInspector", landInspectorSchema);

module.exports = LandInspector;  // Export the model directly