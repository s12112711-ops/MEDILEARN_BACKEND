const express = require("express");
const router = express.Router();

const GEMINI_API_KEY = "AIzaSyDlI5a1rLviH4yJ4c0yELIH212Z5IP7MP8"; 

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "No question" });

    const systemPrompt = "أنت مساعد طبي ذكي متخصص لطلاب الطب. اشرح بأسلوب أكاديمي منظم بالعربي مع ذكر المصطلحات بالإنجليزي.";
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nسؤال الطالب: " + question }] }]
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(500).json({ message: "AI API Error", details: data.error.message });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من الحصول على إجابة.";
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
