const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");

let messages = [];
let controller;

// ✅ NEW CHAT (WORKS)
newChatBtn.addEventListener("click", () => {
  messages = [];
  chatBox.innerHTML = "";

  // optional welcome message
  addMessage("New chat started 🚀", "ai");
});

// add message
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// typing animation
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

// thinking dots
function showThinking() {
  const div = document.createElement("div");
  div.classList.add("message", "ai");
  div.id = "thinking";
  div.innerHTML = `<div class="dots"><span></span><span></span><span></span></div>`;
  chatBox.appendChild(div);
}

function removeThinking() {
  const el = document.getElementById("thinking");
  if (el) el.remove();
}

// send message
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  messages.push({ role: "user", content: message });

  input.value = "";

  showThinking();

  try {
    const res = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();

    removeThinking();

    messages.push({ role: "assistant", content: data.reply });

    typeText(data.reply);

  } catch (err) {
    removeThinking();
    addMessage("Error connecting to server", "ai");
  }
}

// events
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});