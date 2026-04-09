const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
let chats = [];
let currentChat = [];
let messages = [];
let controller;

// add message
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// thinking dots
function showThinking() {
  const div = document.createElement("div");
  div.classList.add("message", "ai");
  div.id = "thinking";
  div.textContent = "Thinking...";
  chatBox.appendChild(div);
}

function removeThinking() {
  const el = document.getElementById("thinking");
  if (el) el.remove();
}

// typing effect
function typeText(text) {
  const div = document.createElement("div");
  div.classList.add("message", "ai");
  chatBox.appendChild(div);

  let i = 0;

  function type() {
    if (i < text.length) {
      div.textContent += text[i];
      i++;
      setTimeout(type, 15);
    }
  }

  type();
}

// send message
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");

 messages.push({ role: "user", content: message });
currentChat.push({ role: "user", content: message });

  input.value = "";

  showThinking();

  controller = new AbortController();

  try {
    const res = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ messages })
    });

    const data = await res.json();

    removeThinking();

    messages.push({ role: "assistant", content: data.reply });
currentChat.push({ role: "assistant", content: data.reply });
    typeText(data.reply);

  } catch (err) {
    removeThinking();
  }
}

sendBtn.addEventListener("click", sendMessage);
document.getElementById("new-chat-btn").addEventListener("click", newChat);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
function newChat() {
  if (currentChat.length > 0) {
    chats.push(currentChat);
  }

  currentChat = [];
  messages = [];
  chatBox.innerHTML = "";
}