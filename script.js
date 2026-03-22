const video = document.getElementById("introVideo");
const intro = document.getElementById("intro");
const mainUI = document.getElementById("mainUI");

// When video ends
video.addEventListener("ended", () => {
  // Fade out intro
  intro.style.opacity = "0";
  intro.style.transition = "opacity 0.8s ease";

  setTimeout(() => {
    intro.style.display = "none";

    // Show main UI
    mainUI.style.opacity = "1";
    document.body.style.overflow = "auto";
  }, 800);
});
