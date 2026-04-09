const express = require("express");
const router = express.Router();
// const bcrypt = require("bcryptjs"); // لم نعد بحاجة لها
const User = require("../models/User");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // هنا نخزن كلمة المرور كما هي بدون تشفير
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: password, // كلمة المرور نصية
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ هنا نقارن كلمة المرور مباشرة بدون تشفير
    const isMatch = password === user.password;

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});

module.exports = router;