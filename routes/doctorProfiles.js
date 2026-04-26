const express = require("express");
const router = express.Router();

const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");

// ==============================
// Create doctor profile
// ==============================
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      doctorName,
      specialization,
      department,
      title,
      licenseNumber,
      yearsOfExperience,
      academicDegree,
      hospitalAffiliation,
      bio,
      availableForReview,
      priorityLevel,
    } = req.body;

    if (!userId || !doctorName || !specialization || !department) {
      return res.status(400).json({
        message:
          "userId, doctorName, specialization, and department are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Linked user not found",
      });
    }

    if (user.role !== "doctor") {
      return res.status(400).json({
        message: "The linked user is not a doctor",
      });
    }

    const existingProfile = await DoctorProfile.findOne({ userId });

    if (existingProfile) {
      return res.status(400).json({
        message: "Doctor profile already exists for this user",
      });
    }

    const profile = new DoctorProfile({
      userId,
      doctorName: doctorName.trim(),
      specialization: specialization.trim(),
      department: department.trim(),
      title: title?.trim() || "",
      licenseNumber: licenseNumber?.trim() || "",
      yearsOfExperience: Number(yearsOfExperience) || 0,
      academicDegree: academicDegree?.trim() || "",
      hospitalAffiliation: hospitalAffiliation?.trim() || "",
      bio: bio?.trim() || "",
      availableForReview:
        availableForReview === undefined ? true : availableForReview,
      priorityLevel: priorityLevel?.trim() || "senior",
    });

    await profile.save();

    res.status(201).json({
      message: "Doctor profile created successfully",
      profile,
    });
  } catch (err) {
    console.error("Create doctor profile error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get all doctor profiles
// ==============================
router.get("/", async (req, res) => {
  try {
    const profiles = await DoctorProfile.find()
      .populate("userId", "fullName email role")
      .sort({ specialization: 1, doctorName: 1 });

    res.status(200).json(profiles);
  } catch (err) {
    console.error("Get doctor profiles error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get only available doctors
// ==============================
router.get("/available", async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({ availableForReview: true })
      .populate("userId", "fullName email role")
      .sort({ specialization: 1, doctorName: 1 });

    res.status(200).json(profiles);
  } catch (err) {
    console.error("Get available doctor profiles error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get doctor profiles by specialty
// ==============================
router.get("/specialty/:specialty", async (req, res) => {
  try {
    const specialty = req.params.specialty.trim().toLowerCase();

    const profiles = await DoctorProfile.find({
      specialization: { $regex: new RegExp(`^${specialty}$`, "i") },
      availableForReview: true,
    })
      .populate("userId", "fullName email role")
      .sort({ doctorName: 1 });

    res.status(200).json(profiles);
  } catch (err) {
    console.error("Get doctor profiles by specialty error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get one doctor profile by id
// ==============================
router.get("/:id", async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id).populate(
      "userId",
      "fullName email role"
    );

    if (!profile) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Get doctor profile by id error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Update doctor profile
// ==============================
router.put("/:id", async (req, res) => {
  try {
    const {
      doctorName,
      specialization,
      department,
      title,
      licenseNumber,
      yearsOfExperience,
      academicDegree,
      hospitalAffiliation,
      bio,
      availableForReview,
      priorityLevel,
    } = req.body;

    const updatedProfile = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      {
        ...(doctorName !== undefined && { doctorName: doctorName.trim() }),
        ...(specialization !== undefined && {
          specialization: specialization.trim(),
        }),
        ...(department !== undefined && { department: department.trim() }),
        ...(title !== undefined && { title: title.trim() }),
        ...(licenseNumber !== undefined && {
          licenseNumber: licenseNumber.trim(),
        }),
        ...(yearsOfExperience !== undefined && {
          yearsOfExperience: Number(yearsOfExperience) || 0,
        }),
        ...(academicDegree !== undefined && {
          academicDegree: academicDegree.trim(),
        }),
        ...(hospitalAffiliation !== undefined && {
          hospitalAffiliation: hospitalAffiliation.trim(),
        }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(availableForReview !== undefined && { availableForReview }),
        ...(priorityLevel !== undefined && {
          priorityLevel: priorityLevel.trim(),
        }),
      },
      { new: true, runValidators: true }
    ).populate("userId", "fullName email role");

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      message: "Doctor profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("Update doctor profile error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Delete doctor profile
// ==============================
router.delete("/:id", async (req, res) => {
  try {
    const deletedProfile = await DoctorProfile.findByIdAndDelete(req.params.id);

    if (!deletedProfile) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      message: "Doctor profile deleted successfully",
    });
  } catch (err) {
    console.error("Delete doctor profile error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;