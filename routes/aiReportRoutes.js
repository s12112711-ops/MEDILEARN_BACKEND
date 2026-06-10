const express = require("express");
const router = express.Router();
const AiReportStudant = require("../models/AiReportStudant");

// POST /api/ai/save-ai-report — حفظ تقرير جلسة AI
router.post("/save-ai-report", async (req, res) => {
  try {
    const { userId, score, totalCases, history } = req.body;

    if (
      !userId ||
      score === undefined ||
      totalCases === undefined ||
      !Array.isArray(history)
    ) {
      return res.status(400).json({ message: "Missing data" });
    }

    const newReport = new AiReportStudant({
      userId,
      score,
      totalCases,
      history,
    });

    await newReport.save();

    res.status(200).json({ message: "Report saved successfully" });
  } catch (error) {
    console.error("Save AI report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/ai/reports/:userId — كل تقارير طالب معين
router.get("/reports/:userId", async (req, res) => {
  try {
    const reports = await AiReportStudant.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    const formatted = reports.map((r) => ({
      _id: r._id,
      score: r.score,
      totalCases: r.totalCases,
      percentage:
        r.totalCases === 0
          ? 0
          : Math.round((r.score / r.totalCases) * 100),
      history: r.history,
      createdAt: r.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Get AI reports error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// GET /api/ai/reports/all — كل التقارير (للأدمن)
router.get("/reports/all", async (req, res) => {
  try {
    const reports = await AiReportStudant.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

module.exports = router;
