const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: __dirname + '/.env' });

const authRoutes = require("./routes/auth");

const app = express();

// ✅ CORS (allow everything for dev)
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE (THIS WAS MISSING)
app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.send("TEST OK");
});

// ✅ AUTH ROUTES
app.use("/api/auth", authRoutes);

// ✅ DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

if (process.env.NODE_ENV !== 'production') {
  app.listen(5050, () => {
    console.log("Server running on http://127.0.0.1:5050");
  });
}
module.exports = app;
