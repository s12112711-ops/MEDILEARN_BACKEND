const mongoose = require("mongoose");

const approvedStudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  fullName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  yearLevel: { type: String, default: "", trim: true },
  isRegistered: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("ApprovedStudent", approvedStudentSchema);
