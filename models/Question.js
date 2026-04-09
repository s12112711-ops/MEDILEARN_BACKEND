const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return value.length >= 2;
        },
        message: "Question must have at least 2 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);