// =========================
// GLOBAL CHAT STATE
// =========================
let currentChatId = null;

// =========================
// INTRO LOADER
// =========================
window.onload = () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const auth = document.getElementById("auth");

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
  if (!currentChatId) newChat();

  const promptInput = document.getElementById("promptInput");
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("preview");

  const prompt = promptInput.value;
  const file = imageInput.files[0];

  if (!prompt && !file) {
    alert("Enter something or upload image");
    return;
  }

  addMessage(prompt || "📷 Image uploaded", "user");
  promptInput.value = "";

  if (file) {
    const reader = new FileReader();
    reader.onload = async function () {
      const base64 = reader.result.split(",")[1];
      await process(base64, prompt);
    };
    reader.readAsDataURL(file);
  } else {
    await process(null, prompt);
  }

  preview.style.display = "none";
  preview.src = "";
  imageInput.value = "";
}

// =========================
// PROCESS REQUEST (UPDATED)
// =========================
async function process(image, prompt) {
  addThinkingMessage();

  try {
    const res = await fetch("/api/solve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

    // ✅ SAVE TO CHAT SESSION
    await fetch("/api/history", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        username: localStorage.getItem("user"),
        action: "saveMessage",
        chatId: currentChatId,
        message: {
          prompt,
          answer: data.answer
        }
      })
    });

    loadHistory();

  } catch (err) {
    replaceLastMessage("⚠️ Network error. Try again.");
  }
}

// =========================
// LOAD FULL CHAT
// =========================
async function loadChat(chatId) {
  currentChatId = chatId;

  const res = await fetch("/api/history", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
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

  div.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;

  document.getElementById("chatContainer").appendChild(div);
  scrollToBottom();
}

// =========================
// ADD MESSAGE
// =========================
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.innerText = text;

  document.getElementById("chatContainer").appendChild(div);
  scrollToBottom();
}

// =========================
// REPLACE LAST MESSAGE
// =========================
function replaceLastMessage(text) {
  const messages = document.querySelectorAll(".ai");
  const last = messages[messages.length - 1];

  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");

  last.innerHTML = "";
  typeHTML(last, formatted);
}

// =========================
// TYPING EFFECT
// =========================
function typeHTML(element, html) {
  let i = 0;
  function typing() {
    element.innerHTML = html.slice(0, i++);
    if (i <= html.length) setTimeout(typing, 10);
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
    panel.innerHTML += `
      <iframe width="100%" height="180"
      src="https://www.youtube.com/embed/${v.id.videoId}">
      </iframe>
    `;
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
    document.getElementById("promptInput").value =
      event.results[0][0].transcript;
  };

  recognition.start();
}

// =========================
// HISTORY (UPDATED)
// =========================
async function loadHistory() {
  const user = localStorage.getItem("user");
  if (!user) return;

  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: user, action: "get" })
    });

    const data = await res.json();
    const list = document.getElementById("historyList");

    list.innerHTML = "";

    data.history.forEach(chat => {
      const div = document.createElement("div");

      const firstMsg = chat.messages?.[0]?.prompt || "New Chat";
      div.innerText = firstMsg.slice(0, 25);

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
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password, type: "signup" })
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    alert("Server error: " + text);
    return;
  }

  if (data.success) alert("Signed up!");
  else alert(data.error || "Signup failed");
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password, type: "login" })
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    alert("Server error: " + text);
    return;
  }

  if (data.success) {
    localStorage.setItem("user", username);

    const mainUI = document.getElementById("mainUI");

    document.getElementById("auth").style.display = "none";

    mainUI.style.display = "block";
    setTimeout(() => {
      mainUI.style.opacity = "1";
    }, 50);

    newChat(); // start fresh chat
    loadHistory();
  } else {
    alert(data.error || "Invalid login");
  }
}
