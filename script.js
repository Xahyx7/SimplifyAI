// =========================
// INTRO LOADER
// =========================
window.onload = () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const mainUI = document.getElementById("mainUI");

  video.onended = () => {
    intro.style.opacity = "0";
    setTimeout(() => {
      intro.style.display = "none";
      mainUI.style.opacity = "1";
    }, 800);
  };

  loadHistory();
};

// =========================
// SEND MESSAGE
// =========================
async function sendMessage() {
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

  let base64 = null;

  if (file) {
    const reader = new FileReader();
    reader.onload = async function () {
      base64 = reader.result.split(",")[1];
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
// PROCESS REQUEST
// =========================
async function process(image, prompt) {
  addThinkingMessage();

  const res = await fetch("/api/solve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image, prompt })
  });

  const data = await res.json();

  replaceLastMessage(data.answer);
  showVideos(data.videos);

  // 📚 SAVE HISTORY
  await fetch("/api/history", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      username: localStorage.getItem("user"),
      action: "save",
      data: { prompt, answer: data.answer }
    })
  });

  loadHistory();
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
// HISTORY
// =========================
async function loadHistory() {
  const user = localStorage.getItem("user");
  if (!user) return;

  const res = await fetch("/api/history", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username: user, action: "get" })
  });

  const data = await res.json();
  const list = document.getElementById("historyList");

  if (!list) return;

  list.innerHTML = "";

  data.history.forEach(item => {
    const div = document.createElement("div");
    div.innerText = item.prompt.slice(0, 25);

    div.onclick = () => {
      addMessage(item.prompt, "user");
      addMessage(item.answer, "ai");
    };

    list.appendChild(div);
  });
}

// =========================
// AUTH
// =========================
async function signup() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  await fetch("/api/auth", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password, type: "signup" })
  });

  alert("Signed up!");
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password, type: "login" })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem("user", username);
    document.getElementById("auth").style.display = "none";
    loadHistory();
  } else {
    alert("Invalid login");
  }
}

// =========================
// NEW CHAT
// =========================
function newChat() {
  document.getElementById("chatContainer").innerHTML = "";
}
