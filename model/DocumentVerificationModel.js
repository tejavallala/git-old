const mongoose = require("mongoose");

const documentVerificationSchema = new mongoose.Schema({
  documentHash: {
    type: String,
    required: true,
    unique: true
  },
  
  landId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'land',
    required: true
  },
  
  transferRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transferrequest',
    required: true
  },
  
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  
  verifiedBy: {
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inspector'
    },
    timestamp: Date
  },
  
  status: {
    type: String,
    enum: ['valid', 'invalid', 'expired'],
    default: 'valid'
  }
}, { timestamps: true });



module.exports = mongoose.model("DocumentVerification", documentVerificationSchema);