require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   CHAT ROUTE
========================= */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    // validation (IMPORTANT)
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages format"
      });
    }

    // timeout controller
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

    if (!response.ok) {
  const text = await response.text();
  console.error("❌ GROQ API ERROR:", text);

  return res.status(500).json({
    error: "Groq API failed",
    details: text
  });
}

    const data = await response.json();

    return res.json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

/* =========================
   FALLBACK ROUTE
========================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () =>
  console.log("SERVER RUNNING 🔥 http://localhost:3000")
);