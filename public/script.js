let chats = [];
let currentChatId = null;
let mode = "";
let messageCount = 0;

/* =========================
   LOAD STORAGE
========================= */
try {
  const stored = JSON.parse(localStorage.getItem("chats"));
  if (Array.isArray(stored)) chats = stored;
} catch {}

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const homeInput = document.getElementById("home-input");
const chatList = document.getElementById("chat-list");

/* =========================
   SAVE
========================= */
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/* =========================
   MILESTONE TITLE TRIGGERS
========================= */
function shouldUpdateTitle(n) {
  return [1, 3, 6, 9, 12, 15, 18].includes(n);
}

/* =========================
   AI TITLE GENERATOR
========================= */
async function updateAITitle(text) {
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "summarize",
        messages: [
          {
            role: "user",
            content: `Create a very short chat title (max 3 words, no punctuation): ${text}`
          }
        ]
      })
    });

    const data = await res.json();

    chat.title = (data.reply || "Chat")
      .replace(/["'.,!?]/g, "")
      .split(" ")
      .slice(0, 3)
      .join(" ");

    saveChats();
    renderSidebar();

  } catch {}
}

/* =========================
   CREATE CHAT
========================= */
function createNewChat(firstMessage = null) {
  const chat = {
    id: Date.now(),
    title: "New Chat",
    messages: []
  };

  chats.unshift(chat);
  currentChatId = chat.id;
  messageCount = 0;

  saveChats();
  renderSidebar();
  loadChat(chat.id);

  document.querySelector(".app").classList.add("chat-mode");

  if (firstMessage) sendMessage(firstMessage);
}

/* =========================
   SIDEBAR
========================= */
function renderSidebar() {
  chatList.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "chat-item";

    const title = document.createElement("span");
    title.innerText = chat.title;

    const del = document.createElement("button");
    del.innerText = "×";
    del.className = "delete-btn";

    del.onclick = (e) => {
      e.stopPropagation();

      chats = chats.filter(c => c.id !== chat.id);
      saveChats();

      if (currentChatId === chat.id) currentChatId = null;

      if (chats.length === 0) {
        createNewChat();
      } else {
        currentChatId = chats[0].id;
        loadChat(currentChatId);
      }

      renderSidebar();
    };

    item.appendChild(title);
    item.appendChild(del);

    if (chat.id === currentChatId) {
      item.classList.add("active");
    }

    item.onclick = () => {
      currentChatId = chat.id;
      loadChat(chat.id);
      renderSidebar();
    };

    chatList.appendChild(item);
  });
}

/* =========================
   LOAD CHAT
========================= */
function loadChat(id) {
  const chat = chats.find(c => c.id === id);
  if (!chat) return;

  chatBox.innerHTML = "";

  chat.messages.forEach(m => {
    addMessage(m.role, m.text);
  });
}

/* =========================
   ADD MESSAGE
========================= */
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.innerText = text;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =========================
   SAVE MESSAGE
========================= */
function saveMessage(role, text) {
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  chat.messages.push({ role, text });
  saveChats();
}

/* =========================
   TYPEWRITER
========================= */
function typeText(element, text) {
  let i = 0;
  element.textContent = "";

  let speed = 18;
  if (mode === "write" && text.length > 200) speed = 5;

  function type() {
    if (i < text.length) {
      const char = text[i];
      element.textContent += char === " " ? "\u00A0" : char;
      i++;
      setTimeout(type, speed);
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  type();
}

/* =========================
   AI CHAT
========================= */
async function sendToAI(text) {
  addMessage("ai", "Thinking... 🤖");

  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        messages: chat.messages.map(m => ({
          role: m.role === "ai" ? "assistant" : m.role,
          content: m.text
        }))
      })
    });

    const data = await res.json();

    if (chatBox.lastChild) chatBox.lastChild.remove();

    const aiMsg = document.createElement("div");
    aiMsg.className = "msg ai";
    chatBox.appendChild(aiMsg);

    typeText(aiMsg, data.reply || "No response");

    setTimeout(() => {
      saveMessage("ai", data.reply);
    }, 300);

  } catch (err) {
    console.error(err);
    if (chatBox.lastChild) chatBox.lastChild.remove();
    addMessage("ai", "❌ Server error");
  }
}

/* =========================
   SEND MESSAGE
========================= */
function sendMessage(text) {
  if (!text.trim()) return;

  if (!currentChatId) {
    createNewChat(text);
    return;
  }

  addMessage("user", text);
  saveMessage("user", text);

  messageCount++;

  // 🔥 ONLY UPDATE TITLE ON MILESTONES
  if (shouldUpdateTitle(messageCount)) {
    updateAITitle(text);
  }

  sendToAI(text);
}

/* =========================
   HOME SEND
========================= */
document.getElementById("home-send").onclick = () => {
  const text = homeInput.value.trim();
  if (!text) return;

  homeInput.value = "";
  createNewChat(text);
};

/* =========================
   ENTER KEYS
========================= */
homeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const text = homeInput.value.trim();
    if (!text) return;

    homeInput.value = "";
    createNewChat(text);
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    sendMessage(text);
  }
});

/* =========================
   CHAT FORM
========================= */
document.getElementById("chat-form").onsubmit = (e) => {
  e.preventDefault();
  sendMessage(input.value);
  input.value = "";
};

/* =========================
   MODE BUTTONS
========================= */
document.getElementById("new-chat-btn").onclick = () => createNewChat();

document.getElementById("btn-quiz").onclick = () => { mode = "quiz"; createNewChat(); };
document.getElementById("btn-homework").onclick = () => { mode = "homework"; createNewChat(); };
document.getElementById("btn-write").onclick = () => { mode = "write"; createNewChat(); };
document.getElementById("btn-summarize").onclick = () => { mode = "summarize"; createNewChat(); };

/* =========================
   INIT
========================= */
if (chats.length > 0) {
  currentChatId = chats[0].id;
  renderSidebar();
  loadChat(currentChatId);
}