const input = document.getElementById("user-input");
const button = document.getElementById("send-btn");
const chat = document.getElementById("chat-box");

let messages = [];

// Add message bubble
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Thinking dots
function showThinking() {
  const div = document.createElement("div");
  div.classList.add("message", "ai");
  div.id = "thinking";
  div.textContent = "Thinking...";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeThinking() {
  const el = document.getElementById("thinking");
  if (el) el.remove();
}

// Typing animation
function typeText(text) {
  const div = document.createElement("div");
  div.classList.add("message", "ai");
  chat.appendChild(div);

  let i = 0;
  function type() {
    if (i < text.length) {
      div.textContent += text.charAt(i);
      i++;
      setTimeout(type, 20);
    }
  }

  type();
  chat.scrollTop = chat.scrollHeight;
}

// Send message
async function sendMessage() {
  const message = input.value;
  if (!message) return;

  // user message
  addMessage(message, "user");

  messages.push({
    role: "user",
    content: message
  });

  input.value = "";

  showThinking();

  const response = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();

  removeThinking();

  // save AI reply
  messages.push({
    role: "assistant",
    content: data.reply
  });

  typeText(data.reply);
}

// Button click
button.addEventListener("click", sendMessage);

// Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});