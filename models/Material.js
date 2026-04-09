const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["pdf", "video", "image", "link", "document", "other"],
      default: "pdf",
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);