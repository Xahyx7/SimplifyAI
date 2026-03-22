window.addEventListener("load", () => {
  const video = document.getElementById("introVideo");
  const intro = document.getElementById("intro");
  const mainUI = document.getElementById("mainUI");

  const card = document.getElementById("card");
  const boxes = document.querySelectorAll(".glass");

  // fallback if video fails
  setTimeout(showUI, 6000);

  video.onended = showUI;

  function showUI() {
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.style.display = "none";
      mainUI.style.opacity = "1";

      // 🎯 MAIN CARD POP (smooth)
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "scale(1) translateY(0)";
        card.style.transition = "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)";
      }, 200);

      // 🎯 STAGGERED BOX POP
      boxes.forEach((box, i) => {
        setTimeout(() => {
          box.style.opacity = "1";
          box.style.transform = "scale(1) translateY(0)";
          box.style.transition = "all 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
        }, 600 + i * 250);
      });

      document.body.style.overflow = "auto";

    }, 1000); // smoother delay
  }
});
