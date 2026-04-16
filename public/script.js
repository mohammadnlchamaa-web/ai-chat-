console.log("SCRIPT RUNNING 🔥");

/* =======================
   STATE
======================= */
let chats = {};
let currentChatId = null;
let mode = "chat";
let user = localStorage.getItem("user");

/* =======================
   LOGIN
======================= */
if (!user) {
  user = prompt("Enter your name:");
  localStorage.setItem("user", user);
}

chats = JSON.parse(localStorage.getItem("chats_" + user)) || {};

/* =======================
   ELEMENTS
======================= */
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const chatList = document.getElementById("chat-list");
const homeScreen = document.getElementById("home-screen");
const homeInput = document.getElementById("home-input");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menu-btn");
const newChatBtn = document.getElementById("new-chat-btn");

/* =======================
   SIDEBAR
======================= */
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  overlay?.classList.toggle("show");
});

overlay?.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay?.classList.remove("show");
});

/* =======================
   MODE SYSTEM (FIXED)
======================= */
window.startMode = function (m) {
  mode = m;

  document.body.classList.remove("home");
  homeScreen?.classList.add("hidden");

  if (!currentChatId) {
    createChat(m);
  }

  focusInput();
};

/* =======================
   NEW CHAT
======================= */
newChatBtn?.addEventListener("click", () => {
  createChat("New Chat");
});

/* =======================
   CHAT SYSTEM
======================= */
function createChat(title = "New Chat") {
  const id = Date.now().toString();

  chats[id] = {
    title,
    messages: []
  };

  currentChatId = id;

  renderChats();
  renderMessages();
  save();

  generateTitle(id);
}

function getChat() {
  return chats[currentChatId];
}

/* =======================
   RENDER CHATS
======================= */
function renderChats() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const div = document.createElement("div");
    div.className = "chat-item";

    div.innerHTML = `
      <span>${chats[id].title}</span>
      <button class="del">✖</button>
    `;

    div.onclick = () => {
      currentChatId = id;
      renderMessages();
      focusInput();
    };

    div.querySelector(".del").onclick = (e) => {
      e.stopPropagation();
      delete chats[id];

      currentChatId = Object.keys(chats)[0] || null;

      renderChats();
      renderMessages();
      save();
    };

    chatList.appendChild(div);
  });
}

/* =======================
   RENDER MESSAGES
======================= */
function renderMessages() {
  chatBox.innerHTML = "";

  const chat = getChat();
  if (!chat) return;

  chat.messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + m.role;

    div.innerHTML = window.marked
      ? marked.parse(m.content)
      : m.content;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =======================
   TYPING EFFECT
======================= */
function typeText(el, text, speed = 8) {
  let i = 0;
  el.innerHTML = "";

  function step() {
    if (i > text.length) return;

    el.innerHTML = window.marked
      ? marked.parse(text.slice(0, i))
      : text.slice(0, i);

    i++;
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(step, speed);
  }

  step();
}

/* =======================
   THINKING DOTS
======================= */
function loadingDots() {
  const div = document.createElement("div");
  div.className = "message assistant";
  div.innerHTML = `
    <div class="dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatBox.appendChild(div);
  return div;
}

/* =======================
   SMART MODE DETECTION
======================= */
function detectMode(text) {
  const t = text.toLowerCase();

  if (t.includes("essay") || t.includes("write about")) return "essay";
  if (t.includes("summarize")) return "summarize";
  if (t.includes("quiz")) return "quiz";
  if (t.includes("homework")) return "homework";
  if (t.includes("write")) return "write";

  return "chat";
}

/* =======================
   SEND MESSAGE (FIXED CORE)
======================= */
async function sendMessage(text) {
  const msg = text || input.value.trim();
  if (!msg) return;

  if (!currentChatId) createChat(msg);

  const chat = getChat();

  mode = detectMode(msg);

  document.body.classList.remove("home");
  homeScreen?.classList.add("hidden");

  chat.messages.push({ role: "user", content: msg });
  renderMessages();

  input.value = "";

  const loading = loadingDots();

  const isEssay =
    mode === "essay";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `
Mode: ${mode}

RULES:
- If essay mode: ONLY paragraphs (NO bullet points EVER)
- If summarize: short bullets
- If quiz: questions + answers
- If write: structured writing
- If chat: normal conversation

Style:
- ${isEssay ? "Write long flowing paragraphs only." : "Be clear and helpful."}
- Use emojis when useful
            `
          },
          ...chat.messages
        ]
      })
    });

    const data = await res.json();
    loading.remove();

    const div = document.createElement("div");
    div.className = "message assistant";
    chatBox.appendChild(div);

    typeText(div, data.reply || "No response");

    chat.messages.push({
      role: "assistant",
      content: data.reply
    });

    renderChats();
    generateTitle(currentChatId);
    save();

  } catch (err) {
    console.error(err);
    loading.remove();
  }
}

/* =======================
   TITLE FIX (NO "no response")
======================= */
async function generateTitle(chatId) {
  const chat = chats[chatId];
  if (!chat || chat.messages.length < 2) return;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `
Give ONLY a short title (1–4 words).
No punctuation. No "response". No explanations.
`
          },
          ...chat.messages.slice(0, 6)
        ]
      })
    });

    const data = await res.json();

    let title = (data.reply || "Chat")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();

    if (!title || title.toLowerCase().includes("response")) {
      title = "Chat";
    }

    chat.title = title.split(" ").slice(0, 4).join(" ");

    renderChats();
    save();

  } catch {
    chat.title = "Chat";
  }
}

/* =======================
   HOME INPUT FIX
======================= */
homeInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const v = homeInput.value.trim();
    if (!v) return;

    sendMessage(v);
    homeInput.value = "";
  }
});

/* =======================
   FORM
======================= */
document.getElementById("chat-form").onsubmit = (e) => {
  e.preventDefault();
  sendMessage();
};

/* =======================
   FOCUS
======================= */
function focusInput() {
  setTimeout(() => input?.focus(), 50);
}

/* =======================
   SAVE
======================= */
function save() {
  localStorage.setItem("chats_" + user, JSON.stringify(chats));
}

/* =======================
   INIT
======================= */
createChat("Welcome");
renderChats();