console.log("SCRIPT RUNNING 🔥");

const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const chatForm = document.getElementById("chat-form");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

let chats = {};
let currentChatId = null;

/* =======================
   SIDEBAR TOGGLE
======================= */
function toggleSidebar(open) {
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
}

menuBtn?.addEventListener("click", () => {
  toggleSidebar(!sidebar.classList.contains("open"));
});

overlay?.addEventListener("click", () => {
  toggleSidebar(false);
});

/* =======================
   CREATE CHAT
======================= */
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

/* =======================
   RENDER CHAT LIST
======================= */
function renderChats() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";

    if (id === currentChatId) chatItem.classList.add("active");

    const title = document.createElement("span");
    title.textContent = chats[id].title;

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

    chatItem.onclick = () => {
      currentChatId = id;
      renderChats();
      renderMessages();
      toggleSidebar(false);
    };

    chatItem.appendChild(title);
    chatItem.appendChild(del);
    chatList.appendChild(chatItem);
  });
}

/* =======================
   RENDER MESSAGES
======================= */
function renderMessages() {
  chatBox.innerHTML = "";

  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + m.uiRole;
    div.innerHTML = marked.parse(m.content);
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =======================
   ADD MESSAGE
======================= */
function addMessage(role, content) {
  if (!currentChatId) return;

  chats[currentChatId].messages.push({
    role: role === "ai" ? "assistant" : role,
    uiRole: role,
    content
  });

  renderMessages();
}

/* =======================
   TYPEWRITER (FIXED)
======================= */
function typeText(element, text, speed = 15) {
  let i = 0;

  function step() {
    if (i <= text.length) {
      element.innerHTML = marked.parse(text.slice(0, i));
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(step, speed);
    }
  }

  step();
}

/* =======================
   SEND MESSAGE
======================= */
async function sendMessage() {
  const message = input.value.trim();
  if (!message || !currentChatId) return;

  const chat = chats[currentChatId];

  if (chat.messages.length === 0) {
    chat.title = message.slice(0, 20);
  }

  addMessage("user", message);
  input.value = "";

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.textContent = "Thinking...";
  chatBox.appendChild(loading);

  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chat.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    const data = await res.json();
    loading.remove();

    if (!data.reply) {
      addMessage("ai", "⚠️ Empty response");
      return;
    }

    const div = document.createElement("div");
    div.className = "message ai";
    chatBox.appendChild(div);

    typeText(div, data.reply);

    chat.messages.push({
      role: "assistant",
      uiRole: "ai",
      content: data.reply
    });

    renderChats();

  } catch (err) {
    console.error(err);
    loading.remove();
    addMessage("ai", "⚠️ Server not responding");
  }
}

/* =======================
   EVENTS
======================= */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

newChatBtn.onclick = createChat;

/* =======================
   INIT
======================= */
createChat();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("SW registered 🔥"))
      .catch(err => console.log("SW failed:", err));
  });
}