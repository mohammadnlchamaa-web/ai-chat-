const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");

let chats = JSON.parse(localStorage.getItem("chats") || "{}");
let currentChat = null;

function typeText(element, text, speed = 20) {
  let i = 0;

  element.innerHTML = `<span class="text"></span><span class="cursor"></span>`;
  
  const textSpan = element.querySelector(".text");
  const cursor = element.querySelector(".cursor");

  function step() {
    if (i < text.length) {
      textSpan.textContent += text[i++];
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(step, speed);
    } else {
      cursor.remove(); // remove cursor when done
    }
  }

  step();
}
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

function newChat() {
  const id = "chat_" + Date.now();
  chats[id] = [];
  currentChat = id;
  chatBox.innerHTML = "";
  save();
  renderSidebar();
}

function loadChat(id) {
  currentChat = id;
  chatBox.innerHTML = "";
  chats[id].forEach(m => addMessage(m.text, m.type));
}

function renderSidebar() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const div = document.createElement("div");
    div.className = "chat-item";

    div.innerText = chats[id][0]?.text?.slice(0, 20) || "New Chat";

    div.onclick = () => loadChat(id);

    const del = document.createElement("button");
    del.innerText = "🗑";

    del.onclick = (e) => {
      e.stopPropagation();
      delete chats[id];
      save();
      renderSidebar();
    };

    div.appendChild(del);
    chatList.appendChild(div);
  });
}

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = "msg " + type;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = text;

  msg.appendChild(bubble);
  chatBox.appendChild(msg);

  chatBox.scrollTop = chatBox.scrollHeight;

  return bubble;
}

async function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;

  if (!currentChat) newChat();

  addMessage(msg, "user");
  chats[currentChat].push({ text: msg, type: "user" });

  input.value = "";

 const bubble = addMessage("", "ai");

bubble.innerHTML = `
  <div class="dots">
    <span></span><span></span><span></span>
  </div>
`;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chats[currentChat] })
    });

    const data = await res.json();
typeText(bubble, data.reply || "No response", 15);
    chats[currentChat].push({ text: data.reply, type: "ai" });
    save();
    renderSidebar();

  } catch (err) {
    bubble.innerText = "Server error";
  }
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

newChatBtn.onclick = newChat;

if (Object.keys(chats).length === 0) newChat();
else {
  currentChat = Object.keys(chats)[0];
  loadChat(currentChat);
}

renderSidebar();