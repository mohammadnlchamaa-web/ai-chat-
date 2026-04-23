console.log("RUNNING FIXED VERSION 🚀");

/* =======================
   STATE
======================= */
let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = null;
let mode = "chat";

/* =======================
   ELEMENTS
======================= */
const home = document.getElementById("home-screen");
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const homeInput = document.getElementById("home-input");
const chatList = document.getElementById("chat-list");
const form = document.getElementById("chat-form");
const sendBtn = document.getElementById("send-btn");
const gameMenu = document.getElementById("game-menu");

/* =======================
   SAVE
======================= */
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}
let selectedGame = null;

function selectGame(type) {
  selectedGame = type;

  const setup = document.getElementById("game-setup");

  setup.style.display = "block";

  setup.innerHTML = `
    <div style="padding:25px; max-width:600px;">
      <h2>🎓 Academic Configuration</h2>
      <p style="opacity:0.7">
        To generate a high-level learning challenge, please specify your academic context.
      </p>

      <label>Current Academic Level</label>
      <input id="game-grade" placeholder="e.g. Grade 10, IB HL, AP, University" />

      <label>Topic Focus</label>
      <input id="game-topic" placeholder="e.g. Derivatives, Photosynthesis, Recursion" />

      <label>Difficulty Level</label>
      <select id="game-difficulty">
        <option>Standard</option>
        <option>Advanced</option>
        <option>Olympiad</option>
        <option>MIT Level</option>
      </select>

      <button onclick="submitGameAnswer()" style="margin-top:15px">
        Generate Challenge →
      </button>
    </div>
  `;
}
function submitGameAnswer() {
  const grade = document.getElementById("game-grade").value.trim();
  const topic = document.getElementById("game-topic").value.trim();
  const difficulty = document.getElementById("game-difficulty").value;

  if (!grade || !topic) {
    alert("Please provide both academic level and topic.");
    return;
  }

  generateGame({
    game: selectedGame,
    grade,
    topic,
    difficulty
  });
}
function generateGame(profile) {
  const gameBox = document.getElementById("game-menu");

  gameBox.innerHTML = `
    <div style="padding:25px">
      <h2>⚡ Constructing Challenge...</h2>
      <p style="opacity:0.7">
        Building a ${profile.difficulty} level problem set in ${profile.topic}.
      </p>
    </div>
  `;

  fetch("http://localhost:3000/game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(profile)
  })
  .then(res => res.json())
  .then(data => {
    gameBox.innerHTML = `
      <div style="padding:25px">
        <h2>🧠 ${profile.difficulty} Challenge</h2>

        <div style="margin-bottom:10px; opacity:0.6">
          ${profile.grade} • ${profile.topic}
        </div>

        <pre style="white-space:pre-wrap; font-size:15px;">
${data.game}
        </pre>

        <button onclick="location.reload()" style="margin-top:15px">
          🔁 New Challenge
        </button>
      </div>
    `;
  });
}
/* =======================
   TITLE CLEAN
======================= */
function normalizeTitle(text = "") {
  return text
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");
}

/* =======================
   SCREEN
======================= */
const sidebar = document.querySelector(".sidebar");

function showScreen(screen) {
  home.style.display = "none";
  chatBox.style.display = "none";
  gameMenu.style.display = "none";

  // ⭐ CONTROL SIDEBAR
  sidebar.style.display = "none";

  if (screen === "home") {
    home.style.display = "flex";
    sidebar.style.display = "none"; // hide sidebar
  }

  if (screen === "chat") {
    chatBox.style.display = "block";
    sidebar.style.display = "block"; // show sidebar
  }

  if (screen === "game") {
    gameMenu.style.display = "block";
    sidebar.style.display = "none"; // optional
  }
}
/* =======================
   CREATE CHAT
======================= */
function createChat(title = "New Chat", m = "chat") {
  const id = Date.now().toString();

  chats[id] = {
    title: normalizeTitle(title) || "New Chat",
    messages: [],
    mode: m
  };

  currentChatId = id;
  mode = m;

  save();
  renderChats();
  renderMessages();
  showScreen("chat");
}

/* =======================
   OPEN CHAT
======================= */
function openChat(id) {
  currentChatId = id;
  mode = chats[id].mode;

  renderChats();
  renderMessages();
  showScreen("chat");
}

/* =======================
   DELETE CHAT (FINAL FIX)
======================= */
function deleteChat(id) {
  delete chats[id];

  const keys = Object.keys(chats);

  if (currentChatId === id) {
    currentChatId = keys.length ? keys[0] : null;
  }

  save();
  renderChats();

  if (!currentChatId) {
    showScreen("home");
    chatBox.innerHTML = "";
  } else {
    renderMessages();
  }
}

/* =======================
   RENDER CHATS (UPDATED)
======================= */
function renderChats() {
  chatList.innerHTML = "";

  Object.entries(chats).forEach(([id, chat]) => {
    const div = document.createElement("div");
    div.className = "chat-item";

    if (id === currentChatId) div.classList.add("active");

    const title = document.createElement("span");
    title.textContent = chat.title;

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.className = "delete-btn";
    del.dataset.id = id;

    div.appendChild(title);
    div.appendChild(del);
    chatList.appendChild(div);

    div.addEventListener("click", () => openChat(id));
  });
}

/* =======================
   🔥 GLOBAL DELETE HANDLER (KEY FIX)
======================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");

  if (btn) {
    e.stopPropagation();

    const id = btn.dataset.id;
    console.log("DELETE CLICKED:", id);

    deleteChat(id);
  }
});

/* =======================
   MESSAGES
======================= */
function renderMessages() {
  chatBox.innerHTML = "";

  const chat = chats[currentChatId];
  if (!chat) return;

  chat.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message " + m.role;

    const inner = document.createElement("div");
    inner.textContent = m.content;
    inner.style.whiteSpace = "pre-wrap";

    row.appendChild(inner);
    chatBox.appendChild(row);
  });

  scrollBottom();
}

/* =======================
   SCROLL
======================= */
function scrollBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =======================
   TYPEWRITER
======================= */
function typeText(element, text, speed = 10) {
  element.innerHTML = "";
  let i = 0;

  function type() {
    if (i < text.length) {
      element.innerHTML += text[i] === "\n" ? "<br>" : text[i];
      i++;
      scrollBottom();
      setTimeout(type, speed);
    }
  }

  type();
}

/* =======================
   SEND MESSAGE
======================= */
async function sendMessage(text) {
  const msg = (text || input.value).trim();
  if (!msg) return;

  if (!currentChatId || !chats[currentChatId]) {
    createChat(msg);
    return;
  }

  const chat = chats[currentChatId];

  chat.messages.push({ role: "user", content: msg });
  input.value = "";

  renderMessages();

  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, messages: chat.messages })
  });

  const data = await res.json().catch(() => null);
  if (!data) return;

  const reply = data.reply || "No response";

  chat.messages.push({ role: "assistant", content: reply });

  const row = document.createElement("div");
  row.className = "message assistant";

  const inner = document.createElement("div");
  row.appendChild(inner);
  chatBox.appendChild(row);

  typeText(inner, reply);

  if (data.title) {
    chat.title = normalizeTitle(data.title);
    renderChats();
  }

  save();
}

/* =======================
   EVENTS
======================= */
form.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage();
});

sendBtn.addEventListener("click", sendMessage);

homeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const val = homeInput.value.trim();
    if (!val) return;

    homeInput.value = "";
    createChat(val);
    setTimeout(() => sendMessage(val), 0);
  }
});

document.getElementById("new-chat-btn")?.addEventListener("click", () => {
  createChat("New Chat", "chat");
});

/* =======================
   GLOBALS
======================= */
window.startMode = (m) => createChat(m, m);
window.openGameMenu = () => showScreen("game");

/* =======================
   INIT
======================= */
function init() {
  showScreen("home");
  renderChats();
}

document.addEventListener("DOMContentLoaded", init);