require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   FETCH (NODE COMPAT)
======================= */
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* =======================
   SIMPLE TITLE GENERATOR
======================= */
async function generateTitle(message) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
               "Create a chat title (MAX 3 words only). No punctuation. No emojis.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content?.trim() || "New Chat"
    );
  } catch {
    return "New Chat";
  }
}

/* =======================
   CHAT ROUTE
======================= */
app.post("/chat", async (req, res) => {
  const { messages, mode } = req.body;

  let systemPrompt = `
You are a helpful AI assistant.
- Use bullet points when needed
- Use emojis sometimes 😊🔥📌
- Keep answers clear and structured
`;

  if (mode === "quiz") {
    systemPrompt = `
You are in QUIZ MODE 🧠
- Create MCQs
- Use bullet points
- Use emojis sometimes
`;
  }

  if (mode === "homework") {
    systemPrompt = `
You are in HOMEWORK MODE 📘
- Explain step by step
- Use bullet points
- Use emojis sometimes
`;
  }

  if (mode === "write") {
    systemPrompt = `
You are in WRITING MODE ✍️
- Write clearly and creatively
- Use paragraphs unless listing ideas
- Use emojis sometimes
`;
  }

  if (mode === "summarize") {
    systemPrompt = `
You are in SUMMARIZE MODE 📌
- Always use bullet points
- Be short and clear
- Use emojis sometimes
`;
  }

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
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
          messages: finalMessages,
        }),
      }
    );

    const data = await response.json();

    if (!data.choices) {
      return res.json({
        reply: "❌ AI error (no response)",
        title: null,
      });
    }

    const aiReply =
      data.choices[0].message.content || "No response";

    /* =======================
       SAFE TITLE LOGIC
       (ONLY FIRST MESSAGE)
    ======================= */

    let title = null;

    const userMessages = messages.filter(
      (m) => m.role === "user"
    );

    if (userMessages.length === 1) {
      const context = userMessages[0].content;
      title = await generateTitle(context);
    }

    return res.json({
      reply: aiReply,
      title,
    });
  } catch (err) {
    console.error(err);
    return res.json({
      reply: "Server error",
      title: null,
    });
  }
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running → http://localhost:${PORT}`);
});