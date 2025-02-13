const express = require("express");
const multer = require("multer");
const sellerModel = require("../model/sellerModel");
const sellerRoute = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create a new seller
sellerRoute.post("/create-user", upload.single("governmentIdImage"), async (req, res) => {
  try {
    const { name, email, password, phoneNumber, location, governmentId } = req.body;

    if (!name || !email || !password || !phoneNumber || !location || !governmentId || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newSeller = new sellerModel({
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

    const savedSeller = await newSeller.save();
    res.status(201).json(savedSeller);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

sellerRoute.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await sellerModel.findOne({ email, password }).select('+isVerified');
        if (user) {
            res.status(200).json({ 
                message: "Login successful", 
                userId: user._id,
                isVerified: user.isVerified || false
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

sellerRoute.get("/get-user/:id", async (req, res) => {
  try {
    const seller = await sellerModel.findById(req.params.id).select('+isVerified');
    
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerObj = seller.toObject();
    if (sellerObj.governmentIdImage && sellerObj.governmentIdImage.data) {
      sellerObj.governmentIdImage = {
        data: sellerObj.governmentIdImage.data.toString("base64"),
        contentType: sellerObj.governmentIdImage.contentType,
      };
    } else {
      sellerObj.governmentIdImage = null;
    }

    res.status(200).json(sellerObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

sellerRoute.get("/verification-status/:id", async (req, res) => {
    try {
        const seller = await sellerModel.findById(req.params.id).select('+isVerified');
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }
        res.status(200).json({ 
            isVerified: seller.isVerified || false,
            message: seller.isVerified 
                ? "Your account is verified" 
                : "Your account is pending verification"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = sellerRoute;