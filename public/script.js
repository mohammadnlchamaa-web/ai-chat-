console.log("SCRIPT LOADED 🔥");
alert("JS IS WORKING 🔥");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");

let messages = [];

// NEW CHAT
newChatBtn.onclick = () => {
  messages = [];
  chatBox.innerHTML = "";
};

// ADD MESSAGE
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.textContent = text;
  chatBox.appendChild(div);
}

// SEND
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  messages.push({ role: "user", content: message });

  input.value = "";

  const res = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ messages })
  });

  const data = await res.json();

  messages.push({ role: "assistant", content: data.reply });

  addMessage(data.reply, "ai");
}

// EVENTS
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});