const express = require("express");
const router = express.Router();

const Material = require("../models/Material");
const Register = require("../models/Register");



// ===============================
// Create Material
// POST /api/materials
// ===============================
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,

      subjectCode,
      subjectName,

      topic,
      type,
      fileUrl,

      doctorId,
      doctorName,

      sectionName,

      isPublished,
    } = req.body;

    // ===============================
    // Validation
    // ===============================
    if (!title || !subjectCode || !subjectName) {
      return res.status(400).json({
        message: "Title and subject are required",
      });
    }

    if (!doctorId || !doctorName) {
      return res.status(400).json({
        message: "Doctor ID and doctor name are required",
      });
    }

    // ===============================
    // Create material
    // ===============================
    const newMaterial = new Material({
      title: title.trim(),

      description: description?.trim() || "",

      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),

      doctorId: doctorId.trim(),
      doctorName: doctorName.trim(),

      sectionName:
        sectionName?.trim() ||
        `${subjectName} - ${doctorName}`,

      topic: topic?.trim() || "",

      type: type || "pdf",

      fileUrl: fileUrl?.trim() || "",

      isPublished:
        isPublished !== undefined
          ? isPublished
          : true,
    });

    await newMaterial.save();

    res.status(201).json({
      message: "Material uploaded successfully",
      material: newMaterial,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Get All Materials
// GET /api/materials
// ===============================
router.get("/", async (req, res) => {
  try {
    const materials = await Material.find().sort({
      createdAt: -1,
    });

    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Get Doctor Materials
// GET /api/materials/doctor/:doctorId
// ===============================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    const materials = await Material.find({
      doctorId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Get Student Materials
// Only materials for
// registered doctor + subject
// GET /api/materials/student/:studentId
// ===============================
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const registrations = await Register.find({
      studentId,
      isActive: true,
    });

    if (
      !registrations ||
      registrations.length === 0
    ) {
      return res.status(200).json([]);
    }

    const filters = registrations.map((reg) => ({
      doctorId: reg.doctorId,
      subjectCode: reg.subjectCode,
    }));

    const materials = await Material.find({
      isPublished: true,
      $or: filters,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Get One Material
// GET /api/materials/:id
// ===============================
router.get("/:id", async (req, res) => {
  try {
    const material = await Material.findById(
      req.params.id
    );

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Update Material
// PUT /api/materials/:id
// ===============================
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      description,

      subjectCode,
      subjectName,

      topic,
      type,
      fileUrl,

      doctorId,
      doctorName,

      sectionName,

      isPublished,
    } = req.body;

    const updatedMaterial =
      await Material.findByIdAndUpdate(
        req.params.id,
        {
          ...(title !== undefined && {
            title: title.trim(),
          }),

          ...(description !== undefined && {
            description: description.trim(),
          }),

          ...(subjectCode !== undefined && {
            subjectCode:
              subjectCode.trim(),
          }),

          ...(subjectName !== undefined && {
            subjectName:
              subjectName.trim(),
          }),

          ...(doctorId !== undefined && {
            doctorId: doctorId.trim(),
          }),

          ...(doctorName !== undefined && {
            doctorName:
              doctorName.trim(),
          }),

          ...(sectionName !== undefined && {
            sectionName:
              sectionName.trim(),
          }),

          ...(topic !== undefined && {
            topic: topic.trim(),
          }),

          ...(type !== undefined && {
            type,
          }),

          ...(fileUrl !== undefined && {
            fileUrl: fileUrl.trim(),
          }),

          ...(isPublished !== undefined && {
            isPublished,
          }),
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedMaterial) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material updated successfully",
      material: updatedMaterial,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



// ===============================
// Delete Material
// DELETE /api/materials/:id
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const deletedMaterial =
      await Material.findByIdAndDelete(
        req.params.id
      );

    if (!deletedMaterial) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});



module.exports = router;