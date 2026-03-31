const express = require("express");
const Trade   = require("../models/Trade");
const router  = express.Router();

// POST /api/trades — log a confirmed on-chain trade
router.post("/", async (req, res) => {
  try {
    const { listingId, buyer, seller, amount, priceEth, txHash, blockNumber } = req.body;
    if (!txHash || !buyer || !seller) {
      return res.status(400).json({ msg: "Missing required fields" });
    }
    // Upsert by txHash to avoid duplicates
    const trade = await Trade.findOneAndUpdate(
      { txHash },
      { listingId, buyer: buyer.toLowerCase(), seller: seller.toLowerCase(), amount, priceEth, txHash, blockNumber },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json(trade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/trades — recent trades (for price chart)
router.get("/", async (req, res) => {
  try {
    const trades = await Trade.find().sort({ createdAt: -1 }).limit(50);
    return res.json(trades);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/trades/leaderboard — top buyers by CCT volume
router.get("/leaderboard", async (req, res) => {
  try {
    const board = await Trade.aggregate([
      {
        $group: {
          _id:        "$buyer",
          totalCCT:   { $sum: "$amount" },
          totalETH:   { $sum: "$priceEth" },
          tradeCount: { $sum: 1 },
        },
      },
      { $sort: { totalCCT: -1 } },
      { $limit: 10 },
    ]);
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
