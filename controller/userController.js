const express = require("express");
const userModel = require("../model/userModel");
const userRoute = new express.Router();

userRoute.post("/create-user", async (req, res) => {
  try {
    const data = await userModel.create(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRoute.get("/get-user/:id", async (req, res) => {
  try {
    const data = await userModel.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = userRoute;
