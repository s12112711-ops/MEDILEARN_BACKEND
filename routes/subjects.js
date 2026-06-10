const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

// ======================================
// Get All Subjects
// GET /api/subjects
// ======================================
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({
      subjectName: 1,
    });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subjects", error: error.message });
  }
});

// ======================================
// Get One Subject with prerequisites info
// GET /api/subjects/:subjectCode
// ======================================
router.get("/:subjectCode", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      subjectCode: req.params.subjectCode,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // جلب أسماء المتطلبات السابقة
    let prerequisiteDetails = [];
    if (subject.prerequisites.length > 0) {
      prerequisiteDetails = await Subject.find({
        subjectCode: { $in: subject.prerequisites },
      }).select("subjectCode subjectName");
    }

    res.status(200).json({
      ...subject.toObject(),
      prerequisiteDetails,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subject", error: error.message });
  }
});

// ======================================
// Create Subject (Admin)
// POST /api/subjects
// ======================================
router.post("/", async (req, res) => {
  try {
    const { subjectCode, subjectName, description, prerequisites } = req.body;

    if (!subjectCode || !subjectName) {
      return res.status(400).json({
        message: "subjectCode and subjectName are required",
      });
    }

    const existing = await Subject.findOne({ subjectCode: subjectCode.trim() });
    if (existing) {
      return res.status(400).json({
        message: "Subject with this code already exists",
      });
    }

    // تحقق أن المتطلبات السابقة موجودة في النظام
    if (prerequisites && prerequisites.length > 0) {
      const found = await Subject.find({
        subjectCode: { $in: prerequisites },
      });
      if (found.length !== prerequisites.length) {
        const foundCodes = found.map((s) => s.subjectCode);
        const invalid = prerequisites.filter((c) => !foundCodes.includes(c));
        return res.status(400).json({
          message: "Some prerequisite subject codes do not exist",
          invalidCodes: invalid,
        });
      }
    }

    const subject = new Subject({
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      description: description?.trim() || "",
      prerequisites: prerequisites || [],
    });

    await subject.save();

    res.status(201).json({
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create subject", error: error.message });
  }
});

// ======================================
// Update Subject (Admin)
// PUT /api/subjects/:subjectCode
// ======================================
router.put("/:subjectCode", async (req, res) => {
  try {
    const { subjectName, description, prerequisites, isActive } = req.body;

    // تحقق أن المتطلبات السابقة موجودة
    if (prerequisites && prerequisites.length > 0) {
      const found = await Subject.find({
        subjectCode: { $in: prerequisites },
      });
      if (found.length !== prerequisites.length) {
        const foundCodes = found.map((s) => s.subjectCode);
        const invalid = prerequisites.filter((c) => !foundCodes.includes(c));
        return res.status(400).json({
          message: "Some prerequisite subject codes do not exist",
          invalidCodes: invalid,
        });
      }
    }

    const updated = await Subject.findOneAndUpdate(
      { subjectCode: req.params.subjectCode },
      {
        ...(subjectName    !== undefined && { subjectName: subjectName.trim() }),
        ...(description    !== undefined && { description: description.trim() }),
        ...(prerequisites  !== undefined && { prerequisites }),
        ...(isActive       !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({
      message: "Subject updated successfully",
      subject: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update subject", error: error.message });
  }
});

// ======================================
// Delete Subject (Admin)
// DELETE /api/subjects/:subjectCode
// ======================================
router.delete("/:subjectCode", async (req, res) => {
  try {
    const deleted = await Subject.findOneAndDelete({
      subjectCode: req.params.subjectCode,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete subject", error: error.message });
  }
});

module.exports = router;
