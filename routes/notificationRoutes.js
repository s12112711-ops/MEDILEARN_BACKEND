const express = require("express");
const router = express.Router();
const UserDeviceToken = require("../models/UserDeviceToken");

router.post("/save-token", async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        message: "userId and fcmToken are required",
      });
    }

    const existingToken = await UserDeviceToken.findOne({ fcmToken });

    if (existingToken) {
      existingToken.userId = userId;
      await existingToken.save();

      return res.status(200).json({
        message: "Token updated successfully",
      });
    }

    await UserDeviceToken.create({
      userId,
      fcmToken,
    });

    return res.status(201).json({
      message: "Token saved successfully",
    });
  } catch (error) {
    console.error("Save token error:", error);
    return res.status(500).json({
      message: "Failed to save token",
      error: error.message,
    });
  }
});

module.exports = router;