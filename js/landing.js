// landing.js — shared for index.html + pricing.html
const THEME_KEY = "dp_theme";
const TRIAL_KEY = "dp_trial_start";
const PAID_KEY  = "dp_paid"; // "monthly" | "lifetime" local flag for now

function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function initThemePill(){
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  const saved = localStorage.getItem(THEME_KEY) || "night";
  setTheme(saved);

  btn.addEventListener("click", () => {
    const cur = localStorage.getItem(THEME_KEY) || "night";
    setTheme(cur === "night" ? "day" : "night");
  });
}

function startTrial(){
  localStorage.setItem(TRIAL_KEY, new Date().toISOString());
  localStorage.removeItem(PAID_KEY);
  window.location.href = "./app.html";
}

function choosePlan(plan){
  localStorage.setItem(PAID_KEY, plan); // placeholder until Stripe
  if (!localStorage.getItem(TRIAL_KEY)) {
    localStorage.setItem(TRIAL_KEY, new Date().toISOString());
  }
  window.location.href = "./app.html";
}

function initPricingButtons(){
  const trialBtn = document.getElementById("startTrialBtn");
  const monthlyBtn = document.getElementById("monthlyBtn");
  const lifetimeBtn = document.getElementById("lifetimeBtn");

  trialBtn?.addEventListener("click", startTrial);
  monthlyBtn?.addEventListener("click", () => choosePlan("monthly"));
  lifetimeBtn?.addEventListener("click", () => choosePlan("lifetime"));
}

document.addEventListener("DOMContentLoaded", () => {
  initThemePill();
  initPricingButtons();
});


