const input = document.getElementById("user-input");
const button = document.getElementById("send-btn");
const chat = document.getElementById("chat-box");

let messages = [];

async function sendMessage() {
  const message = input.value;
  if (!message) return;

  // add user message to memory
  messages.push({
    role: "user",
    content: message
  });

  chat.innerHTML += `<div><b>You:</b> ${message}</div>`;
  input.value = "";

  const response = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();

  // save AI reply too
  messages.push({
    role: "assistant",
    content: data.reply
  });

  chat.innerHTML += `<div><b>AI:</b> ${data.reply}</div>`;
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});