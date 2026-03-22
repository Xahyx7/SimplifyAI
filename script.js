window.addEventListener("load", () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const mainUI = document.getElementById("mainUI");

  const card = document.getElementById("card");
  const boxes = document.querySelectorAll(".glass");

  setTimeout(showUI, 6000);
  video.onended = showUI;

  function showUI() {
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.style.display = "none";
      mainUI.style.opacity = "1";

      // CARD
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
        card.style.transition = "0.6s ease";
      }, 200);

      // OUTPUT
      boxes.forEach((box, i) => {
        setTimeout(() => {
          box.style.opacity = "1";
          box.style.transform = "translateY(0)";
          box.style.transition = "0.5s ease";
        }, 500 + i * 200);
      });

    }, 800);
  }
});
async function solve() {
  const file = document.getElementById("imageInput").files[0];
  const prompt = document.getElementById("promptInput").value;

  // ❌ If nothing given
  if (!file && (!prompt || prompt.trim() === "")) {
    alert("Upload an image OR type your doubt!");
    return;
  }

  const reader = new FileReader();

  // 🧠 TEXT ONLY MODE
  if (!file) {
    processRequest(null, prompt);
    return;
  }

  // 🧠 IMAGE MODE
  reader.onload = function () {
    const base64 = reader.result.split(",")[1];
    processRequest(base64, prompt);
  };

  reader.readAsDataURL(file);
}


// 🔥 COMMON FUNCTION
async function processRequest(image, prompt) {
  document.getElementById("answer").innerText = "Thinking...";
  document.getElementById("videos").innerHTML = "Loading videos...";

  const res = await fetch("/api/solve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: image,
      prompt: prompt
    })
  });

  const data = await res.json();

  document.getElementById("answer").innerText = data.answer;

  const videoDiv = document.getElementById("videos");
  videoDiv.innerHTML = "";

  data.videos.forEach(v => {
    const id = v.id.videoId;

    videoDiv.innerHTML += `
      <iframe width="100%" height="150"
      src="https://www.youtube.com/embed/${id}"
      frameborder="0" allowfullscreen></iframe>
    `;
  });

  reader.readAsDataURL(file);
}
