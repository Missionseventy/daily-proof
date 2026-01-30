// Daily Proof — landing.js (FULL)
// Works on index.html + pricing.html
// - Theme toggle (Day/Night)
// - Landing CTA -> Pricing
// - Start Trial / Monthly / Lifetime -> app.html (local placeholder until Stripe)

const THEME_KEY = "dp_theme";
const TRIAL_KEY = "dp_trial_start";
const PAID_KEY  = "dp_paid"; // "monthly" | "lifetime"

// ---------- Theme ----------
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

// ---------- Navigation ----------
function go(url) {
  window.location.href = url;
}

// ---------- Access (local placeholder) ----------
function startTrial() {
  localStorage.setItem(TRIAL_KEY, new Date().toISOString());
  localStorage.removeItem(PAID_KEY);
  go("app.html");
}

function choosePlan(plan) {
  localStorage.setItem(PAID_KEY, plan); // "monthly" | "lifetime"
  if (!localStorage.getItem(TRIAL_KEY)) {
    localStorage.setItem(TRIAL_KEY, new Date().toISOString());
  }
  go("app.html");
}

// ---------- Wire buttons safely ----------
function wire() {
  // Landing CTA
  document.getElementById("useNowBtn")?.addEventListener("click", () => go("pricing.html"));

  // Pricing CTAs
  document.getElementById("startTrialBtn")?.addEventListener("click", startTrial);
  document.getElementById("monthlyBtn")?.addEventListener("click", () => choosePlan("monthly"));
  document.getElementById("lifetimeBtn")?.addEventListener("click", () => choosePlan("lifetime"));

  // Top nav links (both pages)
  document.getElementById("homeLink")?.addEventListener("click", (e) => { e.preventDefault(); go("index.html"); });
  document.getElementById("pricingLink")?.addEventListener("click", (e) => { e.preventDefault(); go("pricing.html"); });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  wire();
});

