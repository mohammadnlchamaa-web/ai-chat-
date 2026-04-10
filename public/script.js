console.log("SCRIPT RUNNING 🔥");

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const chatForm = document.getElementById("chat-form");

let chats = {};
let currentChatId = null;

// CREATE CHAT
function createChat() {
  const id = Date.now().toString();

  chats[id] = {
    title: "New Chat",
    messages: []
  };

  currentChatId = id;
  renderChats();
  renderMessages();
}

// RENDER SIDEBAR
function renderChats() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";

    const title = document.createElement("span");
    title.textContent = chats[id].title;

    if (id === currentChatId) {
      chatItem.classList.add("active");
    }

    chatItem.onclick = () => {
      currentChatId = id;
      renderMessages();
      renderChats();
    };

    const del = document.createElement("button");
    del.textContent = "✖";

    del.onclick = (e) => {
      e.stopPropagation();
      delete chats[id];

      if (currentChatId === id) {
        currentChatId = Object.keys(chats)[0] || null;
      }

      renderChats();
      renderMessages();
    };

    chatItem.appendChild(title);
    chatItem.appendChild(del);
    chatList.appendChild(chatItem);
  });
}

// RENDER MESSAGES
function renderMessages() {
  chatBox.innerHTML = "";

  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages.forEach(m => {
    const div = document.createElement("div");

    // UI class stays "ai" for styling BUT API uses "assistant"
    div.className = "message " + (m.uiRole || m.role);

    div.textContent = m.content;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ADD MESSAGE (FIXED)
function addMessage(role, content) {
  if (!currentChatId || !chats[currentChatId]) return;

  const apiRole = role === "ai" ? "assistant" : role;

  chats[currentChatId].messages.push({
    role: apiRole,     // 👈 THIS GOES TO API
    uiRole: role,      // 👈 THIS IS FOR YOUR CSS
    content
  });

  renderMessages();
}

// SEND MESSAGE
async function sendMessage() {
  const message = input.value.trim();
  if (!message || !currentChatId) return;

  if (chats[currentChatId].messages.length === 0) {
    chats[currentChatId].title = message.slice(0, 20);
  }

  addMessage("user", message);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chats[currentChatId].messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    const data = await res.json();

    addMessage("ai", data.reply || "⚠️ No response");

  } catch (err) {
    console.error(err);
    addMessage("ai", "⚠️ Server not responding");
  }

  renderChats();
}

// EVENTS
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

sendBtn.onclick = sendMessage;
newChatBtn.onclick = createChat;

// START
createChat();