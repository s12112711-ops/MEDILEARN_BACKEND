const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// GET all users except current user — مع آخر رسالة وعدد غير المقروءة
router.get("/users/:currentUserId", async (req, res) => {
  try {
    const { currentUserId } = req.params;

    const users = await User.find({ _id: { $ne: currentUserId } }).lean();

    const result = await Promise.all(
      users.map(async (user) => {
        const otherUserId = user._id.toString();

        const [lastMsg, unreadCount] = await Promise.all([
          Message.findOne({
            $or: [
              { senderId: currentUserId, receiverId: otherUserId },
              { senderId: otherUserId,   receiverId: currentUserId },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),

          Message.countDocuments({
            senderId: otherUserId,
            receiverId: currentUserId,
            isRead: false,
          }),
        ]);

        return {
          _id: otherUserId,
          name: user.fullName || "Unknown User",
          role: user.role || "student",
          lastMessage: lastMsg ? lastMsg.message : "",
          lastMessageAt: lastMsg ? lastMsg.createdAt : null,
          unreadCount,
        };
      })
    );

    // رتّب: من فيه رسائل أولاً، ثم حسب آخر رسالة
    result.sort((a, b) => {
      if (a.lastMessageAt && !b.lastMessageAt) return -1;
      if (!a.lastMessageAt && b.lastMessageAt) return 1;
      if (a.lastMessageAt && b.lastMessageAt)
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      return a.name.localeCompare(b.name);
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("GET /messages/users error:", error);
    res.status(500).json({ message: "Failed to load users", error: error.message });
  }
});

// GET conversation between two users
router.get("/conversation/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("GET /messages/conversation error:", error);
    res.status(500).json({ message: "Failed to load conversation", error: error.message });
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
      isRead: false,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("POST /messages/send error:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

// PUT mark conversation as read — عندما يفتح المستخدم المحادثة
router.put("/read/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("PUT /messages/read error:", error);
    res.status(500).json({ message: "Failed to mark messages as read", error: error.message });
  }
});

// GET unread count for a user
router.get("/unread/:userId", async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.params.userId,
      isRead: false,
    });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Failed to get unread count", error: error.message });
  }
});

module.exports = router;
