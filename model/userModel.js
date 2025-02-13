const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    userType: { type: String, enum: ["seller", "buyer"], required: true },
    governmentId: { type: String, unique: true, trim: true },
    governmentIdImage: {
      data: Buffer,
      contentType: String,
    },
  },
  {
    collection: "UserAccountRegistrations",
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
