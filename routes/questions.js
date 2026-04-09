const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// Create question
router.post("/", async (req, res) => {
  try {
    console.log("Incoming question body:", req.body);

    const {
      questionText,
      options,
      correctAnswer,
      explanation,
      subject,
      topic,
      difficulty,
      createdBy,
    } = req.body;

    if (
      !questionText ||
      !options ||
      !Array.isArray(options) ||
      options.length < 2 ||
      !correctAnswer
    ) {
      return res.status(400).json({
        message: "Question text, options array, and correct answer are required",
      });
    }

    const normalizedDifficulty = difficulty
      ? difficulty.toString().trim().toLowerCase()
      : "medium";

    const newQuestion = new Question({
      questionText: questionText.trim(),
      options: options.map((option) => option.trim()),
      correctAnswer: correctAnswer.trim(),
      explanation: explanation?.trim() || "",
      subject: subject?.trim() || "",
      topic: topic?.trim() || "",
      difficulty: normalizedDifficulty,
      createdBy: createdBy || null,
    });

    await newQuestion.save();

    res.status(201).json({
      message: "Question added successfully",
      question: newQuestion,
    });
  } catch (err) {
    console.error("Create question error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all questions
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    console.error("Get questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get one question by id
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.status(200).json(question);
  } catch (err) {
    console.error("Get question by id error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update question
router.put("/:id", async (req, res) => {
  try {
    const {
      questionText,
      options,
      correctAnswer,
      explanation,
      subject,
      topic,
      difficulty,
      createdBy,
    } = req.body;

    const updateData = {
      ...(questionText !== undefined && { questionText: questionText.trim() }),
      ...(options !== undefined && {
        options: options.map((option) => option.trim()),
      }),
      ...(correctAnswer !== undefined && {
        correctAnswer: correctAnswer.trim(),
      }),
      ...(explanation !== undefined && { explanation: explanation.trim() }),
      ...(subject !== undefined && { subject: subject.trim() }),
      ...(topic !== undefined && { topic: topic.trim() }),
      ...(difficulty !== undefined && {
        difficulty: difficulty.toString().trim().toLowerCase(),
      }),
      ...(createdBy !== undefined && { createdBy: createdBy || null }),
    };

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete question
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);

    if (!deletedQuestion) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;