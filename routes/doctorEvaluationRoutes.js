const express = require("express");
const router = express.Router();
const DoctorEvaluationCase = require("../models/DoctorEvaluationCase");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");

// =======================================
// Get all available doctors for assignment
// =======================================
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ availableForReview: true })
      .populate("userId", "fullName email role")
      .sort({ specialization: 1, doctorName: 1 });

    const formattedDoctors = doctors.map((doctor) => ({
      _id: doctor.userId?._id || doctor.userId,
      doctorProfileId: doctor._id,
      fullName: doctor.doctorName,
      email: doctor.userId?.email || "",
      role: doctor.userId?.role || "doctor",
      specialization: doctor.specialization,
      department: doctor.department,
      title: doctor.title,
      academicDegree: doctor.academicDegree,
      yearsOfExperience: doctor.yearsOfExperience,
      hospitalAffiliation: doctor.hospitalAffiliation,
      bio: doctor.bio,
      priorityLevel: doctor.priorityLevel,
      availableForReview: doctor.availableForReview,
    }));

    res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// =======================================
// Get available doctors by specialty
// =======================================
router.get("/doctors/specialty/:specialty", async (req, res) => {
  try {
    const specialty = req.params.specialty.trim();

    const doctors = await DoctorProfile.find({
      specialization: { $regex: new RegExp(`^${specialty}$`, "i") },
      availableForReview: true,
    })
      .populate("userId", "fullName email role")
      .sort({ doctorName: 1 });

    const formattedDoctors = doctors.map((doctor) => ({
      _id: doctor.userId?._id || doctor.userId,
      doctorProfileId: doctor._id,
      fullName: doctor.doctorName,
      email: doctor.userId?.email || "",
      role: doctor.userId?.role || "doctor",
      specialization: doctor.specialization,
      department: doctor.department,
      title: doctor.title,
      academicDegree: doctor.academicDegree,
      yearsOfExperience: doctor.yearsOfExperience,
      hospitalAffiliation: doctor.hospitalAffiliation,
      bio: doctor.bio,
      priorityLevel: doctor.priorityLevel,
      availableForReview: doctor.availableForReview,
    }));

    res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error("Get doctors by specialty error:", error);
    res.status(500).json({ message: "Failed to fetch doctors by specialty" });
  }
});

// =======================================
// Student creates new evaluation case
// =======================================
router.post("/", async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      assignedDoctorId,
      assignedDoctorName,
      caseTitle,
      specialty,
      symptoms,
      history,
      provisionalDiagnosis,
      studentPlan,
    } = req.body;

    if (
      !studentId ||
      !studentName ||
      !assignedDoctorId ||
      !assignedDoctorName ||
      !caseTitle ||
      !symptoms
    ) {
      return res.status(400).json({
        message:
          "studentId, studentName, assignedDoctorId, assignedDoctorName, caseTitle, and symptoms are required",
      });
    }

    const doctorProfile = await DoctorProfile.findOne({
      userId: assignedDoctorId,
      availableForReview: true,
    });

    if (!doctorProfile) {
      return res.status(400).json({
        message: "Assigned doctor is not available in doctor profiles",
      });
    }

    const newCase = new DoctorEvaluationCase({
      studentId,
      studentName,
      assignedDoctorId,
      assignedDoctorProfileId: doctorProfile._id,
      assignedDoctorName,
      doctorSpecialization: doctorProfile.specialization,
      doctorDepartment: doctorProfile.department,
      doctorTitle: doctorProfile.title,
      caseTitle,
      specialty: specialty || "General Medicine",
      symptoms,
      history: history || "",
      provisionalDiagnosis: provisionalDiagnosis || "",
      studentPlan: studentPlan || "",
      status: "pending",
    });

    await newCase.save();

    res.status(201).json({
      message: "Case submitted successfully",
      evaluationCase: newCase,
    });
  } catch (error) {
    console.error("Create evaluation case error:", error);
    res.status(500).json({ message: "Failed to submit case" });
  }
});

// =======================================
// Student gets own submitted cases
// =======================================
router.get("/student/:studentId", async (req, res) => {
  try {
    const cases = await DoctorEvaluationCase.find({
      studentId: req.params.studentId,
    }).sort({ createdAt: -1 });

    res.status(200).json(cases);
  } catch (error) {
    console.error("Get student evaluation cases error:", error);
    res.status(500).json({ message: "Failed to fetch student cases" });
  }
});

// =======================================
// Doctor gets assigned cases
// =======================================
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const cases = await DoctorEvaluationCase.find({
      assignedDoctorId: req.params.doctorId,
    }).sort({ status: 1, createdAt: -1 });

    res.status(200).json(cases);
  } catch (error) {
    console.error("Get doctor assigned cases error:", error);
    res.status(500).json({ message: "Failed to fetch doctor cases" });
  }
});

// =======================================
// Doctor reviews case
// =======================================
router.put("/:caseId/review", async (req, res) => {
  try {
    const { doctorFeedback, doctorScore } = req.body;

    if (!doctorFeedback || doctorScore === undefined || doctorScore === null) {
      return res.status(400).json({
        message: "doctorFeedback and doctorScore are required",
      });
    }

    const updatedCase = await DoctorEvaluationCase.findByIdAndUpdate(
      req.params.caseId,
      {
        doctorFeedback,
        doctorScore,
        status: "reviewed",
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.status(200).json({
      message: "Case reviewed successfully",
      evaluationCase: updatedCase,
    });
  } catch (error) {
    console.error("Review evaluation case error:", error);
    res.status(500).json({ message: "Failed to review case" });
  }
});

module.exports = router;