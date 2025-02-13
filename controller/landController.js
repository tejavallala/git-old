const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const Land = require("../model/LandModel");
const landRoute = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("Error verifying email configuration:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Create new land listing
landRoute.post(
  "/create-land",
  upload.array("landImages", 5), // Allow up to 5 images
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

      console.log("Received land data:", {
        email,
        location,
        surveyNumber,
      }); // Debug log

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
      console.log("Saved land:", savedLand); // Debug log

      // Send email notification
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Land Listing Submitted Successfully",
          html: `
            <h1>Land Listing Confirmation</h1>
            <p>Dear ${name},</p>
            <p>Your land listing has been successfully submitted for verification.</p>
            <p>Details:</p>
            <ul>
              <li>Survey Number: ${surveyNumber}</li>
              <li>Location: ${location}</li>
              <li>Area: ${area} sqft</li>
              <li>Price: ₹${price.toLocaleString("en-IN")}</li>
            </ul>
            <p>Our land inspector will verify your listing soon.</p>
          `,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue with the response, don't fail the whole request
        // just because email sending failed
      }

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

    const lands = await Land.find({ userId }).sort({ createdAt: -1 }).lean(); // Convert to plain JavaScript objects

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
    res.status(500).json({
      message: "Failed to fetch lands",
      error: error.message,
    });
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

    console.log("Found lands:", lands.length); // Debug log

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
    const { buyerId, requestDate } = req.body;

    // Create buy request record
    const buyRequest = new BuyRequest({
      landId,
      buyerId,
      requestDate,
      status: "pending",
    });

    await buyRequest.save();
    res.status(200).json({ message: "Buy request sent successfully" });
  } catch (error) {
    console.error("Error creating buy request:", error);
    res.status(500).json({ message: "Failed to send buy request" });
  }
});

landRoute.get("/available-lands", async (req, res) => {
  try {
    const lands = await Land.find({
      verificationStatus: { $in: ['approved', 'pending'] }
    })
    .sort({ createdAt: -1 })
    .lean();

    const landsWithImages = lands.map(land => ({
      ...land,
      landImages: land.landImages.map(img => ({
        ...img,
        data: img.data.toString('base64')
      }))
    }));

    res.status(200).json(landsWithImages);
  } catch (error) {
    console.error("Error fetching available lands:", error);
    res.status(500).json({ message: "Failed to fetch lands" });
  }
});

module.exports = landRoute;
