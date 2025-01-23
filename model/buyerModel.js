const mongoose=require('mongoose');

const buyerSchema = new mongoose.Schema(
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
    location: { type: String, trim: true },
    governmentId: { type: String, unique: true, trim: true },
    governmentIdImage: {
      data: Buffer,
      contentType: String,
    },
  },
  {
    collection: "BuyerAccountRegistrations",
    timestamps: true,
  }
);
module.exports = mongoose.model("buyer", buyerSchema);