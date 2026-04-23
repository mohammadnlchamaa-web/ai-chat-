require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   FETCH (node-fetch v3 fix)
======================= */
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* =======================
   TITLE GENERATOR
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
              content: `
You generate chat titles.
Rules:
- Max 3 words
- No emojis
- No punctuation
- Return ONLY title
              `.trim(),
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "New Chat";
  } catch {
    return "New Chat";
  }
}

/* =======================
   CHAT ROUTE
======================= */
app.post("/chat", async (req, res) => {
  const { messages, mode } = req.body;

  /* =======================
     SYSTEM PROMPT BUILDER
  ======================= */
  let systemPrompt = `
You are an AI with STRICT MODES.

CURRENT MODE: ${mode}

GLOBAL RULES:
- Be helpful and natural
- Follow mode strictly for tasks
- Greetings are always casual
`;

  if (mode === "chat") {
    systemPrompt += `
CHAT MODE:
- Natural conversation
- Friendly tone
- Use emojis occasionally
`;
  }

  if (mode === "quiz") {
    systemPrompt += `
QUIZ MODE:
- Use bullet points or numbered questions
- Keep structured
- Use emojis occasionally
`;
  }

  if (mode === "write") {
    systemPrompt += `
WRITE MODE:
- Paragraphs only
- No bullet points
- Use emojis occasionally
`;
  }

  if (mode === "homework") {
    systemPrompt += `
HOMEWORK MODE:
- Simple explanations
- Short steps if needed
- Use emojis occasionally
`;
  }

  if (mode === "summarize") {
    systemPrompt += `
SUMMARIZE MODE:
- Very short summary
- Only key ideas
- Use emojis occasionally
`;
  }

  if (mode === "game") {
    systemPrompt += `
GAME MODE:
- Only generate game code if asked
- Otherwise normal chat
`;
  }

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    /* =======================
       AI RESPONSE
    ======================= */
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

    const aiReply =
      data.choices?.[0]?.message?.content?.trim() || "No response";

    /* =======================
       TITLE SYSTEM (EVERY 3 USER MSGS)
    ======================= */
   const userMsgs = messages.filter(m => m.role === "user");

let title = null;

// ALWAYS ensure a title exists
if (userMsgs.length === 1) {
  // first message → instant title
  title = await generateTitle(userMsgs[0].content);
} 
else if (userMsgs.length % 3 === 0) {
  // every 3 messages → update title
  const lastThree = userMsgs
    .slice(-3)
    .map(m => m.content)
    .join(" ");

  title = await generateTitle(lastThree);
}
app.post("/game", async (req, res) => {
  const { grade, topic, difficulty } = req.body;

  const prompt = `
You are an elite academic problem generator.

Generate a challenging problem based on:
- User grade
- Topic
- Difficulty

Rules:
- If difficulty = MIT Level → make it conceptually deep, multi-step, non-trivial
- Avoid basic textbook questions
- Focus on reasoning, not memorization
- Ask 1 clarification question IF topic is broad
- Keep it engaging like an interview problem

Output:
- Problem
- Optional hint (short)
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: prompt }]
    })
  });

  const data = await response.json();

  res.json({
    game: data.choices?.[0]?.message?.content || "No game generated"
  });
});
    /* =======================
       RESPONSE
    ======================= */
    return res.json({
      reply: aiReply,
      title: title || null,
      isGame: false,
    });
  } catch (err) {
    console.error(err);
    return res.json({
      reply: "❌ Server error",
      title: null,
      isGame: false,
    });
  }
});

/* =======================
   TEST ROUTE
======================= */
app.get("/test", (req, res) => {
  res.send("<h1 style='color:green'>🔥 SERVER WORKING</h1>");
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});