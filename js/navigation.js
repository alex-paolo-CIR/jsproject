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

document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
});
