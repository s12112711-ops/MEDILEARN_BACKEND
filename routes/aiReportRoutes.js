const express = require("express");
const router = express.Router();

const AiReportStudant = require("../models/AiReportStudant");

router.post("/save-ai-report", async (req, res) => {
  try {
    const { userId, score, totalCases, history } = req.body;

    console.log("Incoming data:", req.body);

    // ✅ تحقق صحيح
    if (!userId || score === undefined || totalCases === undefined || !Array.isArray(history)) {
  return res.status(400).json({ message: "Missing data" });
}




    const newReport = new AiReportStudant({
      userId,
      score,
      totalCases,
      history,
    });

    await newReport.save();

    console.log("✅ Report saved in MongoDB");

    res.status(200).json({ message: "Report saved successfully" });
  } catch (error) {
    console.log("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;