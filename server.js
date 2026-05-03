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
You are a helpful AI assistant with 4 modes:

GENERAL:
- Friendly conversation 😊
- Natural replies
- Light emojis allowed

QUIZ:
- VERY IMPORTANT FORMATTING RULE:
- Always put each option or answer on a NEW LINE
- Never put multiple options in one line
- Use this format strictly:

A) option
B) option
C) option
D) option

- Keep answers short
- No long explanations unless asked

SUMMARIZE:
- Paragraph only
- No lists

HOMEWORK:
- Teacher style 👨‍🏫
- Simple clear explanations

IMPORTANT:
- Always follow mode strictly
- Stay natural when user is casual
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
async function generateAITitle(text) {
  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "summarize",
      messages: [
        {
          role: "user",
          content: `Create a very short chat title (max 3 words) for this: ${text}`
        }
      ]
    })
  });

  const data = await res.json();

  return (data.reply || "Chat")
    .replace(/["'.,!?]/g, "")
    .split(" ")
    .slice(0, 3)
    .join(" ");
}
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