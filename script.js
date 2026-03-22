window.addEventListener("load", () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const mainUI = document.getElementById("mainUI");

  const sidebar = document.querySelector(".sidebar");
  const card = document.querySelector(".card");
  const right = document.querySelector(".right");
  const glassBoxes = document.querySelectorAll(".glass");

  setTimeout(showUI, 6000);
  video.onended = showUI;

  function showUI() {
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.style.display = "none";
      mainUI.style.opacity = "1";

      // SIDEBAR
      setTimeout(() => {
        sidebar.style.opacity = "1";
        sidebar.style.transform = "translateX(0)";
        sidebar.style.transition = "0.6s ease";
      }, 200);

      // CENTER CARD
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
        card.style.transition = "0.7s cubic-bezier(0.22,1,0.36,1)";
      }, 500);

      // RIGHT PANEL
      setTimeout(() => {
        right.style.opacity = "1";
        right.style.transform = "translateX(0)";
        right.style.transition = "0.6s ease";
      }, 800);

      // GLASS BOXES STAGGER
      glassBoxes.forEach((box, i) => {
        setTimeout(() => {
          box.style.opacity = "1";
          box.style.transform = "scale(1) translateY(0)";
          box.style.transition = "0.6s ease";
        }, 1000 + i * 200);
      });

      document.body.style.overflow = "auto";

    }, 1000);
  }
});
