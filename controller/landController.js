const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Land = require("../model/LandModel");
const BuyRequest = require("../model/BuyRequestModel");
const Payment = require("../model/PaymentModel");
const Buyer = require('../model/buyerModel');
const TransferRequest = require('../model/TransferRequestModel');
const Seller = require('../model/sellerModel');

// const nodemailer = require("nodemailer");  // Email service commented
const landRoute = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

/* Email configuration commented out
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email server is ready');
  }
});
*/

// Create new land listing
landRoute.post(
  "/create-land",
  upload.array("landImages", 5),
  async (req, res) => {
    try {
      const {
        name,
        phoneNumber,
        email,
        walletAddress,
        location,
        price,
        surveyNumber,
        area,
        userId, // Make sure this is included in the form data
      } = req.body;

      

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Please upload at least one land image" });
      }

      const newLand = new Land({
        userId, // Add this field
        name,
        phoneNumber,
        email,
        walletAddress,
        location,
        price,
        surveyNumber,
        area,
        landImages: req.files.map((file) => ({
          data: file.buffer,
          contentType: file.mimetype,
        })),
      });

      const savedLand = await newLand.save();
      console.log("Saved land:", savedLand);

      /* Email notification commented out
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Land Listing Created Successfully',
        html: `
          <h1>Land Listing Confirmation</h1>
          <p>Your land listing has been submitted for verification.</p>
          <p>Details:</p>
          <ul>
            <li>Location: ${location}</li>
            <li>Survey Number: ${surveyNumber}</li>
            <li>Area: ${area} sq ft</li>
            <li>Price: ₹${price}</li>
          </ul>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    */

      res.status(201).json({
        message: "Land listing created successfully",
        landId: savedLand._id,
      });
    } catch (error) {
      console.error("Error creating land:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// Get all land listings for verification
landRoute.get("/pending-verifications", async (req, res) => {
  try {
    const lands = await Land.find({ verificationStatus: "pending" })
      .select("-landImages.data") // Exclude image data for better performance
      .sort({ createdAt: -1 });
    res.status(200).json(lands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get specific land listing with images
landRoute.get("/land/:id", async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: "Land listing not found" });
    }
    res.status(200).json(land);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify land listing
landRoute.post("/verify-land/:id", async (req, res) => {
  try {
    const { status, comments, inspectorId } = req.body;
    const land = await Land.findById(req.params.id);

    if (!land) {
      return res.status(404).json({ message: "Land listing not found" });
    }

    land.verificationStatus = status;
    land.verificationComments = comments;
    land.verifiedBy = {
      inspectorId,
      timestamp: new Date(),
    };
    land.isApproved = status === "approved";

    await land.save();

    // Send email notification
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: land.email,
        subject: `Land Listing ${
          status.charAt(0).toUpperCase() + status.slice(1)
        }`,
        html: `
          <h1>Land Listing ${
            status.charAt(0).toUpperCase() + status.slice(1)
          }</h1>
          <p>Dear ${land.name},</p>
          <p>Your land listing has been ${status}.</p>
          ${
            comments
              ? `<p><strong>Inspector Comments:</strong> ${comments}</p>`
              : ""
          }
          <p><strong>Survey Number:</strong> ${land.surveyNumber}</p>
          <p><strong>Location:</strong> ${land.location}</p>
        `,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue with the response, don't fail the whole request
      // just because email sending failed
    }

    res.status(200).json({
      message: `Land listing ${status} successfully`,
      land,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get lands by userId
landRoute.get("/user-lands/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const lands = await Land.find({ userId })
      .populate('currentOwner', 'name email')
      .populate('previousOwner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform image data to base64
    const landsWithFormattedImages = lands.map(land => ({
      ...land,
      landImages: land.landImages?.map(image => ({
        ...image,
        data: image.data.toString('base64')
      }))
    }));

    res.json(landsWithFormattedImages);
  } catch (error) {
    console.error('Error fetching user lands:', error);
    res.status(500).json({ message: 'Failed to fetch lands' });
  }
});

landRoute.get("/user-lands", async (req, res) => {
  try {
    const { userId, email } = req.query;

    if (!userId || !email) {
      return res.status(400).json({
        message: "User ID and email are required",
      });
    }

    console.log("Searching for lands with:", { userId, email }); // Debug log

    // Find lands that match both userId and email
    const lands = await Land.find({
      $and: [{ userId: userId }, { email: email }],
    }).sort({ createdAt: -1 });

     // Debug log

    res.status(200).json(lands);
  } catch (error) {
    console.error("Error fetching lands:", error);
    res.status(500).json({
      message: "Failed to fetch lands",
      error: error.message,
    });
  }
});

// Get all pending lands
landRoute.get("/pending-lands", async (req, res) => {
  try {
    const pendingLands = await Land.find({ verificationStatus: "pending" })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Convert Buffer to Base64 string for each land's images
    const landsWithImages = pendingLands.map((land) => ({
      ...land,
      landImages: land.landImages.map((img) => ({
        ...img,
        data: img.data.toString("base64"),
      })),
    }));

    res.status(200).json(landsWithImages);
  } catch (error) {
    console.error("Error fetching pending lands:", error);
    res.status(500).json({ message: "Failed to fetch pending lands" });
  }
});

// Verify a land
landRoute.post("/verify-land/:landId", async (req, res) => {
  try {
    const { landId } = req.params;
    const { status, comments, inspectorId } = req.body;

    const updatedLand = await Land.findByIdAndUpdate(
      landId,
      {
        verificationStatus: status,
        isApproved: status === "approved",
        verificationComments: comments,
        verifiedBy: {
          inspectorId,
          timestamp: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedLand) {
      return res.status(404).json({ message: "Land not found" });
    }

    res.status(200).json(updatedLand);
  } catch (error) {
    console.error("Error verifying land:", error);
    res.status(500).json({ message: "Failed to verify land" });
  }
});

// Get all lands
landRoute.get("/all-lands", async (req, res) => {
  try {
    const lands = await Land.find().sort({ createdAt: -1 }).lean();

    // Convert Buffer to Base64 string for each land's images
    const landsWithImages = lands.map((land) => ({
      ...land,
      landImages: land.landImages.map((img) => ({
        ...img,
        data: img.data.toString("base64"),
      })),
    }));

    res.status(200).json(landsWithImages);
  } catch (error) {
    console.error("Error fetching lands:", error);
    res.status(500).json({ message: "Failed to fetch lands" });
  }
});

// Handle buy request
landRoute.post("/buy-request/:landId", async (req, res) => {
  try {
    const { landId } = req.params;
    const { buyerId } = req.body;

    // Validate the land exists
    const land = await Land.findById(landId);
    if (!land) {
      return res.status(404).json({ message: "Land not found" });
    }

    // Create buy request record - Fix ObjectId conversion
    const buyRequest = new BuyRequest({
      landId: new mongoose.Types.ObjectId(landId),
      buyerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: new mongoose.Types.ObjectId(land.userId),
    });

    await buyRequest.save();
    res.status(200).json({
      message: "Buy request sent successfully",
      requestId: buyRequest._id,
    });
  } catch (error) {
    console.error("Error creating buy request:", error);
    res.status(500).json({ message: "Failed to send buy request" });
  }
});

// Get buy request by ID
landRoute.get("/buy-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const buyRequest = await BuyRequest.findById(requestId)
      .populate("landId")
      .populate("buyerId", "name email phoneNumber walletAddress")
      .populate("sellerId", "name email phoneNumber walletAddress");

    if (!buyRequest) {
      return res.status(404).json({ message: "Buy request not found" });
    }

    // Format the land images if they exist
    if (buyRequest.landId.landImages) {
      buyRequest.landId.landImages = buyRequest.landId.landImages.map(
        (img) => ({
          ...img,
          data: img.data.toString("base64"),
        })
      );
    }

    res.json(buyRequest);
  } catch (error) {
    console.error("Error fetching buy request:", error);
    res.status(500).json({ message: "Failed to fetch buy request details" });
  }
});

// Add new route for recording payments
landRoute.post("/record-payment", async (req, res) => {
  try {
    const {
      buyRequestId,
      landId,
      buyerId,
      sellerId,
      amount,
      transactionHash,
      network,
      buyerWalletAddress,
      sellerWalletAddress,
    } = req.body;

    // Update buy request status
    await BuyRequest.findByIdAndUpdate(buyRequestId, {
      $set: {
        status: "completed",
        paymentStatus: "completed",
        paymentDate: new Date(),
        transactionHash,
      },
    });

    // Create payment record
    const payment = new Payment({
      buyRequestId,
      landId,
      buyerId,
      sellerId,
      amount,
      transactionHash,
      network,
      buyerWalletAddress,
      sellerWalletAddress,
      status: "completed",
    });

    await payment.save();

    // Update land status
    await Land.findByIdAndUpdate(landId, {
      $set: {
        status: "sold",
        currentOwner: buyerId,
        lastTransactionDate: new Date(),
        lastTransactionHash: transactionHash,
      },
    });

    res.status(200).json({
      message: "Payment recorded successfully",
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ message: "Failed to record payment" });
  }
});

// Update available-lands route to only show available lands
landRoute.get("/available-lands", async (req, res) => {
  try {
    const lands = await Land.find({
      verificationStatus: "approved",
      status: "available",
    })
      .sort({ createdAt: -1 })
      .lean();

    const landsWithImages = lands.map((land) => ({
      ...land,
      landImages: land.landImages.map((img) => ({
        ...img,
        data: img.data.toString("base64"),
      })),
    }));

    res.status(200).json(landsWithImages);
  } catch (error) {
    console.error("Error fetching available lands:", error);
    res.status(500).json({ message: "Failed to fetch lands" });
  }
});

// Get buyer's transactions
landRoute.get("/buyer-transactions/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    const transactions = await BuyRequest.find({ buyerId })
      .sort({ createdAt: -1 })
      .populate("landId");
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching buyer transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Get pending payments for a buyer
landRoute.get("/pending-payments/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    console.log('Fetching payments for buyer:', buyerId);

    const pendingPayments = await BuyRequest.find({
      buyerId,
      status: 'approved',
      paymentStatus: { $ne: 'completed' }
    })
    .populate({
      path: 'landId',
      populate: {
        path: 'userId',
        model: 'seller',
        select: 'name email phoneNumber walletAddress'
      }
    })
    .populate('sellerId', 'name email phoneNumber walletAddress')
    .lean();

    // Debug log
    console.log('Populated pending payments:', JSON.stringify(pendingPayments, null, 2));
    res.json(pendingPayments);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ message: "Failed to fetch pending payments" });
  }
});

// Add this route to get user transactions
landRoute.get("/user-transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await Payment.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
      status: "completed",
    })
      .populate("landId")
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .sort({ paymentDate: -1 });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});
landRoute.get("/user/:userId", async (req, res) => {
  try {
    // Try to find user in Buyer collection first
    let user = await Buyer.findById(req.params.userId)
      .select('-password -governmentIdImage')
      .lean();

    // If not found in Buyer, try Seller collection
    if (!user) {
      user = await Seller.findById(req.params.userId)
        .select('-password -governmentIdImage')
        .lean();
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// Request land transfer
landRoute.post("/request-transfer", async (req, res) => {
  try {
    const { landId, sellerId, buyerId, transactionHash, paymentId } = req.body;
    
    const transferRequest = new TransferRequest({
      landId,
      sellerId,
      buyerId,
      transactionHash,
      paymentId,
      status: 'pending'
    });

    await transferRequest.save();
    res.status(200).json({ message: 'Transfer request created successfully' });
  } catch (error) {
    console.error('Error creating transfer request:', error);
    res.status(500).json({ message: 'Failed to create transfer request' });
  }
});

// Get all transfer requests
landRoute.get("/transfer-requests", async (req, res) => {
  try {
    const requests = await TransferRequest.find({ status: 'pending' })
      .populate('landId')
      .populate('sellerId')
      .populate('buyerId')
      .lean();
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching transfer requests:', error);
    res.status(500).json({ message: 'Failed to fetch transfer requests' });
  }
});

// Process transfer request
landRoute.post("/process-transfer/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, sellerPhoto, buyerPhoto, verificationDate, comments } = req.body;

    // Convert base64 photos to buffer
    const sellerPhotoBuffer = sellerPhoto ? Buffer.from(
      sellerPhoto.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    ) : null;
    
    const buyerPhotoBuffer = buyerPhoto ? Buffer.from(
      buyerPhoto.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    ) : null;

    const transferRequest = await TransferRequest.findById(requestId)
      .populate('landId')
      .populate('buyerId')
      .populate('sellerId');

    if (!transferRequest) {
      return res.status(404).json({ message: 'Transfer request not found' });
    }

    // Update transfer request
    transferRequest.status = action === 'approve' ? 'completed' : 'rejected';
    transferRequest.verificationDate = verificationDate;
    transferRequest.verificationComments = comments;

    if (sellerPhotoBuffer) {
      transferRequest.sellerVerificationPhoto = {
        data: sellerPhotoBuffer,
        contentType: 'image/jpeg',
        capturedAt: verificationDate
      };
    }

    if (buyerPhotoBuffer) {
      transferRequest.buyerVerificationPhoto = {
        data: buyerPhotoBuffer,
        contentType: 'image/jpeg',
        capturedAt: verificationDate
      };
    }

    await transferRequest.save();

    // If approved, update land ownership
    if (action === 'approve') {
      await Land.findByIdAndUpdate(
        transferRequest.landId._id,
        {
          currentOwner: transferRequest.buyerId._id,
          previousOwner: transferRequest.sellerId._id,
          status: 'transferred',
          lastTransactionDate: verificationDate,
          lastTransactionHash: transferRequest.transactionHash
        }
      );
    }

    res.json({ 
      message: `Transfer ${action}d successfully`,
      transferRequest
    });
  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({ 
      message: 'Failed to process transfer',
      error: error.message 
    });
  }
});

// Add this new route
landRoute.get("/owned-lands/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const ownedLands = await Land.find({
      currentOwner: userId,
      status: 'transferred'
    })
    .populate('userId', 'name email phoneNumber')  // Original seller/owner
    .populate('currentOwner', 'name email phoneNumber')  // Current owner (buyer)
    .populate('previousOwner', 'name email phoneNumber') // Previous owner
    
    .lean();

    // Debug log
    

    res.json(ownedLands);
  } catch (error) {
    console.error("Error fetching owned lands:", error);
    res.status(500).json({ message: "Failed to fetch owned lands" });
  }
});

// Add this new route to get transfer statuses
landRoute.get("/transfer-statuses", async (req, res) => {
  try {
    const transfers = await TransferRequest.find()
      .select('paymentId status')
      .lean();
    
    res.json(transfers);
  } catch (error) {
    console.error("Error fetching transfer statuses:", error);
    res.status(500).json({ message: "Failed to fetch transfer statuses" });
  }
});
// Add this to your landController.js
landRoute.get("/pending-counts", async (req, res) => {
  try {
    const [pendingLands, pendingUsers, pendingPurchases, pendingTransfers] = await Promise.all([
      Land.countDocuments({ verificationStatus: "pending" }),
      Buyer.countDocuments({ isVerified: false }),
      BuyRequest.countDocuments({ status: "pending" }),
      TransferRequest.countDocuments({ status: "pending" })
    ]);

    res.json({
      pendingLands,
      pendingUsers,
      pendingPurchases,
      pendingTransfers
    });
  } catch (error) {
    console.error("Error fetching pending counts:", error);
    res.status(500).json({ message: "Failed to fetch pending counts" });
  }
});

// Add this route to get completed transfers
landRoute.get("/completed-transfers", async (req, res) => {
  try {
    const completedTransfers = await TransferRequest.find({ 
      status: 'completed',
      sellerVerificationPhoto: { $exists: true },
      buyerVerificationPhoto: { $exists: true }
    })
    .populate('landId')
    .populate('sellerId', 'name email phoneNumber')
    .populate('buyerId', 'name email phoneNumber')
    .sort({ verificationDate: -1 })
    .lean();

    // Convert Buffer to Base64 for photos
    const transfersWithPhotos = completedTransfers.map(transfer => ({
      ...transfer,
      sellerVerificationPhoto: transfer.sellerVerificationPhoto ? {
        ...transfer.sellerVerificationPhoto,
        data: transfer.sellerVerificationPhoto.data.toString('base64')
      } : null,
      buyerVerificationPhoto: transfer.buyerVerificationPhoto ? {
        ...transfer.buyerVerificationPhoto,
        data: transfer.buyerVerificationPhoto.data.toString('base64')
      } : null
    }));

    res.json(transfersWithPhotos);
  } catch (error) {
    console.error('Error fetching completed transfers:', error);
    res.status(500).json({ message: 'Failed to fetch completed transfers' });
  }
});

module.exports = landRoute;
