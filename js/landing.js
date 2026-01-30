// Daily Proof — landing.js
// Landing + Pricing behavior (theme toggle + navigation + trial/plan placeholders)

const THEME_KEY = "dp_theme";
const TRIAL_KEY = "dp_trial_start";
const PAID_KEY  = "dp_paid"; // "monthly" | "lifetime"

// Theme toggle
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = theme === "day" ? "Day" : "Night";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "night";
  setTheme(saved);

  const btn = document.getElementById("themeBtn");
  btn?.addEventListener("click", () => {
    const cur = localStorage.getItem(THEME_KEY) || "night";
    setTheme(cur === "day" ? "night" : "day");
  });
}

// Buttons
function wireButtons() {
  // Landing page CTA
  const useNowBtn = document.getElementById("useNowBtn");
  useNowBtn?.addEventListener("click", () => {
    window.location.href = "pricing.html";
  });

  // Pricing page buttons
  const startTrialBtn = document.getElementById("startTrialBtn");
  startTrialBtn?.addEventListener("click", () => {
    localStorage.setItem(TRIAL_KEY, new Date().toISOString());
    localStorage.removeItem(PAID_KEY);
    window.location.href = "app.html";
  });

  const monthlyBtn = document.getElementById("monthlyBtn");
  monthlyBtn?.addEventListener("click", () => {
    localStorage.setItem(PAID_KEY, "monthly");
    if (!localStorage.getItem(TRIAL_KEY)) {
      localStorage.setItem(TRIAL_KEY, new Date().toISOString());
    }
    window.location.href = "app.html";
  });

  const lifetimeBtn = document.getElementById("lifetimeBtn");
  lifetimeBtn?.addEventListener("click", () => {
    localStorage.setItem(PAID_KEY, "lifetime");
    if (!localStorage.getItem(TRIAL_KEY)) {
      localStorage.setItem(TRIAL_KEY, new Date().toISOString());
    }
    window.location.href = "app.html";
  });
}

initTheme();
wireButtons();
