const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");

let chats = {};
let currentChatId = null;
let controller = null;

// Create new chat
function createNewChat() {
  const id = Date.now().toString();

  chats[id] = {
    title: "New Chat",
    messages: []
  };

  currentChatId = id;
  renderChatList();
  renderChat();
}

// Render sidebar chat list
function renderChatList() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const div = document.createElement("div");
    div.textContent = chats[id].title;
    div.classList.add("chat-item");

    div.onclick = () => {
      currentChatId = id;
      renderChat();
    };

    // delete button
    const del = document.createElement("button");
    del.textContent = "X";
    del.onclick = (e) => {
      e.stopPropagation();
      delete chats[id];

      if (currentChatId === id) {
        currentChatId = Object.keys(chats)[0] || null;
      }

      renderChatList();
      renderChat();
    };

    div.appendChild(del);
    chatList.appendChild(div);
  });
}

// Render chat messages
function renderChat() {
  chatBox.innerHTML = "";

  if (!currentChatId) return;

  chats[currentChatId].messages.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("message", m.role);
    div.textContent = m.content;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add message
function addMessage(role, content) {
  chats[currentChatId].messages.push({ role, content });
  renderChat();
}

// Typing animation
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

// Thinking dots
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

// STOP button
function stopResponse() {
  if (controller) {
    controller.abort();
  }
}

// Send message
async function sendMessage() {
  const message = input.value;
  if (!message || !currentChatId) return;

  if (chats[currentChatId].messages.length === 0) {
    chats[currentChatId].title = message.slice(0, 20);
    renderChatList();
  }

  addMessage("user", message);
  input.value = "";

  chats[currentChatId].messages.push({
    role: "user",
    content: message
  });

  showThinking();

  controller = new AbortController();

  try {
    const response = await fetch("https://ai-chat-vxyv.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages: chats[currentChatId].messages
      })
    });

    const data = await response.json();

    removeThinking();

    chats[currentChatId].messages.push({
      role: "assistant",
      content: data.reply
    });

    typeText(data.reply);

    renderChatList();

  } catch (err) {
    removeThinking();
  }
}

// Events
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

newChatBtn.addEventListener("click", createNewChat);