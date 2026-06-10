const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");

// Get all results (admin)
router.get("/all", async (req, res) => {
  try {
    const results = await QuizResult.find()
      .populate("quizId", "title subject topic")
      .sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit quiz result
router.post("/submit", async (req, res) => {
  try {
    const { quizId, studentId, studentName, answers } = req.body;

    if (!quizId || !studentId || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "quizId, studentId and answers are required",
      });
    }

    const existingResult = await QuizResult.findOne({ quizId, studentId });
    if (existingResult) {
      return res.status(400).json({
        message: "You have already submitted this quiz",
        alreadySubmitted: true,
      });
    }

    // populate questions so we can access correctAnswer
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quizQuestions = quiz.questions || [];
    let score = 0;

    const finalAnswers = quizQuestions.map((question) => {
      const studentAnswer = answers.find(
        (a) => a.questionId.toString() === question._id.toString()
      );

      const selectedAnswer = studentAnswer?.selectedAnswer || "";
      const correctAnswer = question.correctAnswer;
      const isCorrect = selectedAnswer === correctAnswer;

      if (isCorrect) score++;

      return {
        questionId: question._id.toString(),
        selectedAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    const result = new QuizResult({
      quizId,
      studentId,
      studentName: studentName || "",
      score,
      totalQuestions: quizQuestions.length,
      answers: finalAnswers,
    });

    await result.save();

    res.status(201).json({
      message: "Quiz submitted successfully",
      score,
      totalQuestions: quizQuestions.length,
      percentage: quizQuestions.length === 0
        ? 0
        : Math.round((score / quizQuestions.length) * 100),
      result,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted this quiz",
        alreadySubmitted: true,
      });
    }
    res.status(500).json({ message: err.message });
  }
});

// Check if already submitted
router.get("/check/:quizId/:studentId", async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    const existingResult = await QuizResult.findOne({ quizId, studentId });
    res.status(200).json({
      alreadySubmitted: !!existingResult,
      result: existingResult || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all results for one quiz (doctor view)
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const results = await QuizResult.find({ quizId: req.params.quizId })
      .sort({ score: -1, createdAt: -1 });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all results for one student — search by studentId (unique, not name)
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await QuizResult.find({ studentId })
      .populate("quizId", "title topic subject")
      .sort({ createdAt: -1 });

    const formattedResults = results.map((item) => {
      const score = item.score || 0;
      const totalQuestions = item.totalQuestions || 0;
      const percentage =
        totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

      return {
        _id: item._id,
        quizId: item.quizId?._id,
        quizTitle: item.quizId?.title || "Quiz",
        topic: item.quizId?.topic || "-",
        subject: item.quizId?.subject || "-",
        totalQuestions,
        correctAnswers: score,
        scorePercentage: percentage,
        submittedAt: item.submittedAt,
        createdAt: item.createdAt,
      };
    });

    res.status(200).json(formattedResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
