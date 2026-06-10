// One-time migration: add existing students to ApprovedStudent collection
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const ApprovedStudent = require("./models/ApprovedStudent");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const students = await User.find({ role: "student" });
  console.log(`Found ${students.length} existing students`);

  let added = 0, skipped = 0;

  for (const s of students) {
    if (!s.studentId) { skipped++; continue; }

    const exists = await ApprovedStudent.findOne({ studentId: s.studentId });
    if (exists) { console.log(`  ⏭  Already exists: ${s.studentId}`); skipped++; continue; }

    await ApprovedStudent.create({
      studentId:    s.studentId,
      fullName:     s.fullName || "Unknown",
      email:        s.email || `${s.studentId}@student.edu`,
      yearLevel:    s.yearLevel || "",
      isRegistered: true,   // already registered
    });
    console.log(`  ✅ Migrated: ${s.fullName} (${s.studentId})`);
    added++;
  }

  console.log(`\nDone — ${added} migrated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
