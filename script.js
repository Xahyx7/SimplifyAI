// =========================
// GLOBAL CHAT STATE
// =========================
let currentChatId = null;
let isSending = false; // ✅ Prevents spam clicking send

// =========================
// INTRO LOADER
// =========================
window.onload = () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const auth = document.getElementById("auth");

  // ✅ Check if user is already logged in
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    intro.style.display = "none";
    auth.style.display = "none";
    const mainUI = document.getElementById("mainUI");
    mainUI.style.display = "block";
    setTimeout(() => { mainUI.style.opacity = "1"; }, 50);
    newChat();
    loadHistory();
    return;
  }

  function showAuth() {
    intro.style.opacity = "0";
    setTimeout(() => {
      intro.style.display = "none";
      auth.style.display = "flex";
    }, 800);
  }

  video.onended = showAuth;
  setTimeout(showAuth, 5000);
};

// =========================
// NEW CHAT
// =========================
function newChat() {
  currentChatId = Date.now().toString();
  document.getElementById("chatContainer").innerHTML = "";
}

// =========================
// SEND MESSAGE
// =========================
async function sendMessage() {
  if (isSending) return; // ✅ Prevent double sending

  if (!currentChatId) newChat();

  const promptInput = document.getElementById("promptInput");
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  const sendBtn = document.getElementById("sendBtn");

  const prompt = promptInput.value.trim();
  const file = imageInput.files[0];

  if (!prompt && !file) {
    alert("Enter something or upload image");
    return;
  }

  // ✅ Disable send button while waiting
  isSending = true;
  sendBtn.disabled = true;
  sendBtn.innerText = "...";

  addMessage(prompt || "📷 Image uploaded", "user");
  promptInput.value = "";

  if (file) {
    const reader = new FileReader();
    reader.onload = async function () {
      const base64 = reader.result.split(",")[1];
      await process(base64, prompt);
      resetSendButton(sendBtn);
    };
    reader.readAsDataURL(file);
  } else {
    await process(null, prompt);
    resetSendButton(sendBtn);
  }

  preview.style.display = "none";
  preview.src = "";
  imageInput.value = "";
}

function resetSendButton(btn) {
  isSending = false;
  btn.disabled = false;
  btn.innerText = "Solve";
}

// =========================
// PROCESS REQUEST
// =========================
async function process(image, prompt) {
  addThinkingMessage();

  try {
    const res = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, prompt })
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      replaceLastMessage("⚠️ Server error:\n" + text);
      return;
    }

    replaceLastMessage(data.answer || "No response");
    showVideos(data.videos || []);

    // Save to chat history
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: localStorage.getItem("user"),
        action: "saveMessage",
        chatId: currentChatId,
        message: { prompt, answer: data.answer }
      })
    });

    loadHistory();

  } catch (err) {
    replaceLastMessage("⚠️ Network error. Please try again.");
  }
}

// =========================
// LOAD FULL CHAT
// =========================
async function loadChat(chatId) {
  currentChatId = chatId;

  const res = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: localStorage.getItem("user"),
      action: "getChat",
      chatId
    })
  });

  const data = await res.json();
  const chat = document.getElementById("chatContainer");
  chat.innerHTML = "";

  data.messages.forEach(m => {
    addMessage(m.prompt, "user");
    addMessage(m.answer, "ai");
  });
}

// =========================
// THINKING ANIMATION
// =========================
function addThinkingMessage() {
  const div = document.createElement("div");
  div.className = "message ai thinking";
  div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  document.getElementById("chatContainer").appendChild(div);
  scrollToBottom();
}

// =========================
// ADD MESSAGE
// =========================
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.innerText = text; // ✅ innerText is safe (no XSS)
  document.getElementById("chatContainer").appendChild(div);
  scrollToBottom();
}

// =========================
// REPLACE LAST MESSAGE (XSS FIXED)
// =========================
function replaceLastMessage(text) {
  const messages = document.querySelectorAll(".ai");
  const last = messages[messages.length - 1];
  last.innerHTML = "";
  typeText(last, text);
}

// =========================
// TYPING EFFECT (SAFE - no raw HTML injection)
// =========================
function typeText(element, text) {
  // ✅ Safe: convert markdown bold to actual <b> tags carefully
  // First set up the element properly
  element.innerHTML = "";

  // Split text into lines, handle **bold** safely
  const lines = text.split("\n");
  let lineIndex = 0;
  let charIndex = 0;
  let fullHTML = "";

  // Pre-process: convert **bold** → <b>bold</b> safely
  const processed = text
    .replace(/&/g, "&amp;")      // escape HTML first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")  // then bold
    .replace(/\n/g, "<br>");

  let i = 0;
  function typing() {
    element.innerHTML = processed.slice(0, i++);
    if (i <= processed.length) setTimeout(typing, 8);
  }
  typing();
}

// =========================
// SHOW VIDEOS
// =========================
function showVideos(videos) {
  const panel = document.getElementById("videoPanel");
  panel.innerHTML = "<h3>🎥 Videos</h3>";

  videos.forEach(v => {
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "180";
    iframe.src = `https://www.youtube.com/embed/${v.id.videoId}`;
    iframe.setAttribute("allowfullscreen", "");
    panel.appendChild(iframe);
  });
}

// =========================
// SCROLL
// =========================
function scrollToBottom() {
  const chat = document.getElementById("chatContainer");
  chat.scrollTop = chat.scrollHeight;
}

// =========================
// IMAGE PREVIEW
// =========================
document.getElementById("imageInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("preview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// =========================
// ENTER TO SEND
// =========================
document.getElementById("promptInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// =========================
// VOICE INPUT
// =========================
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    document.getElementById("promptInput").value = event.results[0][0].transcript;
  };

  recognition.onerror = () => {
    alert("Voice not supported or mic blocked.");
  };

  recognition.start();
}

// =========================
// LOAD HISTORY
// =========================
async function loadHistory() {
  const user = localStorage.getItem("user");
  if (!user) return;

  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, action: "get" })
    });

    const data = await res.json();
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    data.history.forEach(chat => {
      const div = document.createElement("div");
      div.className = "history-item";
      const firstMsg = chat.messages?.[0]?.prompt || "New Chat";
      div.innerText = firstMsg.slice(0, 25) + (firstMsg.length > 25 ? "..." : "");
      div.onclick = () => loadChat(chat.chatId);
      list.appendChild(div);
    });

  } catch {
    console.log("History load failed");
  }
}

// =========================
// AUTH
// =========================
async function signup() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please fill in both fields");
    return;
  }

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, type: "signup" })
  });

  const data = await res.json();

  if (data.success) {
    alert("Account created! Please login.");
  } else {
    alert(data.error || "Signup failed");
  }
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please fill in both fields");
    return;
  }

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, type: "login" })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem("user", username);

    document.getElementById("auth").style.display = "none";

    const mainUI = document.getElementById("mainUI");
    mainUI.style.display = "block";
    setTimeout(() => { mainUI.style.opacity = "1"; }, 50);

    newChat();
    loadHistory();
  } else {
    alert(data.error || "Invalid login");
  }
}

// =========================
// LOGOUT (bonus!)
// =========================
function logout() {
  localStorage.removeItem("user");
  location.reload();
}
