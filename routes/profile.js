const express = require("express");
const router = express.Router();
const User = require("../models/User");
const QuizResult = require("../models/QuizResult");

// حساب الـ streak الحقيقي بناءً على تواريخ التسليم
function calculateStreak(results) {
  if (!results.length) return 0;

  // استخرج أيام فريدة (بدون وقت) مرتبة من الأحدث للأقدم
  const days = [
    ...new Set(
      results.map((r) => new Date(r.createdAt).toDateString())
    ),
  ].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const dayStr of days) {
    const day = new Date(dayStr);
    const diffDays = Math.round(
      (expected - day) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      streak++;
      expected = day;
    } else {
      break;
    }
  }

  return streak;
}

// GET /api/profile/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const results = await QuizResult.find({ studentId: req.params.userId })
      .populate("quizId", "subject title topic")
      .sort({ createdAt: -1 });

    const totalPoints = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalQuestions = results.reduce(
      (sum, r) => sum + (r.totalQuestions || 0),
      0
    );
    const overallPercentage =
      totalQuestions === 0
        ? 0
        : Math.round((totalPoints / totalQuestions) * 100);

    const recentQuizzes = results.slice(0, 5).map((r) => ({
      _id: r._id,
      quizId: r.quizId?._id,
      subject: r.quizId?.subject || r.quizId?.title || "Medical Quiz",
      topic: r.quizId?.topic || "",
      score: r.score,
      totalQuestions: r.totalQuestions,
      percentage:
        r.totalQuestions === 0
          ? 0
          : Math.round((r.score / r.totalQuestions) * 100),
      createdAt: r.createdAt,
    }));

    // بادجات حقيقية
    const badges = [];
    if (results.length >= 1) badges.push("First Step");
    if (results.length >= 10) badges.push("Active Learner");
    if (results.length >= 25) badges.push("Quiz Master");
    if (totalPoints >= 50) badges.push("Scholar");
    if (totalPoints >= 200) badges.push("Expert");
    if (overallPercentage >= 90) badges.push("Top Performer");

    res.status(200).json({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      studentId: user.studentId || "",
      doctorId: user.doctorId || "",
      totalPoints,
      totalQuizzes: results.length,
      overallPercentage,
      currentStreak: calculateStreak(results),
      badges,
      recentQuizzes,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
