const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// GET all users except current user
router.get("/users/:currentUserId", async (req, res) => {
  try {
    const { currentUserId } = req.params;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).lean();

    const result = await Promise.all(
      users.map(async (user) => {
        const otherUserId = user._id.toString();

        const lastMsg = await Message.findOne({
          $or: [
            { senderId: currentUserId.toString(), receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId.toString() },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: otherUserId,
          name: user.fullName || user.name || user.username || "Unknown User",
          email: user.email || "",
          role: user.role || "student",
          lastMessage: lastMsg ? lastMsg.message : "",
          unread: false,
        };
      })
    );

    result.sort((a, b) => {
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("GET /messages/users error:", error);
    res.status(500).json({
      message: "Failed to load users",
      error: error.message,
    });
  }
});

// GET conversation between two users
router.get("/conversation/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: user1.toString(), receiverId: user2.toString() },
        { senderId: user2.toString(), receiverId: user1.toString() },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("GET /messages/conversation error:", error);
    res.status(500).json({
      message: "Failed to load conversation",
      error: error.message,
    });
  }
});

// POST send message
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        message: "senderId, receiverId and message are required",
      });
    }

    const newMessage = new Message({
      senderId: senderId.toString(),
      receiverId: receiverId.toString(),
      message: message.toString().trim(),
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("POST /messages/send error:", error);
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
});

module.exports = router;