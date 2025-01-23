const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema(
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
  },
  {
    collection: "AdminAccountRegistrations",
  }
);
module.exports = mongoose.model("Admin", adminSchema);
