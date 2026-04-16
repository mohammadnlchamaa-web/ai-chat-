console.log("SCRIPT RUNNING 🔥");

/* =======================
   ELEMENTS
======================= */
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");
const homeScreen = document.getElementById("home-screen");
const homeInput = document.getElementById("home-input");

/* =======================
   STATE
======================= */
let chats = {};
let currentChatId = null;
let titleUpdateTimeout = null;

/* =======================
   HOME INPUT (ENTER FIX)
======================= */
if (homeInput) {
  homeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const value = homeInput.value.trim();
      if (!value) return;

      input.value = value;
      homeInput.value = "";
      sendMessage();
    }
  });
}

/* =======================
   HELPERS
======================= */
function getCurrentChat() {
  return chats[currentChatId];
}

/* =======================
   INIT STATE
======================= */
document.body.classList.add("home");

/* =======================
   SIDEBAR TOGGLE
======================= */
function toggleSidebar(open) {
  sidebar?.classList.toggle("open", open);
  overlay?.classList.toggle("show", open);
}

menuBtn?.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    toggleSidebar(!sidebar.classList.contains("open"));
  }
});

overlay?.addEventListener("click", () => toggleSidebar(false));

/* =======================
   CREATE CHAT
======================= */
function createChat(initialMessage = "") {
  const id = Date.now().toString();

  chats[id] = {
    title: initialMessage ? initialMessage.slice(0, 20) : "New Chat",
    messages: []
  };

  currentChatId = id;

  renderChats();
  renderMessages();
}

/* =======================
   RENDER CHATS
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

      if (!Object.keys(chats).length) {
        currentChatId = null;
        chatBox.innerHTML = "";
        return;
      }

      if (currentChatId === id) {
        currentChatId = Object.keys(chats)[0];
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

  const chat = getCurrentChat();
  if (!chat) return;

  chat.messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + m.uiRole;

    div.innerHTML = window.marked
      ? marked.parse(m.content)
      : m.content;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =======================
   ADD MESSAGE
======================= */
function addMessage(role, content) {
  const chat = getCurrentChat();
  if (!chat) return;

  chat.messages.push({
    role: role === "ai" ? "assistant" : role,
    uiRole: role,
    content
  });

  renderMessages();
}

/* =======================
   TYPEWRITER
======================= */
function typeText(element, text, speed = 12) {
  let i = 0;

  function step() {
    if (i > text.length) return;

    element.innerHTML = window.marked
      ? marked.parse(text.slice(0, i))
      : text.slice(0, i);

    i++;
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(step, speed);
  }

  step();
}

/* =======================
   SEND MESSAGE
======================= */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  if (!currentChatId || !chats[currentChatId]) {
    createChat(message);
  }

  const chat = getCurrentChat();

  document.body.classList.remove("home");
  homeScreen?.classList.add("hidden");

  addMessage("user", message);
  input.value = "";

  triggerTitleUpdate();

  const loading = document.createElement("div");
  loading.className = "message ai";
  loading.innerHTML = `
    <div class="dots">
      <span></span><span></span><span></span>
    </div>
  `;
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
    triggerTitleUpdate();

  } catch (err) {
    console.error(err);
    loading.remove();
    addMessage("ai", "⚠️ Server not responding");
  }
}

/* =======================
   FORM EVENTS
======================= */
function bindChatForm() {
  const chatForm = document.getElementById("chat-form");
  if (!chatForm) return;

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });
}

/* =======================
   INIT
======================= */
window.addEventListener("DOMContentLoaded", () => {
  console.log("INIT READY 🔥");
  createChat();
  bindChatForm();
});

/* =======================
   AI TITLE SYSTEM (FIXED)
======================= */
async function generateAITitle(chat) {
  try {
    const messages = chat.messages.slice(0, 8);

    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `
Generate a concise chat title (max 3 words).

Strict rules:
- 1 to 3 words only
- No punctuation
- No emojis
- No filler words
- Focus on main topic only

Examples:
"Fix CSS Layout"
"AI Chat App"
"Math Homework Help"
`
          },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          {
            role: "user",
            content: "Generate a short title for this conversation."
          }
        ]
      })
    });

    const data = await res.json();
    return data.reply?.trim() || "New Chat";

  } catch (err) {
    console.error("Title generation failed:", err);
    return "New Chat";
  }
}

/* =======================
   TITLE UPDATER (FIXED)
======================= */
function triggerTitleUpdate() {
  const chat = getCurrentChat();
  if (!chat) return;

  clearTimeout(titleUpdateTimeout);

  titleUpdateTimeout = setTimeout(async () => {
    const newTitle = await generateAITitle(chat);
    chat.title = newTitle;
    renderChats();
  }, 1200);
}