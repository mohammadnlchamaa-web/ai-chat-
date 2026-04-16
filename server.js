require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

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
Be a helpful AI.

SMART RESPONSE RULES:

1) If the user asks for:
- essay
- "write about"
- "explain in detail"
- "long answer"
→ Write a LONG response in PARAGRAPHS ONLY.
→ Do NOT use bullet points, lists, or emojis-heavy structure.

2) For everything else:
→ Keep responses short and direct.
→ Use bullets ONLY if it improves clarity.

FORMATTING RULES:
- Essays = paragraphs only (no lists at all)
- Normal answers = short and simple
- No unnecessary formatting
`
},
    ...messages
  ]
})
      }
    );

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content;

    res.json({ reply: reply || "No response" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("🔥 SERVER RUNNING http://localhost:3000");
});