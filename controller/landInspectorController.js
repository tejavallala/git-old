const express = require('express');
const inspectorRoute = express.Router();
const sellerModel = require('../model/sellerModel');
const buyerModel = require('../model/buyerModel');
const LandInspector = require('../model/landInspectorModel'); // Fixed import
const bcrypt = require('bcrypt'); // Add this import
const BuyRequest = require('../model/BuyRequestModel');
const Land = require('../model/LandModel');

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

// Get all pending purchase requests
inspectorRoute.get('/pending-purchases', async (req, res) => {
  try {
    const pendingRequests = await BuyRequest.find({ status: 'pending' })
      .populate('landId')
      .populate('buyerId', 'name email phoneNumber')  // Added phoneNumber
      .populate('sellerId', 'name email phoneNumber') // Added phoneNumber
      .sort({ createdAt: -1 })
      .lean();

    const requestsWithFormattedData = pendingRequests.map(request => ({
      ...request,
      landId: {
        ...request.landId,
        landImages: request.landId.landImages.map(img => ({
          ...img,
          data: img.data.toString('base64')
        }))
      }
    }));

    res.json(requestsWithFormattedData);
  } catch (error) {
    console.error('Error fetching pending purchase requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify purchase request
inspectorRoute.post('/verify-purchase/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, comments, inspectorId } = req.body;

    // Update buy request status
    const buyRequest = await BuyRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        inspectorComments: comments,
        'verifiedBy.inspectorId': inspectorId,
        'verifiedBy.timestamp': new Date()
      },
      { new: true }
    ).populate('landId');

    if (!buyRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    // If approved, update land ownership
    if (status === 'approved') {
      await Land.findByIdAndUpdate(buyRequest.landId._id, {
        status: 'pending_payment',
        currentBuyRequest: buyRequest._id
      });
    }

    res.json({
      message: `Purchase request ${status} successfully`,
      buyRequest
    });
  } catch (error) {
    console.error('Error verifying purchase request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get purchase request history
inspectorRoute.get('/purchase-history', async (req, res) => {
  try {
    const requests = await BuyRequest.find({})
      .populate('landId')
      .sort({ createdAt: -1 })
      .lean();

    const requestsWithFormattedImages = requests.map(request => ({
      ...request,
      landId: {
        ...request.landId,
        landImages: request.landId.landImages.map(img => ({
          ...img,
          data: img.data.toString('base64')
        }))
      }
    }));

    res.json({
      total: requestsWithFormattedImages.length,
      approved: requestsWithFormattedImages.filter(r => r.status === 'approved').length,
      rejected: requestsWithFormattedImages.filter(r => r.status === 'rejected').length,
      pending: requestsWithFormattedImages.filter(r => r.status === 'pending').length,
      requests: requestsWithFormattedImages
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = inspectorRoute;