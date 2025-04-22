const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  landId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'seller',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'buyer',
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  sellerVerificationPhoto: {
    data: Buffer,
    contentType: String,
    capturedAt: Date
  },
  buyerVerificationPhoto: {
    data: Buffer,
    contentType: String,
    capturedAt: Date
  },
  documentHash: {
    type: String,
    sparse: true
  },
  transferCertificate: {
    data: Buffer,
    contentType: String,
    generatedAt: Date
  },
  verificationDetails: {
    date: Date,
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inspector'
    },
    sellerPhoto: {
      data: Buffer,
      contentType: String,
      capturedAt: Date
    },
    buyerPhoto: {
      data: Buffer,
      contentType: String,
      capturedAt: Date
    }
  },
  transferStatus: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    sparse: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
transferRequestSchema.index({ documentHash: 1 });
transferRequestSchema.index({ 'verificationDetails.date': 1 });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);