// routes/ai.js
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config(); // ensure .env is loaded

const router = express.Router();

// Trim the OpenAI key to remove whitespace/newlines
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

// Debug log to confirm key is loaded
console.log("OPENAI_API_KEY loaded in aiRouter:", OPENAI_API_KEY ? "YES" : "NO");

// Initialize OpenAI safely
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "sk-test-fallback", // fallback so it doesn't crash
});

router.post("/ask", async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key is not set" });
  }

  try {
    const { question, history } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [...(history || []), { role: "user", content: question }],
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    console.error("AI request error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
