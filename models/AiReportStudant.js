const mongoose = require("mongoose");

const AiReportStudantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  score: {
    type: Number,
    required: true,
  },

  totalCases: {
    type: Number,
    required: true,
  },

  history: {
    type: Array, // كل الكيسز
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//module.exports = mongoose.model("AiReportStudant", AiReportStudantSchema);
module.exports = mongoose.model(
  "AiReportStudant",
  AiReportStudantSchema,
  "AiReportStudant" // 👈 هذا أهم سطر
);