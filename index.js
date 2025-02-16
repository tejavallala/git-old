require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const userDetails = require("./controller/userController");
const inspectorRoute = require("./controller/landInspectorController");
const sellerDetails = require("./controller/sellerController");
const buyerDetails = require("./controller/buyerController");
const landDetails = require("./controller/landController");
 // Add this line

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Email configuration missing. Please check your .env file");
  process.exit(1);
}

const app = express();
mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://user:123@cluster0.ddtv2.mongodb.net/SDP", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on("open", () => console.log("connected to db"));
db.on("error", () => console.log("Error occured"));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ 
  limit: '50mb',
  extended: true,
  parameterLimit: 50000 
}));
app.use(cors());
app.use("/userRoute", userDetails);
app.use("/inspectorRoute", inspectorRoute);
app.use("/landRoute", landDetails);
app.use("/sellerRouter", sellerDetails);
app.use("/buyerRouter", buyerDetails);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  db.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
