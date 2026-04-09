console.log("SCRIPT RUNNING 🔥");

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");

let chats = {};
let currentChatId = null;

// 🧠 CREATE NEW CHAT
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

// 🧾 RENDER SIDEBAR
function renderChats() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.textContent = chats[id].title;

    // click = open chat
    chatItem.onclick = () => {
      currentChatId = id;
      renderMessages();
    };

    // delete button
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

    chatItem.appendChild(del);
    chatList.appendChild(chatItem);
  });
}

// 💬 RENDER MESSAGES
function renderMessages() {
  chatBox.innerHTML = "";

  if (!currentChatId) return;

  chats[currentChatId].messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + m.role;
    div.textContent = m.content;
    chatBox.appendChild(div);
  });
}

// ➕ ADD MESSAGE
function addMessage(role, content) {
  chats[currentChatId].messages.push({ role, content });
  renderMessages();
}

// 🚀 SEND MESSAGE
async function sendMessage() {
  const message = input.value.trim();
  if (!message || !currentChatId) return;

  // first message becomes title
  if (chats[currentChatId].messages.length === 0) {
    chats[currentChatId].title = message.slice(0, 20);
  }

  addMessage("user", message);
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: chats[currentChatId].messages
    })
  });

  const data = await res.json();

  addMessage("ai", data.reply);
  renderChats();
}

// EVENTS
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

newChatBtn.onclick = createChat;

// 🚀 START WITH ONE CHAT
createChat();