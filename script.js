window.addEventListener("load", () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const mainUI = document.getElementById("mainUI");

  // Safety: if video fails, skip after 5s
  setTimeout(() => {
    showMainUI();
  }, 5000);

  // When video ends normally
  video.onended = () => {
    showMainUI();
  };

  function showMainUI() {
    intro.style.opacity = "0";
    intro.style.transition = "opacity 0.8s ease";

    setTimeout(() => {
      intro.style.display = "none";
      mainUI.style.opacity = "1";
      document.body.style.overflow = "auto";
    }, 800);
  }
});
