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
