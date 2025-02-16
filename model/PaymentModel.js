const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    buyRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyRequest',
      required: true
    },
    landId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land',
      required: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyer',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'seller',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    transactionHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);