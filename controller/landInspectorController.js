const express = require('express');
const inspectorRoute = express.Router();
const sellerModel = require('../model/sellerModel');
const buyerModel = require('../model/buyerModel');
const LandInspector = require('../model/landInspectorModel'); // Fixed import
const bcrypt = require('bcrypt'); // Add this import

// Get unverified users (either sellers or buyers)
inspectorRoute.get('/unverified-users/:userType', async (req, res) => {
  try {
    const { userType } = req.params;
    const model = userType === 'sellers' ? sellerModel : buyerModel;
    
    // Include isVerified field in the query and filter for unverified users
    const unverifiedUsers = await model.find({ isVerified: false })
      .select('+isVerified')
      .exec();

    // Transform the government ID image data for each user
    const usersWithFormattedImages = unverifiedUsers.map(user => {
      const userObj = user.toObject();
      if (userObj.governmentIdImage && userObj.governmentIdImage.data) {
        userObj.governmentIdImage = {
          data: userObj.governmentIdImage.data.toString('base64'),
          contentType: userObj.governmentIdImage.contentType
        };
      }
      return userObj;
    });

    res.json(usersWithFormattedImages);
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify a user
inspectorRoute.post('/verify-user', async (req, res) => {
  try {
    const { userId, userType } = req.body;
    const model = userType === 'sellers' ? sellerModel : buyerModel;

    const updatedUser = await model.findByIdAndUpdate(
      userId,
      { 
        isVerified: true,
        verificationDate: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create Land Inspector/Admin
inspectorRoute.post("/create-user", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if admin already exists with this email
    const existingAdmin = await LandInspector.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new LandInspector({
      name,
      email,
      password: hashedPassword
    });

    const savedAdmin = await newAdmin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add login endpoint
inspectorRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await LandInspector.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      userId: admin._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add this new endpoint after your existing endpoints
inspectorRoute.get('/all-users/:userType', async (req, res) => {
  try {
    const { userType } = req.params;
    const model = userType === 'sellers' ? sellerModel : buyerModel;
    
    // Fetch all users regardless of verification status
    const allUsers = await model.find({})
      .select('+isVerified')
      .exec();

    // Transform the government ID image data for each user
    const usersWithFormattedImages = allUsers.map(user => {
      const userObj = user.toObject();
      if (userObj.governmentIdImage && userObj.governmentIdImage.data) {
        userObj.governmentIdImage = {
          data: userObj.governmentIdImage.data.toString('base64'),
          contentType: userObj.governmentIdImage.contentType
        };
      }
      return userObj;
    });

    res.json({
      total: usersWithFormattedImages.length,
      verified: usersWithFormattedImages.filter(user => user.isVerified).length,
      unverified: usersWithFormattedImages.filter(user => !user.isVerified).length,
      users: usersWithFormattedImages
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = inspectorRoute;