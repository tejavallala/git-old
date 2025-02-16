const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true },
    email: { type: String, trim: true },
    walletAddress: { type: String, trim: true },
    location: { type: String, trim: true },
    price: { type: Number, required: true },
    surveyNumber: { type: String, required: true },
    area: { type: Number, required: true },
    isApproved: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      inspectorId: { type: String },
      timestamp: { type: Date },
    },
    verificationComments: { type: String },
    landImages: [
      {
        data: Buffer,
        contentType: String,
      },
    ],
    status: {
      type: String,
      enum: ["available", "pending_payment", "sold"],
      default: "available",
    },
    currentBuyRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyRequest",
      default: null,
    },
  },
  {
    collection: "land",
    timestamps: true,
  }
);

module.exports = mongoose.model("Land", landSchema);
