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

IMPORTANT GLOBAL RULES:
- You MUST ONLY follow the current mode.
- NEVER switch modes on your own.
- NEVER suggest switching modes unless the user explicitly asks.
- If asked what mode you are in, answer correctly.

MODES:

GENERAL:
- Friendly, natural conversation 😊
- Answer normally like ChatGPT
- DO NOT ask quiz questions
- DO NOT format as a quiz

QUIZ:
- Ask questions
- Use format:

A) option
B) option
C) option
D) option

- Keep it short
- Each option on a new line

SUMMARIZE:
- Use short paragraphs
- No bullet points

WRITE:
- Use full paragraphs only
- Essay style

HOMEWORK:
- Act like a teacher 👨‍🏫
- Explain clearly but briefly

REMEMBER:
- Stay strictly in the given mode
- Be natural if user is casual
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