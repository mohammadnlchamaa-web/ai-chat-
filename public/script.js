console.log("RUNNING");

let chats = {};
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

/* =======================
   UI
======================= */
function showHome() {
  home.style.display = "flex";
}

function showChat() {
  home.style.display = "none";
}

/* =======================
   SAVE
======================= */
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/* =======================
   SCROLL (FIXED)
======================= */
function smartScroll() {
  const threshold = 100; // how close to bottom = "allowed to auto scroll"

  const isNearBottom =
    chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;

  if (isNearBottom) {
    requestAnimationFrame(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }
}

/* =======================
   CREATE CHAT
======================= */
function createChat(title, m = "chat") {
  const id = Date.now().toString();

  chats[id] = {
    title,
    messages: [],
    mode: m
  };

  currentChatId = id;
  mode = m;

  showChat();
  renderChats();
  renderMessages();
  updateHeader();
  save();
}

/* =======================
   OPEN CHAT
======================= */
function openChat(id) {
  if (!chats[id]) return;

  currentChatId = id;
  mode = chats[id].mode;

  showChat();
  renderChats();
  renderMessages();
  updateHeader();
}

/* =======================
   MODE SELECT
======================= */
window.startMode = function (m) {
  mode = m;
  createChat(m.toUpperCase(), m);
};

/* =======================
   DELETE CHAT (FIXED)
======================= */
function deleteChat(id) {
  const wasCurrent = currentChatId === id;

  delete chats[id];
  save();

  const remaining = Object.keys(chats);

  if (wasCurrent) {
    if (remaining.length > 0) {
      openChat(remaining[0]);
    } else {
      currentChatId = null;
      showHome();
    }
  }

  renderChats();
  renderMessages();
  updateHeader();
}

/* =======================
   RENDER CHATS
======================= */
function renderChats() {
  chatList.innerHTML = "";

  Object.entries(chats).forEach(([id, chat]) => {
    const div = document.createElement("div");
    div.className = "chat-item";

    if (id === currentChatId) {
      div.classList.add("active");
    }

    const title = document.createElement("span");
    title.textContent = (chat.title || "New Chat")
      .split(" ")
      .slice(0, 3)
      .join(" ");

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.className = "delete-btn";

    del.onclick = (e) => {
      e.stopPropagation();
      deleteChat(id);
    };

    div.onclick = () => openChat(id);

    div.appendChild(title);
    div.appendChild(del);

    chatList.appendChild(div);
  });
}

/* =======================
   FORMAT TEXT
======================= */
function formatText(text) {
  return text.replace(/\n/g, "<br>");
}

/* =======================
   RENDER MESSAGES
======================= */
function renderMessages() {
  chatBox.innerHTML = "";

  const chat = chats[currentChatId];
  if (!chat) return;

  chat.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message " + m.role;

    const inner = document.createElement("div");
    inner.innerHTML = formatText(m.content);

    row.appendChild(inner);
    chatBox.appendChild(row);
  });

smartScroll();
}

/* =======================
   TYPEWRITER
======================= */
function typeText(element, text, speed = 12) {
  element.innerHTML = "";

  let i = 0;

  function type() {
    if (i < text.length) {
      element.innerHTML += text[i] === "\n" ? "<br>" : text[i];
      i++;
      smartScroll();
      setTimeout(type, speed);
    }
  }

  type();
}

/* =======================
   SEND MESSAGE
======================= */
async function sendMessage(text) {
  const msg = text || input.value.trim();
  if (!msg) return;

  if (!currentChatId) {
    createChat(msg, mode);
    return;
  }

  const chat = chats[currentChatId];

  // USER MESSAGE
  chat.messages.push({ role: "user", content: msg });

  input.value = "";
  renderMessages();
const typingRow = showTyping();
  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: chat.mode,
        messages: chat.messages,
        chatId: currentChatId
      })
    });

    const data = await res.json();
typingRow.remove();
    // TITLE UPDATE
    if (data.title) {
      chats[currentChatId].title = data.title;
      renderChats();
      save();
    }

    const reply = data.reply || "No response";

    // CREATE AI MESSAGE ROW
    const row = document.createElement("div");
    row.className = "message assistant";

    const inner = document.createElement("div");
    row.appendChild(inner);
    chatBox.appendChild(row);

    // SAVE MESSAGE
    chat.messages.push({
      role: "assistant",
      content: reply
    });

    smartScroll();

    // TYPE EFFECT
    setTimeout(() => {
      typeText(inner, reply, 10);
    }, 100);

    save();

  } catch (err) {
    console.log(err);

    chat.messages.push({
      role: "assistant",
      content: "⚠️ Server error"
    });

    renderMessages();
  }
}

/* =======================
   EVENTS
======================= */
form.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage();
});

sendBtn.onclick = () => sendMessage();

/* =======================
   HOME INPUT (FIXED)
======================= */
homeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const value = homeInput.value.trim();
    if (!value) return;

    mode = "chat";

    createChat(value, mode);
setTimeout(() => {
  sendMessage(value);
}, 0);

    homeInput.value = "";
  }
});

/* =======================
   NEW CHAT
======================= */
document.getElementById("new-chat-btn").onclick = () => {
  mode = "chat";
  createChat("New Chat", mode);
};

/* =======================
   HEADER
======================= */
function updateHeader() {
  const header = document.getElementById("chat-header");
  if (!header) return;

  const chat = chats[currentChatId];

  if (!chat) {
    header.textContent = "";
    return;
  }

  const modes = {
    chat: "💬 Chat",
    quiz: "🧠 Quiz",
    homework: "📘 Homework",
    write: "✍️ Write",
    summarize: "📌 Summarize"
  };

  header.textContent = modes[chat.mode] || "💬 Chat";
}
function showTyping() {
  const row = document.createElement("div");
  row.className = "message assistant typing-row";

  const box = document.createElement("div");
  box.className = "typing";

  box.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  `;

  row.appendChild(box);
  chatBox.appendChild(row);

  smartScroll();

  return row; // we return it so we can remove it later
}
/* =======================
   INIT
======================= */
function init() {
  showHome();

  const saved = localStorage.getItem("chats");
  if (saved) chats = JSON.parse(saved);

  renderChats();
}

init();