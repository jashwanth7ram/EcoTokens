const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================
   GOOGLE LOGIN / SIGNUP
========================= */
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user (Google user has no password, generating a random one)
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = new User({
        name: name,
        email: email,
        password: hashedPassword
      });
      await user.save();
    }

    const appToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Google login successful",
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    return res.status(401).json({ msg: "Invalid Google Token" });
  }
});

/* =========================
   SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({ msg: "Signup successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN ROUTE HIT");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
