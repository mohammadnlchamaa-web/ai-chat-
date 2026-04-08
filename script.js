// Get elements from HTML
const input = document.getElementById("input");
const button = document.getElementById("send");
const chat = document.getElementById("chat");

// Send message function
async function sendMessage() {
  const message = input.value;
  if (!message) return;

  // Show user message
  chat.innerHTML += `<div><b>You:</b> ${message}</div>`;
  input.value = "";

  try {
    // Call backend (your server.js deployed URL)
    const response = await fetch("https://ai-chat-vxyv.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Show AI reply
    chat.innerHTML += `<div><b>AI:</b> ${data.reply}</div>`;
  } catch (error) {
    chat.innerHTML += `<div style="color:red;"><b>Error:</b> Server not responding</div>`;
  }
}

// Button click
button.addEventListener("click", sendMessage);

// Enter key support
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});