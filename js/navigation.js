function initMobileNavigation() {
  const navbar = document.querySelector(".navbar");
  const navLinks = navbar?.querySelector(".nav-links");

  if (!navbar || !navLinks || navbar.querySelector(".nav-toggle")) {
    return;
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-label", "Ouvrir le menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '<span></span><span></span><span></span>';

  navbar.insertBefore(toggle, navLinks);
  document.body.classList.add("has-burger-nav");

  function setOpen(isOpen) {
    navbar.dataset.menuOpen = String(isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  }

  toggle.addEventListener("click", () => {
    setOpen(navbar.dataset.menuOpen !== "true");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (navbar.dataset.menuOpen === "true" && !navbar.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  setOpen(false);
}

function initBackgroundVideo() {
  if (document.querySelector(".site-background-video")) {
    return;
  }

  const video = document.createElement("video");
  const source = document.createElement("source");

  video.className = "site-background-video";
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.setAttribute("tabindex", "-1");
  source.src = "https://github.com/alex-paolo-CIR/jsproject/releases/download/video/alice.mp4";
  source.type = "video/mp4";
  video.append(source);

  document.body.prepend(video);
  video.play().catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundVideo();
  initMobileNavigation();
});
