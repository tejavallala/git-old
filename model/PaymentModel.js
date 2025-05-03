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
    paymentType: {
      type: String,
      enum: ['direct', 'escrow'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'inEscrow', 'releasedToSeller', 'completed', 'failed'],
      default: 'pending'
    },
    escrowDetails: {
      receivedByInspector: {
        status: {
          type: Boolean,
          default: false
        },
        transactionHash: String,
        timestamp: Date
      },
      releasedToSeller: {
        status: {
          type: Boolean,
          default: false
        },
        transactionHash: String,
        timestamp: Date,
        inspectorAddress: String
      }
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    nftDetails: {
      tokenId: String,
      transactionHash: String,
      network: {
        type: String,
        enum: ['sepolia', 'mainnet'],
        default: 'sepolia'
      },
      mintedAt: {
        type: Date,
        default: Date.now
      },
      metadata: {
        name: String,
        description: String,
        imageUrl: String
      }
    }
  },
  {
    timestamps: true
  }
);

// Add index for faster queries
paymentSchema.index({ paymentType: 1, status: 1 });
paymentSchema.index({ 'escrowDetails.receivedByInspector.status': 1 });

module.exports = mongoose.model("Payment", paymentSchema);