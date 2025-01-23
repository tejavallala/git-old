const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Seller name
    phoneNumber: { type: String, trim: true },
    location: { type: String, trim: true }, // Fixed typo from "locatin"
    price: { type: Number, required: true },
    surveyNumber: { type: String, required: true },
    area: { type: Number, required: true }, // in sqft
    isApproved: { type: Boolean, default: false }, // Approval status
    approvedBy: { type: String, trim: true }, // Admin ID or email
    approvalDate: { type: Date },
    owner: { type: String, required: true, trim: true }, // Ethereum address
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    landImages: [
      {
        data: Buffer,
        contentType: String,
      },
    ],
    history: [
      {
        date: { type: Date, default: Date.now },
        action: { type: String, enum: ["Created", "Approved", "Transferred"] },
        performedBy: { type: String }, // Admin or User ID
      },
    ],
  },
  {
    collection: "land",
    timestamps: true, 
  }
);

module.exports = mongoose.model("Land", landSchema);
