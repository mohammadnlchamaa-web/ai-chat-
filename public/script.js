console.log("SCRIPT RUNNING 🔥");

const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const chatForm = document.getElementById("chat-form");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");

menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

let chats = {};
let currentChatId = null;

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

    if (id === currentChatId) {
      chatItem.classList.add("active");
    }

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

      if (window.innerWidth < 768) {
        sidebar.classList.remove("open");
      }
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
    div.className = "message " + (m.uiRole || m.role);
    div.innerHTML = marked.parse(m.content);
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =======================
   ADD MESSAGE
======================= */
function addMessage(role, content) {
  if (!currentChatId || !chats[currentChatId]) return;

  const apiRole = role === "ai" ? "assistant" : role;

  chats[currentChatId].messages.push({
    role: apiRole,
    uiRole: role,
    content
  });

  renderMessages();
}

/* =======================
   TYPEWRITER EFFECT
======================= */
function typeText(element, text, speed = 15) {
  let i = 0;

  function typing() {
    if (i <= text.length) {
      element.innerHTML = marked.parse(text.slice(0, i));
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(typing, speed);
    }
  }

  typing();
}

/* =======================
   SEND MESSAGE
======================= */
async function sendMessage() {
  const message = input.value.trim();
  if (!message || !currentChatId) return;

  const chat = chats[currentChatId];

  // set title
  if (chat.messages.length === 0) {
    chat.title = message.slice(0, 20);
  }

  addMessage("user", message);
  input.value = "";

  // loading UI
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chat.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    console.log("STATUS:", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      loading.remove();
      addMessage("ai", "⚠️ Invalid server response");
      return;
    }

    loading.remove();

    if (!data.reply) {
      addMessage("ai", "⚠️ Empty response");
      return;
    }

    // AI message element
    const div = document.createElement("div");
    div.className = "message ai";
    chatBox.appendChild(div);

    typeText(div, data.reply);

    // store message ONCE (FIXED BUG)
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
      .then(reg => console.log("SW registered 🔥"))
      .catch(err => console.log("SW failed:", err));
  });
}

const overlay = document.getElementById("overlay");

menuBtn.onclick = () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
};

overlay.onclick = () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
};