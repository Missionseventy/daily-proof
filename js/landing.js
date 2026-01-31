// Daily Proof — landing.js (FULL)
// Handles Day/Night toggle on index.html + pricing.html

const THEME_KEY = "dp_theme";

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = theme === "day" ? "Day" : "Night";
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem(THEME_KEY) || "night";
  setTheme(saved);

  const btn = document.getElementById("themeBtn");
  btn?.addEventListener("click", () => {
    const cur = localStorage.getItem(THEME_KEY) || "night";
    setTheme(cur === "day" ? "night" : "day");
  });
});




