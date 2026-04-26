const mongoose = require("mongoose");

const doctorEvaluationCaseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedDoctorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      default: null,
    },
    assignedDoctorName: {
      type: String,
      required: true,
      trim: true,
    },

    doctorSpecialization: {
      type: String,
      default: "",
      trim: true,
    },
    doctorDepartment: {
      type: String,
      default: "",
      trim: true,
    },
    doctorTitle: {
      type: String,
      default: "",
      trim: true,
    },

    caseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      default: "General Medicine",
      trim: true,
    },

    symptoms: {
      type: String,
      required: true,
      trim: true,
    },
    history: {
      type: String,
      default: "",
      trim: true,
    },
    provisionalDiagnosis: {
      type: String,
      default: "",
      trim: true,
    },
    studentPlan: {
      type: String,
      default: "",
      trim: true,
    },

    doctorFeedback: {
      type: String,
      default: "",
      trim: true,
    },
    doctorScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DoctorEvaluationCase",
  doctorEvaluationCaseSchema
);