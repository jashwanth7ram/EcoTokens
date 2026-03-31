const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema(
  {
    listingId:   { type: String, required: true },
    buyer:       { type: String, required: true, lowercase: true },
    seller:      { type: String, required: true, lowercase: true },
    amount:      { type: Number, required: true },   // CCT (float)
    priceEth:    { type: Number, required: true },   // ETH
    txHash:      { type: String, required: true, unique: true },
    blockNumber: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", TradeSchema);
