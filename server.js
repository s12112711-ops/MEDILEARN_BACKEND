const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const announcementRoutes = require("./routes/announcements");
const materialRoutes = require("./routes/materials");
const questionRoutes = require("./routes/questions");
const quizRoutes = require("./routes/quizzes");
const quizResultRoutes = require("./routes/quizResults");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notificationRoutes");
const app = express();
const aiReportRoutes = require("./routes/aiReportRoutes");
const doctorEvaluationRoutes = require("./routes/doctorEvaluationRoutes");
const doctorProfileRoutes = require("./routes/doctorProfiles");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/quiz-results", quizResultRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/leaderboard", require("./routes/leaderboard"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/ai", aiReportRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/doctor-evaluations", doctorEvaluationRoutes);

app.use("/api/doctor-profiles", doctorProfileRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

  