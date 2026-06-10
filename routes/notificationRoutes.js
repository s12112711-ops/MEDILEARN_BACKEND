const express = require("express");
const router = express.Router();
const UserDeviceToken = require("../models/UserDeviceToken");
const admin = require("../config/firebase");

// POST /api/notifications/save-token — حفظ FCM token للجهاز
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
      return res.status(200).json({ message: "Token updated successfully" });
    }

    await UserDeviceToken.create({ userId, fcmToken });
    return res.status(201).json({ message: "Token saved successfully" });
  } catch (error) {
    console.error("Save token error:", error);
    return res.status(500).json({
      message: "Failed to save token",
      error: error.message,
    });
  }
});

// POST /api/notifications/send — إرسال إشعار لمستخدم معين
router.post("/send", async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        message: "userId, title, and body are required",
      });
    }

    if (!admin.apps.length) {
      return res.status(503).json({
        message: "Push notifications not configured (serviceAccountKey.json missing)",
      });
    }

    const tokens = await UserDeviceToken.find({ userId });

    if (!tokens.length) {
      return res.status(404).json({
        message: "No device tokens found for this user",
      });
    }

    const fcmTokens = tokens.map((t) => t.fcmToken);

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // احذف الـ tokens المنتهية الصلاحية تلقائياً
    const expiredTokens = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        (resp.error?.code === "messaging/invalid-registration-token" ||
          resp.error?.code === "messaging/registration-token-not-registered")
      ) {
        expiredTokens.push(fcmTokens[idx]);
      }
    });

    if (expiredTokens.length) {
      await UserDeviceToken.deleteMany({ fcmToken: { $in: expiredTokens } });
    }

    res.status(200).json({
      message: "Notification sent",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// POST /api/notifications/send-all — إشعار لكل المستخدمين (للأدمن)
router.post("/send-all", async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "title and body are required" });
    }

    if (!admin.apps.length) {
      return res.status(503).json({
        message: "Push notifications not configured (serviceAccountKey.json missing)",
      });
    }

    const tokens = await UserDeviceToken.find();
    if (!tokens.length) {
      return res.status(200).json({ message: "No devices registered", successCount: 0 });
    }

    const fcmTokens = tokens.map((t) => t.fcmToken);

    // Firebase يسمح بـ 500 token بكل طلب
    const chunks = [];
    for (let i = 0; i < fcmTokens.length; i += 500) {
      chunks.push(fcmTokens.slice(i, i + 500));
    }

    let totalSuccess = 0;
    let totalFail = 0;

    for (const chunk of chunks) {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        data: data || {},
        tokens: chunk,
      });
      totalSuccess += response.successCount;
      totalFail    += response.failureCount;
    }

    res.status(200).json({
      message: "Broadcast sent",
      successCount: totalSuccess,
      failureCount: totalFail,
    });
  } catch (error) {
    console.error("Send-all notification error:", error);
    res.status(500).json({
      message: "Failed to send broadcast",
      error: error.message,
    });
  }
});

module.exports = router;
