// /js/theme.js
// Shared theme logic for landing/pricing/app pages

const THEME_KEY = "dp_theme";

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  // Optional: update pill UI if present
  const pill = document.querySelector("[data-theme-pill]");
  if (pill) {
    pill.setAttribute("data-value", theme);
    const dayBtn = pill.querySelector("[data-theme='day']");
    const nightBtn = pill.querySelector("[data-theme='night']");
    if (dayBtn && nightBtn) {
      dayBtn.classList.toggle("active", theme === "day");
      nightBtn.classList.toggle("active", theme === "night");
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "night";
  setTheme(saved);

  const pill = document.querySelector("[data-theme-pill]");
  if (!pill) return;

  pill.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme]");
    if (!btn) return;
    setTheme(btn.getAttribute("data-theme"));
  });
}

document.addEventListener("DOMContentLoaded", initTheme);
