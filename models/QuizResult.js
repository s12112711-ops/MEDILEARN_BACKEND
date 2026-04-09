const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      default: "",
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    answers: [
      {
        questionId: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

quizResultSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("QuizResult", quizResultSchema);