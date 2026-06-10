const express = require("express");
const router = express.Router();
const QuizResult = require("../models/QuizResult");

// GET /api/leaderboard/weekly  — last 7 days only
router.get("/weekly", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const results = await QuizResult.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$studentName" },
          weeklyPoints: { $sum: "$score" },
          quizzesTaken: { $sum: 1 },
        },
      },
      { $sort: { weeklyPoints: -1 } },
      { $limit: 50 },
    ]);

    const formatted = results.map((item, index) => ({
      rank: index + 1,
      userId: item._id,
      studentName: item.studentName || "Student",
      weeklyPoints: item.weeklyPoints,
      quizzesTaken: item.quizzesTaken,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// GET /api/leaderboard/alltime
router.get("/alltime", async (req, res) => {
  try {
    const results = await QuizResult.aggregate([
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$studentName" },
          totalPoints: { $sum: "$score" },
          quizzesTaken: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 50 },
    ]);

    const formatted = results.map((item, index) => ({
      rank: index + 1,
      userId: item._id,
      studentName: item.studentName || "Student",
      totalPoints: item.totalPoints,
      quizzesTaken: item.quizzesTaken,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

module.exports = router;
