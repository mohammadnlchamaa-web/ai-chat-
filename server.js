require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   🤖 CHAT ROUTE (GROQ AI)
========================= */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        reply: "Invalid request format"
      });
    }

    // Format messages for Groq
    const formatted = messages
      .filter(m => m?.text?.trim())
      .map(m => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text.trim()
      }));

    if (formatted.length === 0) {
      return res.json({ reply: "Say something 🙂" });
    }

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: formatted,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("GROQ ERROR:", data);
      return res.json({
        reply: data?.error?.message || "Groq API error"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response from AI";

    res.json({ reply });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({
      reply: "Server error: " + err.message
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});