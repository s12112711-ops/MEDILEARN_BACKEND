const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");


router.get("/all", async (req, res) => {
  try {
    const results = await QuizResult.find().sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (err) {
    console.error("Get all quiz results error:", err);
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

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
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
      result,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);

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
    console.error("Check quiz submission error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all results for one quiz (doctor side)
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;

    const results = await QuizResult.find({ quizId }).sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (err) {
    console.error("Get quiz results error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all results for one student (student progress screen)
router.get("/student/:studentName", async (req, res) => {
  try {
    const { studentName } = req.params;

    const results = await QuizResult.find({ studentName })
      .populate("quizId", "title topic subject")
      .sort({ createdAt: -1 });

    const formattedResults = results.map((item) => {
      const score = item.score || 0;
      const totalQuestions = item.totalQuestions || 0;
      const percentage =
        totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

      return {
        _id: item._id,
        studentName: item.studentName,
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
    console.error("Get student progress error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;