const THEME_KEY = "dp_theme";

function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = theme === "day" ? "Day" : "Night";
}

document.getElementById("themeBtn")?.addEventListener("click", () => {
  const cur = localStorage.getItem(THEME_KEY) || "night";
  setTheme(cur === "day" ? "night" : "day");
});

setTheme(localStorage.getItem(THEME_KEY) || "night");
