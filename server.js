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
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   CHAT ROUTE
========================= */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages format"
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
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Non-JSON response from Groq:", text);
      return res.status(500).json({
        error: "Invalid API response"
      });
    }

    if (!response.ok) {
      console.error("❌ GROQ ERROR:", data);
      return res.status(500).json({
        error: "Groq API failed",
        details: data
      });
    }

    return res.json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: err.name === "AbortError"
        ? "Request timeout"
        : "Server error"
    });
  }
});

/* =========================
   PWA FALLBACK
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