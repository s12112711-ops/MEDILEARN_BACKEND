const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    doctorId: {
      type: String,
      required: true,
      trim: true,
    },

    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    sectionName: {
      type: String,
      default: "",
      trim: true,
    },

    semester: {
      type: String,
      default: "2025/2026",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // حالة الطالب في المادة
    // active  = مسجّل وما زال يدرس
    // passed  = اجتاز المادة بنجاح
    // failed  = رسب في المادة
    status: {
      type: String,
      enum: ["active", "passed", "failed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// نفس الطالب لا يسجل نفس المادة مع نفس الدكتور مرتين
registerSchema.index(
  { studentId: 1, subjectCode: 1, doctorId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Register", registerSchema);