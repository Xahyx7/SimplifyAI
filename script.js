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

async function sendMessage() {
  const prompt = document.getElementById("promptInput").value;
  const file = document.getElementById("imageInput").files[0];

  if (!prompt && !file) {
    alert("Enter something or upload image");
    return;
  }

  addMessage(prompt || "📷 Image uploaded", "user");

  document.getElementById("promptInput").value = "";

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
}

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

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.innerText = text;

  document.getElementById("chatContainer").appendChild(div);

  scrollToBottom();
}

function replaceLastMessage(text) {
  const messages = document.querySelectorAll(".ai");
  const last = messages[messages.length - 1];

  typeText(last, text);
}

function typeText(element, text) {
  element.innerText = "";
  let i = 0;

  const interval = setInterval(() => {
    element.innerText += text[i];
    i++;

    if (i >= text.length) clearInterval(interval);
  }, 15);
}

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

function scrollToBottom() {
  const chat = document.getElementById("chatContainer");
  chat.scrollTop = chat.scrollHeight;
}
