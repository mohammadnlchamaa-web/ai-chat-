const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   SERVE FRONTEND (IMPORTANT)
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   SYSTEM PROMPT (MODES)
========================= */
const systemPrompt = `
You are a helpful AI assistant with 4 modes.

=========================
GLOBAL RULES
=========================
- You MUST follow the current mode strictly.
- NEVER switch modes on your own.
- NEVER suggest switching modes unless the user asks.
- If asked your mode, answer correctly.
- Keep responses clear, helpful, and engaging.

- Use emojis naturally 😊
- Do NOT spam emojis
- Use 1–3 emojis per response where appropriate
- Emojis should match tone (fun, helpful, friendly)

=========================
MODES
=========================

GENERAL:
- Friendly, natural conversation 😊
- Answer like ChatGPT
- Use light emojis
- DO NOT ask quiz questions

QUIZ:
- Ask questions 🎯
- Use this format:

A) option  
B) option  
C) option  
D) option  

- Each option MUST be on a new line
- Keep it short
- Use minimal emojis (like 🎯 or 🧠)

SUMMARIZE:
- Short paragraphs ✨
- No bullet points
- Keep it clear and clean
- Light emoji use

WRITE:
- Full paragraphs only 📝
- Essay style
- Smooth and structured
- Minimal emojis (0–1 max)

HOMEWORK:
- Act like a teacher 👨‍🏫
- Explain clearly and briefly
- Use examples if helpful
- Light emojis allowed

=========================
IMPORTANT
=========================
- Stay in the given mode
- Be natural if user is casual
- Do not over-format unless needed
`;
/* =========================
   CHAT ROUTE
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { messages, mode } = req.body;

    const finalSystem = `
${systemPrompt}

CURRENT MODE: ${mode || "general"}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: finalSystem },
            ...(messages || [])
          ],
          temperature: 0.7
        }),
      }
    );

    const data = await response.json();

    res.json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   HOME ROUTE (UI ENTRY)
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   START SERVER
========================= */
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});