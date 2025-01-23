const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const userDetails = require("./controller/userController");
const adminDetails = require("./controller/adminController");
const sellerDetails = require("./controller/sellerController");
const buyerDetails = require("./controller/buyerController");

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
app.use("/adminRoute", adminDetails);
app.use("/sellerRouter", sellerDetails);
app.use("/buyerRouter", buyerDetails);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
