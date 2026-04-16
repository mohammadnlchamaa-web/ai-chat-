require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* =========================
   SAFETY CHECK
========================= */
if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env");
}

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   GROQ CHAT ROUTE
========================= */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages format"
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY"
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content: `
You are a helpful AI assistant.

Formatting rules:
- You can use bullet points
- You can use numbered lists
- You can use emojis when helpful
- Keep responses clean and readable
- Use markdown formatting properly
You can format responses using markdown:
- Use headings (#, ##, ###) when helpful
- Use bullet points and numbered lists
- Use emojis to improve clarity
- Structure answers clearly
      `
    },
    ...messages
  ]
}),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("❌ GROQ ERROR:", data);
      return res.status(500).json({
        error: "Groq API failed",
        details: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "Empty model response"
      });
    }

    return res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    const isTimeout = err.name === "AbortError";

    return res.status(500).json({
      error: isTimeout ? "Request timeout" : "Server error"
    });
  }
});

/* =========================
   HEALTH CHECK (NEW)
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});

/* =========================
   CATCH-ALL (FIXED ORDER SAFETY)
========================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING 🔥 http://localhost:${PORT}`);
});