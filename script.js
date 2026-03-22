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

  // 🧹 Clear preview after sending
  preview.style.display = "none";
  preview.src = "";
  imageInput.value = "";
}

// =========================
// PROCESS REQUEST
// =========================
async function process(image, prompt) {
  addMessage("Thinking...", "ai");

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
// REPLACE LAST MESSAGE (FORMATTED)
// =========================
function replaceLastMessage(text) {
  const messages = document.querySelectorAll(".ai");
  const last = messages[messages.length - 1];

  // 🧠 FORMAT TEXT
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // bold
    .replace(/\n/g, "<br>"); // line breaks

  last.innerHTML = "";
  typeHTML(last, formatted);
}

// =========================
// TYPING EFFECT (HTML SAFE)
// =========================
function typeHTML(element, html) {
  let i = 0;
  const speed = 10;

  function typing() {
    element.innerHTML = html.slice(0, i++);
    if (i <= html.length) {
      setTimeout(typing, speed);
    }
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
    const id = v.id.videoId;

    panel.innerHTML += `
      <iframe width="100%" height="180"
      src="https://www.youtube.com/embed/${id}">
      </iframe>
    `;
  });
}

// =========================
// AUTO SCROLL
// =========================
function scrollToBottom() {
  const chat = document.getElementById("chatContainer");
  chat.scrollTop = chat.scrollHeight;
}

// =========================
// IMAGE PREVIEW
// =========================
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// =========================
// ENTER TO SEND
// =========================
document.getElementById("promptInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

// =========================
// VOICE INPUT
// =========================
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    document.getElementById("promptInput").value =
      event.results[0][0].transcript;
  };

  recognition.start();
}
