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

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Email configuration missing. Please check your .env file");
  process.exit(1);
}

const app = express();
mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://user:123@cluster0.ddtv2.mongodb.net/SDP");
var db = mongoose.connection;
db.on("open", () => console.log("connected to db"));
db.on("error", () => console.log("Error occured"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/userRoute", userDetails);
app.use("/inspectorRoute", inspectorRoute);
app.use("/landRoute", landDetails);
app.use("/sellerRouter", sellerDetails);
app.use("/buyerRouter", buyerDetails);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
