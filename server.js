require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   🤖 CHAT ROUTE (GROQ FIXED)
========================= */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!Array.isArray(messages)) {
      return res.json({ reply: "Invalid request format" });
    }

    const formatted = messages
      .filter(m => m && m.text && m.text.trim())
      .map(m => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text.trim()
      }));

    if (formatted.length === 0) {
      return res.json({ reply: "Say something 🙂" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          // ✅ FIXED MODEL (NO MORE 400 ERROR)
          model: "llama-3.1-8b-instant",

          messages: formatted,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    // If Groq returns an error, show it clearly
    if (!response.ok) {
      console.log("GROQ ERROR:", data);
      return res.json({
        reply: "Groq error: " + (data?.error?.message || "Unknown error")
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response from AI";

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "Server error: " + err.message });
  }
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});