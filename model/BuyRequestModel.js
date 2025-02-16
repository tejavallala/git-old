const mongoose = require("mongoose");

const buyRequestSchema = new mongoose.Schema(
  {
    landId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Land', 
      required: true 
    },
    buyerId: { 
      type: mongoose.Schema.Types.ObjectId,  // Changed from String to ObjectId
      ref: 'buyer',  // Add reference to User model
      required: true 
    },
    sellerId: { 
      type: mongoose.Schema.Types.ObjectId,  // Changed from String to ObjectId
      ref: 'seller',  // Add reference to User model
      required: true 
    },
    requestDate: { 
      type: Date, 
      default: Date.now 
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    inspectorComments: String,
    verifiedBy: {
      inspectorId: String,
      timestamp: Date
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentDate: {
      type: Date
    },
    transactionHash: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BuyRequest", buyRequestSchema);