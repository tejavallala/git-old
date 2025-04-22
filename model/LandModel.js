const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'seller', 
      required: true
    },
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
      enum: ["available", "sold", "transferred"],
      default: "available",
    },
    currentOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyer',
      default: null
    },
    previousOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'seller',
      default: null
    },
    lastTransactionDate: {
      type: Date,
      default: null
    },
    lastTransactionHash: {
      type: String,
      default: null
    },
    currentBuyRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyRequest",
      default: null,
    },
    transferDocumentHash: {
      type: String,
      sparse: true  // Allows null/undefined values
    },
    lastTransferDate: {
      type: Date,
      sparse: true
    },
    transferHistory: [{
      documentHash: String,
      transferDate: Date,
      buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'buyer'
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'seller'
      },
      transactionHash: String
    }]
  },
  {
    collection: "land",
    timestamps: true,
  }
);

module.exports = mongoose.model("Land", landSchema);
