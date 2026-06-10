const mongoose = require("mongoose");

const courseOfferingSchema = new mongoose.Schema(
  {
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

    sectionName: {
      type: String,
      default: "",
      trim: true,
    },

    // رقم الشعبة  e.g. "1", "2", "A", "B"
    sectionNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // وقت المحاضرة  e.g. "السبت/الاثنين 8:00 - 10:00"
    time: {
      type: String,
      default: "",
      trim: true,
    },

    semester: {
      type: String,
      default: "2025/2026",
      trim: true,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// doctor teaches a subject only once per semester
courseOfferingSchema.index(
  { doctorId: 1, subjectCode: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CourseOffering",
  courseOfferingSchema,
  "courseofferings"
);
