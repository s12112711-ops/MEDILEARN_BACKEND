const express = require("express");
const router = express.Router();
const QuizResult = require("../models/QuizResult");

// GET /api/leaderboard/weekly
router.get("/weekly", async (req, res) => {
  try {
    // Aggregate results to sum up scores per student
    const results = await QuizResult.aggregate([
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$studentName" },
          weeklyPoints: { $sum: "$score" }
        }
      },
      {
        $sort: { weeklyPoints: -1 }
      }
    ]);

    const formatted = results.map((item, index) => ({
      userId: item._id,
      studentName: item.studentName || "Student",
      weeklyPoints: item.weeklyPoints,
      rank: index + 1
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

module.exports = router;
