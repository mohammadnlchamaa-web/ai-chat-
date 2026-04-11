console.log("SCRIPT RUNNING 🔥");

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const chatForm = document.getElementById("chat-form");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");

// 📱 MOBILE MENU
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

let chats = {};
let currentChatId = null;

// 🧠 CREATE CHAT
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

    const title = document.createElement("span");
    title.textContent = chats[id].title;

    if (id === currentChatId) {
      chatItem.classList.add("active");
    }

    chatItem.onclick = () => {
      currentChatId = id;
      renderMessages();
      renderChats();

      // 📱 close sidebar on mobile
      if (window.innerWidth < 768) {
        sidebar.classList.remove("open");
      }
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

// 💬 RENDER MESSAGES
function renderMessages() {
  chatBox.innerHTML = "";

  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + (m.uiRole || m.role);
    div.textContent = m.content;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ➕ ADD MESSAGE
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

// ✨ TYPEWRITER EFFECT
function typeText(element, text, speed = 20) {
  element.textContent = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(typing, speed);
    }
  }

  typing();
}

// 🚀 SEND MESSAGE
async function sendMessage() {
  const message = input.value.trim();
  if (!message || !currentChatId) return;

  // set title
  if (chats[currentChatId].messages.length === 0) {
    chats[currentChatId].title = message.slice(0, 20);
  }

  addMessage("user", message);
  input.value = "";

  // 🔄 LOADING DOTS
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
        messages: chats[currentChatId].messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    const data = await res.json();

    // ❌ remove loading
    loading.remove();

    if (!data.reply) {
      addMessage("ai", "⚠️ Empty response");
      return;
    }

    // ✨ create animated message
    const div = document.createElement("div");
    div.className = "message ai";
    chatBox.appendChild(div);

    typeText(div, data.reply);

    // 💾 store message
    chats[currentChatId].messages.push({
      role: "assistant",
      uiRole: "ai",
      content: data.reply
    });

  } catch (err) {
    console.error(err);
    loading.remove();
    addMessage("ai", "⚠️ Server not responding");
  }

  renderChats();
}

// 🎯 EVENTS
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

sendBtn.onclick = sendMessage;
newChatBtn.onclick = createChat;

// 🚀 START
createChat();