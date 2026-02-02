// Daily Proof — landing.js (FULL)
// Works on index.html + pricing.html
// - Theme toggle
// - Gumroad overlay: remember selected plan
// - After successful Gumroad checkout (overlay "sale" event), unlock + open app

const THEME_KEY = "dp_theme";
const PAID_KEY = "dp_paid";
const PENDING_PLAN_KEY = "dp_pending_plan";

// ---------------- Theme ----------------
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

// ---------------- Gumroad Overlay ----------------
function initGumroadButtons() {
  // Only exists on pricing page
  const buttons = document.querySelectorAll(".gumroadBtn[data-plan]");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.getAttribute("data-plan");
      if (plan === "monthly" || plan === "lifetime") {
        localStorage.setItem(PENDING_PLAN_KEY, plan);
      }
    });
  });
}

function parseMessageData(data) {
  // Gumroad sometimes posts stringified JSON
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return null; }
  }
  if (typeof data === "object" && data !== null) return data;
  return null;
}

function initGumroadSaleListener() {
  window.addEventListener("message", (event) => {
    // Security: only accept messages from gumroad domains
    const origin = (event.origin || "").toLowerCase();
    if (!origin.includes("gumroad.com")) return;

    const payload = parseMessageData(event.data);
    if (!payload) return;

    // Gumroad overlay purchase event usually posts: { post_message_name: "sale", ... }
    if (payload.post_message_name !== "sale") return;

    // Determine which plan they intended to buy
    const plan = localStorage.getItem(PENDING_PLAN_KEY);

    // If for some reason it's missing, default to monthly (safe)
    const finalPlan = (plan === "lifetime" || plan === "monthly") ? plan : "monthly";

    // Unlock
    localStorage.setItem(PAID_KEY, finalPlan);

    // Cleanup
    localStorage.removeItem(PENDING_PLAN_KEY);

    // Send them into the app
    window.location.href = "./app.html";
  });
}

// ---------------- Boot ----------------
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initGumroadButtons();
  initGumroadSaleListener();
});
