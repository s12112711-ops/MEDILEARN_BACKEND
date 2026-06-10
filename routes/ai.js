const express = require("express");
const router = express.Router();

// ── Shared Gemini helper ──────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── /ask  (existing endpoint — unchanged) ────────────────────────────────────
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "No question" });

    const prompt =
      "أنت مساعد طبي ذكي متخصص لطلاب الطب. اشرح بأسلوب أكاديمي منظم بالعربي مع ذكر المصطلحات بالإنجليزي.\n\nسؤال الطالب: " +
      question;

    const answer = await callGemini(prompt);
    res.json({ answer: answer || "عذراً، لم أتمكن من الحصول على إجابة." });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── /analyze  (new endpoint — replaces FakeAIService in Flutter) ─────────────
router.post("/analyze", async (req, res) => {
  const { action, topic, content, bullets, clinicalNote } = req.body;

  if (!action || !topic) {
    return res.status(400).json({ message: "action and topic are required" });
  }

  let prompt = "";

  switch (action) {
    case "simplify":
      prompt =
        `You are a medical education assistant helping undergraduate medical students.\n` +
        `Simplify the following topic into 3–4 clear, plain-English sentences. Keep medical terms but briefly explain each one in parentheses.\n\n` +
        `Topic: ${topic}\nContent: ${content || topic}`;
      break;

    case "summarize": {
      const bulletList = Array.isArray(bullets)
        ? bullets.map((b) => `• ${b}`).join("\n")
        : "";
      prompt =
        `You are a medical professor creating a study summary for medical students.\n` +
        `Write a structured academic summary for the topic: "${topic}".\n` +
        `Key points provided:\n${bulletList}\nContext: ${content || ""}\n\n` +
        `Format your response with these three sections:\n` +
        `1. OVERVIEW\n2. KEY CONCEPTS\n3. CLINICAL RELEVANCE\n` +
        `Keep each section concise and exam-focused.`;
      break;
    }

    case "questions":
      prompt =
        `You are a medical exam question writer. Generate 5 high-yield exam questions for medical students studying: "${topic}".\n` +
        `Format each question as:\nQ1. [Question text]\nA) ... B) ... C) ... D) ...\nAnswer: [Letter] — [Brief explanation]\n\n` +
        `Focus on clinically relevant, commonly tested concepts.`;
      break;

    case "clinical_insight":
      prompt =
        `You are a clinical medicine professor. Provide a clinical insight for medical students about: "${topic}".\n` +
        `Clinical note provided: ${clinicalNote || topic}\n\n` +
        `Structure your response as:\n` +
        `1. WHY IT MATTERS CLINICALLY\n` +
        `2. COMMON PRESENTATIONS\n` +
        `3. KEY DIAGNOSTIC/MANAGEMENT POINTS\n` +
        `Keep it practical and focused on bedside application.`;
      break;

    default:
      return res.status(400).json({ message: "Invalid action. Use: simplify, summarize, questions, clinical_insight" });
  }

  try {
    const result = await callGemini(prompt);
    res.json({ result: result || "No response generated." });
  } catch (err) {
    res.status(500).json({ message: "AI API error", error: err.message });
  }
});

module.exports = router;
