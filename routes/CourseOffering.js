const express = require("express");
const router = express.Router();
const CourseOffering = require("../models/CourseOffering");

// ======================================
// STUDENT FLOW — Step 1
// Get unique open subjects for this semester
// The student sees a list of subjects to pick from
// GET /api/offerings/subjects
// ======================================
router.get("/subjects", async (req, res) => {
  try {
    const { semester } = req.query;

    const filter = { isOpen: true };
    if (semester) filter.semester = semester;

    // Group by subjectCode — return one entry per subject
    const subjects = await CourseOffering.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$subjectCode",
          subjectCode: { $first: "$subjectCode" },
          subjectName: { $first: "$subjectName" },
          semester: { $first: "$semester" },
          sectionsCount: { $sum: 1 },
        },
      },
      { $sort: { subjectName: 1 } },
    ]);

    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch subjects",
      error: error.message,
    });
  }
});

// ======================================
// STUDENT FLOW — Step 2
// Get all open sections for a subject
// Student picks a subject → sees doctors + section numbers + times
// GET /api/offerings/subject/:subjectCode
// ======================================
router.get("/subject/:subjectCode", async (req, res) => {
  try {
    const { semester } = req.query;

    const filter = {
      subjectCode: req.params.subjectCode,
      isOpen: true,
    };
    if (semester) filter.semester = semester;

    const sections = await CourseOffering.find(filter).sort({
      sectionNumber: 1,
      doctorName: 1,
    });

    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sections",
      error: error.message,
    });
  }
});

// ======================================
// Get All Offerings (admin)
// GET /api/offerings
// ======================================
router.get("/", async (req, res) => {
  try {
    const offerings = await CourseOffering.find().sort({
      subjectName: 1,
      doctorName: 1,
    });
    res.status(200).json(offerings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch offerings",
      error: error.message,
    });
  }
});

// ======================================
// Get Open Offerings
// GET /api/offerings/open
// ======================================
router.get("/open", async (req, res) => {
  try {
    const offerings = await CourseOffering.find({ isOpen: true }).sort({
      subjectName: 1,
      doctorName: 1,
    });
    res.status(200).json(offerings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch open offerings",
      error: error.message,
    });
  }
});

// ======================================
// DOCTOR FLOW — My Courses
// GET /api/offerings/doctor/:doctorId
// ======================================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const offerings = await CourseOffering.find({
      doctorId: req.params.doctorId,
    }).sort({ subjectName: 1 });
    res.status(200).json(offerings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch doctor offerings",
      error: error.message,
    });
  }
});

// ======================================
// Create Course Offering (admin)
// POST /api/offerings
// ======================================
router.post("/", async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      subjectCode,
      subjectName,
      sectionName,
      sectionNumber,
      time,
      semester,
      isOpen,
    } = req.body;

    if (!doctorId || !doctorName || !subjectCode || !subjectName) {
      return res.status(400).json({
        message: "doctorId, doctorName, subjectCode, and subjectName are required",
      });
    }

    const existing = await CourseOffering.findOne({ doctorId, subjectCode });
    if (existing) {
      return res.status(400).json({
        message: "This doctor already has an offering for this subject",
      });
    }

    const offering = new CourseOffering({
      doctorId: doctorId.trim(),
      doctorName: doctorName.trim(),
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      sectionName: sectionName?.trim() || "",
      sectionNumber: sectionNumber?.trim() || "",
      time: time?.trim() || "",
      semester: semester || "2025/2026",
      isOpen: isOpen !== undefined ? isOpen : true,
    });

    await offering.save();

    res.status(201).json({
      message: "Course offering created successfully",
      offering,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create course offering",
      error: error.message,
    });
  }
});

// ======================================
// Update Offering (admin)
// PUT /api/offerings/:id
// ======================================
router.put("/:id", async (req, res) => {
  try {
    const {
      doctorName,
      subjectName,
      sectionName,
      sectionNumber,
      time,
      semester,
      isOpen,
    } = req.body;

    const updated = await CourseOffering.findByIdAndUpdate(
      req.params.id,
      {
        ...(doctorName !== undefined && { doctorName: doctorName.trim() }),
        ...(subjectName !== undefined && { subjectName: subjectName.trim() }),
        ...(sectionName !== undefined && { sectionName: sectionName.trim() }),
        ...(sectionNumber !== undefined && { sectionNumber: sectionNumber.trim() }),
        ...(time !== undefined && { time: time.trim() }),
        ...(semester !== undefined && { semester }),
        ...(isOpen !== undefined && { isOpen }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json({
      message: "Offering updated successfully",
      offering: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update offering",
      error: error.message,
    });
  }
});

// ======================================
// Delete Offering (admin)
// DELETE /api/offerings/:id
// ======================================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CourseOffering.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Offering not found" });
    }

    res.status(200).json({ message: "Offering deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete offering",
      error: error.message,
    });
  }
});

module.exports = router;
