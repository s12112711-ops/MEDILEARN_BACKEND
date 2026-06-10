const express = require("express");
const router = express.Router();

const Register = require("../models/Register");

// ======================================
// Register Student
// POST /api/register
// ======================================
router.post("/", async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      subjectCode,
      subjectName,
      doctorId,
      doctorName,
      sectionName,
      semester,
    } = req.body;

    if (
      !studentId ||
      !studentName ||
      !subjectCode ||
      !subjectName ||
      !doctorId ||
      !doctorName
    ) {
      return res.status(400).json({
        message:
          "studentId, studentName, subjectCode, subjectName, doctorId, and doctorName are required",
      });
    }

    // ======================================
    // Prevent duplicate registration in same semester
    // ======================================
    const existingSubject = await Register.findOne({
      studentId,
      subjectCode,
      semester: semester || "2025/2026",
      isActive: true,
    });

    if (existingSubject) {
      return res.status(400).json({
        message: "You already registered this subject",
      });
    }

    // ======================================
    // Create registration
    // ======================================
    const registration = new Register({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      doctorId: doctorId.trim(),
      doctorName: doctorName.trim(),
      sectionName: sectionName?.trim() || `${subjectName} - ${doctorName}`,
      semester: semester || "2025/2026",
      isActive: true,
      status: "active",
    });

    await registration.save();

    res.status(201).json({
      message: "Student registered successfully",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register student",
      error: error.message,
    });
  }
});

// ======================================
// Update Registration Status
// PUT /api/register/:id/status
// Doctor/Admin marks student as passed or failed
// ======================================
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "passed", "failed"].includes(status)) {
      return res.status(400).json({
        message: "status must be: active, passed, or failed",
      });
    }

    const updated = await Register.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json({
      message: `Student marked as ${status}`,
      registration: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update status",
      error: error.message,
    });
  }
});

// ======================================
// Get All Registrations (admin)
// GET /api/register
// ======================================
router.get("/", async (req, res) => {
  try {
    const registrations = await Register.find().sort({
      subjectName: 1,
      doctorName: 1,
      studentName: 1,
    });
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
});

// ======================================
// Get Student Registrations
// GET /api/register/student/:studentId
// ======================================
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const registrations = await Register.find({
      studentId,
      isActive: true,
    }).sort({ subjectName: 1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student registrations",
      error: error.message,
    });
  }
});

// ======================================
// Get Student Passed Subjects
// GET /api/register/student/:studentId/passed
// ======================================
router.get("/student/:studentId/passed", async (req, res) => {
  try {
    const passed = await Register.find({
      studentId: req.params.studentId,
      status: "passed",
    }).sort({ subjectName: 1 });

    res.status(200).json(passed);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch passed subjects",
      error: error.message,
    });
  }
});

// ======================================
// Get Doctor Students
// GET /api/register/doctor/:doctorId
// ======================================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const registrations = await Register.find({
      doctorId: req.params.doctorId,
      isActive: true,
    }).sort({ subjectName: 1, studentName: 1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch doctor registrations",
      error: error.message,
    });
  }
});

// ======================================
// Get Doctor Subject Students
// GET /api/register/doctor/:doctorId/subject/:subjectCode
// ======================================
router.get("/doctor/:doctorId/subject/:subjectCode", async (req, res) => {
  try {
    const { doctorId, subjectCode } = req.params;

    const registrations = await Register.find({
      doctorId,
      subjectCode,
      isActive: true,
    }).sort({ studentName: 1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch subject students",
      error: error.message,
    });
  }
});

// ======================================
// Get Subject Registrations
// GET /api/register/subject/:subjectCode
// ======================================
router.get("/subject/:subjectCode", async (req, res) => {
  try {
    const registrations = await Register.find({
      subjectCode: req.params.subjectCode,
      isActive: true,
    }).sort({ doctorName: 1, studentName: 1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch subject registrations",
      error: error.message,
    });
  }
});

// ======================================
// Delete Registration
// DELETE /api/register/:id
// ======================================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Register.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete registration",
      error: error.message,
    });
  }
});

module.exports = router;
