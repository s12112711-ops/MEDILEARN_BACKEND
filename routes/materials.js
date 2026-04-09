const express = require("express");
const router = express.Router();
const Material = require("../models/Material");

// Create material
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      topic,
      type,
      fileUrl,
      uploadedBy,
      uploadedByName,
      isPublished,
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        message: "Title and subject are required",
      });
    }

    const newMaterial = new Material({
      title: title.trim(),
      description: description?.trim() || "",
      subject: subject.trim(),
      topic: topic?.trim() || "",
      type: type || "pdf",
      fileUrl: fileUrl?.trim() || "",
      uploadedBy: uploadedBy || null,
      uploadedByName: uploadedByName?.trim() || "",
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await newMaterial.save();

    res.status(201).json({
      message: "Material uploaded successfully",
      material: newMaterial,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all materials
router.get("/", async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one material by id
router.get("/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update material
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      topic,
      type,
      fileUrl,
      uploadedBy,
      uploadedByName,
      isPublished,
    } = req.body;

    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(topic !== undefined && { topic: topic.trim() }),
        ...(type !== undefined && { type }),
        ...(fileUrl !== undefined && { fileUrl: fileUrl.trim() }),
        ...(uploadedBy !== undefined && { uploadedBy: uploadedBy || null }),
        ...(uploadedByName !== undefined && {
          uploadedByName: uploadedByName.trim(),
        }),
        ...(isPublished !== undefined && { isPublished }),
      },
      { new: true, runValidators: true }
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
    res.status(500).json({ message: err.message });
  }
});

// Delete material
router.delete("/:id", async (req, res) => {
  try {
    const deletedMaterial = await Material.findByIdAndDelete(req.params.id);

    if (!deletedMaterial) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;