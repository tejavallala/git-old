const express = require("express");
const multer = require("multer");
const buyerModel = require("../model/buyerModel");
const buyerRoute = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create a new buyer
buyerRoute.post(
  "/create-user",
  upload.single("governmentIdImage"),
  async (req, res) => {
    try {
      const { name, email, password, phoneNumber, location, governmentId } =
        req.body;

      // Validate required fields
      if (
        !name ||
        !email ||
        !password ||
        !phoneNumber ||
        !location ||
        !governmentId ||
        !req.file
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Create a new buyer
      const newBuyer = new buyerModel({
        name,
        email,
        password,
        phoneNumber,
        location,
        governmentId,
        governmentIdImage: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      });

      // Save the buyer to the database
      const savedBuyer = await newBuyer.save();
      res.status(201).json(savedBuyer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get all buyers
buyerRoute.get("/", async (req, res) => {
  try {
    const buyers = await buyerModel.find();

    // Convert image buffer to base64 for each buyer
    const buyersWithBase64 = buyers.map((buyer) => {
      const buyerObj = buyer.toObject();
      if (buyerObj.governmentIdImage && buyerObj.governmentIdImage.data) {
        buyerObj.governmentIdImage = {
          data: buyerObj.governmentIdImage.data.toString("base64"),
          contentType: buyerObj.governmentIdImage.contentType,
        };
      } else {
        buyerObj.governmentIdImage = null;
      }
      return buyerObj;
    });

    res.status(200).json(buyersWithBase64);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a buyer by ID
buyerRoute.get("/get-user/:id", async (req, res) => {
  try {
    const buyer = await buyerModel.findById(req.params.id);

    // Check if buyer exists
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Convert image buffer to base64
    const buyerObj = buyer.toObject();
    if (buyerObj.governmentIdImage && buyerObj.governmentIdImage.data) {
      buyerObj.governmentIdImage = {
        data: buyerObj.governmentIdImage.data.toString("base64"),
        contentType: buyerObj.governmentIdImage.contentType,
      };
    } else {
      buyerObj.governmentIdImage = null;
    }

    res.status(200).json(buyerObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login for buyers
buyerRoute.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the buyer by email and password
    const buyer = await buyerModel.findOne({ email, password });

    if (buyer) {
      res.status(200).json({
        message: "Login successful",
        userId: buyer._id, // Send userId in the response
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = buyerRoute;