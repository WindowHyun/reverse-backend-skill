const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{ sku: String, qty: Number }],
  amount: Number,
  paymentId: String,
  status: { type: String, default: "pending" },
});

module.exports = mongoose.model("Order", orderSchema);
