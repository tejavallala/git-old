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
}, {
  timestamps: true
});

module.exports = mongoose.model('TransferRequest', transferRequestSchema);