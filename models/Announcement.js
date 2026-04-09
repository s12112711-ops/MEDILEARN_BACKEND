const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "general",
        "lecture",
        "exam",
        "urgent",
        "conference",
        "reminder",
        "material",
        "quiz",
      ],
      default: "general",
      trim: true,
      lowercase: true,
    },
    doctorName: {
      type: String,
      default: "",
      trim: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sourceName: {
      type: String,
      default: "",
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["doctor", "admin", "system", "faculty", "conference", "other"],
      default: "doctor",
      trim: true,
      lowercase: true,
    },
    targetAudience: {
      type: String,
      enum: ["all", "students", "doctors"],
      default: "all",
      lowercase: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    eventTime: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      lowercase: true,
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);