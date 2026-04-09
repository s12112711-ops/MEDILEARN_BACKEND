const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

// Create mixed-difficulty quiz from question bank
router.post("/", async (req, res) => {
  try {
    const {
      title,
      subject,
      topic,
      description,
      easyCount,
      mediumCount,
      hardCount,
      durationMinutes,
      createdBy,
      createdByName,
      isPublished,
    } = req.body;

    if (!title || !subject || !topic) {
      return res.status(400).json({
        message: "Title, subject, and topic are required",
      });
    }

    const easy = Number(easyCount || 0);
    const medium = Number(mediumCount || 0);
    const hard = Number(hardCount || 0);

    const totalQuestions = easy + medium + hard;

    if (totalQuestions <= 0) {
      return res.status(400).json({
        message: "You must choose at least one question",
      });
    }

    const baseFilter = {
      subject: subject.trim(),
      topic: topic.trim(),
    };

    const easyPool =
      easy > 0
        ? await Question.find({ ...baseFilter, difficulty: "easy" })
        : [];

    const mediumPool =
      medium > 0
        ? await Question.find({ ...baseFilter, difficulty: "medium" })
        : [];

    const hardPool =
      hard > 0
        ? await Question.find({ ...baseFilter, difficulty: "hard" })
        : [];

    if (easyPool.length < easy) {
      return res.status(400).json({
        message: `Not enough easy questions in ${subject} / ${topic}. Available: ${easyPool.length}`,
      });
    }

    if (mediumPool.length < medium) {
      return res.status(400).json({
        message: `Not enough medium questions in ${subject} / ${topic}. Available: ${mediumPool.length}`,
      });
    }

    if (hardPool.length < hard) {
      return res.status(400).json({
        message: `Not enough hard questions in ${subject} / ${topic}. Available: ${hardPool.length}`,
      });
    }

    const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

    const selectedEasy = shuffle(easyPool).slice(0, easy);
    const selectedMedium = shuffle(mediumPool).slice(0, medium);
    const selectedHard = shuffle(hardPool).slice(0, hard);

    const selectedQuestions = shuffle([
      ...selectedEasy,
      ...selectedMedium,
      ...selectedHard,
    ]);

    const newQuiz = new Quiz({
      title: title.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      description: description?.trim() || "",
      questions: selectedQuestions.map((q) => q._id),
      createdBy: createdBy || null,
      createdByName: createdByName?.trim() || "",
      durationMinutes: durationMinutes ? Number(durationMinutes) : 10,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await newQuiz.save();

    res.status(201).json({
      message: "Quiz created successfully",
      quiz: newQuiz,
      selectedQuestions,
      counts: {
        easy,
        medium,
        hard,
        total: totalQuestions,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all quizzes
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("questions")
      .sort({ createdAt: -1 });

    res.status(200).json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one quiz by id
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("questions");

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update quiz
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      subject,
      topic,
      description,
      questions,
      createdBy,
      createdByName,
      durationMinutes,
      isPublished,
    } = req.body;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(topic !== undefined && { topic: topic.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(questions !== undefined && { questions }),
        ...(createdBy !== undefined && { createdBy: createdBy || null }),
        ...(createdByName !== undefined && {
          createdByName: createdByName.trim(),
        }),
        ...(durationMinutes !== undefined && {
          durationMinutes: Number(durationMinutes),
        }),
        ...(isPublished !== undefined && { isPublished }),
      },
      { new: true, runValidators: true }
    ).populate("questions");

    if (!updatedQuiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete quiz
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!deletedQuiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;