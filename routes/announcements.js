const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const sendPushNotificationToStudents = require("../utils/sendPushNotification");

// Create announcement
router.post("/", async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      doctorName,
      doctorId,
      sourceName,
      sourceType,
      targetAudience,
      eventDate,
      eventTime,
      location,
      priority,
      isPinned,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const newAnnouncement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      category: category?.trim().toLowerCase() || "general",
      doctorName: doctorName?.trim() || "",
      doctorId: doctorId || null,
      sourceName: sourceName?.trim() || "",
      sourceType: sourceType?.trim().toLowerCase() || "doctor",
      targetAudience: targetAudience?.trim().toLowerCase() || "all",
      eventDate: eventDate || null,
      eventTime: eventTime?.trim() || "",
      location: location?.trim() || "",
      priority: priority?.trim().toLowerCase() || "normal",
      isPinned: isPinned === true,
    });

    await newAnnouncement.save();

   await sendPushNotificationToStudents({
  title: title.trim(),
  body: content.trim(),
  doctorName: doctorName?.trim() || "",
  category: newAnnouncement.category || "general",
  priority: newAnnouncement.priority || "normal",
  data: {
    announcementId: newAnnouncement._id.toString(),
    category: newAnnouncement.category || "general",
    priority: newAnnouncement.priority || "normal",
    type: "announcement",
  },
});
    res.status(201).json({
      message: "Announcement created successfully",
      announcement: newAnnouncement,
    });
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({
      isPinned: -1,
      eventDate: 1,
      createdAt: -1,
    });

    res.status(200).json(announcements);
  } catch (err) {
    console.error("Get announcements error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get one announcement by id
router.get("/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    res.status(200).json(announcement);
  } catch (err) {
    console.error("Get announcement by id error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update announcement
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      doctorName,
      doctorId,
      sourceName,
      sourceType,
      targetAudience,
      eventDate,
      eventTime,
      location,
      priority,
      isPinned,
    } = req.body;

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(category !== undefined && {
          category: category.trim().toLowerCase(),
        }),
        ...(doctorName !== undefined && { doctorName: doctorName.trim() }),
        ...(doctorId !== undefined && { doctorId: doctorId || null }),
        ...(sourceName !== undefined && { sourceName: sourceName.trim() }),
        ...(sourceType !== undefined && {
          sourceType: sourceType.trim().toLowerCase(),
        }),
        ...(targetAudience !== undefined && {
          targetAudience: targetAudience.trim().toLowerCase(),
        }),
        ...(eventDate !== undefined && { eventDate: eventDate || null }),
        ...(eventTime !== undefined && { eventTime: eventTime.trim() }),
        ...(location !== undefined && { location: location.trim() }),
        ...(priority !== undefined && {
          priority: priority.trim().toLowerCase(),
        }),
        ...(isPinned !== undefined && { isPinned }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement,
    });
  } catch (err) {
    console.error("Update announcement error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete announcement
router.delete("/:id", async (req, res) => {
  try {
    const deletedAnnouncement = await Announcement.findByIdAndDelete(
      req.params.id
    );

    if (!deletedAnnouncement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (err) {
    console.error("Delete announcement error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;