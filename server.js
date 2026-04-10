const fetch = require("node-fetch"); // needed for Node <18
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// API ROUTE
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API ERROR:", text);
      return res.json({ reply: "⚠️ API error" });
    }

    const data = await response.json();

    res.json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ reply: "⚠️ Server error" });
  }
});

// fallback route (fixes "Cannot GET /")
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => console.log("SERVER RUNNING 🔥 http://localhost:3000"));