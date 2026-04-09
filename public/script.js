const input = document.getElementById("user-input");
const button = document.getElementById("send-btn");
const chat = document.getElementById("chat-box");
function typeText(element, text, speed = 20) {
  let i = 0;
  element.innerHTML = "";

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `
    <div class="msg user">
      <div class="bubble">${message}</div>
    </div>
  `;

  input.value = "";

  // 🔵 SHOW TYPING DOTS
  const typingId = "typing-" + Date.now();

  chat.innerHTML += `
    <div class="msg ai" id="${typingId}">
      <div class="bubble">
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // remove dots
    document.getElementById(typingId).remove();

    // create AI message bubble
    chat.innerHTML += `
      <div class="msg ai">
        <div class="bubble" id="ai-${Date.now()}"></div>
      </div>
    `;

    const lastBubble = chat.querySelector(".msg.ai:last-child .bubble");

    // ✨ TYPE LETTER BY LETTER
    typeText(lastBubble, data.reply);

    chat.scrollTop = chat.scrollHeight;

  } catch (error) {
    document.getElementById(typingId).remove();

    chat.innerHTML += `
      <div class="msg ai">
        <div class="bubble" style="color:red;">
          Server not responding
        </div>
      </div>
    `;
  }
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});