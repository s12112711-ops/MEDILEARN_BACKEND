const express = require("express");
const router = express.Router();
const User = require("../models/User");
const QuizResult = require("../models/QuizResult");

// GET /api/profile/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all results for this student
    const results = await QuizResult.find({ studentId: req.params.userId })
      .populate("quizId", "subject title")
      .sort({ createdAt: -1 });

    const totalPoints = results.reduce((sum, r) => sum + (r.score || 0), 0);
    
    // Format recent quizzes for the profile view
    const recentQuizzes = results.slice(0, 5).map(r => ({
      _id: r._id,
      subject: r.quizId?.subject || r.quizId?.title || "Medical Quiz",
      score: r.score,
      totalQuestions: r.totalQuestions,
      pointsEarned: r.score, // Simple 1 point per correct answer
      createdAt: r.createdAt
    }));

    // Simple badge logic
    const badges = [];
    if (results.length >= 1) badges.push("First Step");
    if (totalPoints >= 50) badges.push("Scholar");
    if (totalPoints >= 200) badges.push("Expert");

    res.status(200).json({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      totalPoints,
      currentStreak: results.length > 0 ? 3 : 0, // Mocked streak
      badges,
      recentQuizzes
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
