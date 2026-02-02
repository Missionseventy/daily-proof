// Daily Proof — unlock.js (FULL)
// Option C: verify access via backend (Cloudflare Worker), store token, open app.

const WORKER_BASE = "https://YOUR-WORKER.your-subdomain.workers.dev"; // <-- SET THIS

const THEME_KEY = "dp_theme";
const AUTH_KEY  = "dp_auth_token";
const PAID_KEY  = "dp_paid";
const TRIAL_KEY = "dp_trial_start";

// Theme toggle on pricing too
function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = theme === "day" ? "Day" : "Night";
}
document.getElementById("themeBtn")?.addEventListener("click", ()=>{
  const cur = localStorage.getItem(THEME_KEY) || "night";
  setTheme(cur === "day" ? "night" : "day");
});
setTheme(localStorage.getItem(THEME_KEY) || "night");

// DOM
const emailEl = document.getElementById("unlockEmail");
const keyEl = document.getElementById("unlockKey");
const msgEl = document.getElementById("unlockMsg");

function showMsg(t){
  if (msgEl) msgEl.textContent = t;
}

async function verify(plan){
  const email = (emailEl?.value || "").trim().toLowerCase();
  const licenseKey = (keyEl?.value || "").trim();

  if (!email) return showMsg("Enter the email used at checkout.");

  showMsg("Verifying...");

  try{
    const res = await fetch(`${WORKER_BASE}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, licenseKey, plan })
    });

    const data = await res.json().catch(()=> ({}));

    if (!res.ok || !data.ok){
      showMsg(data.error || "Could not verify purchase. Try again.");
      return;
    }

    // Store token + plan (local-first)
    localStorage.setItem(AUTH_KEY, data.token);
    localStorage.setItem(PAID_KEY, data.plan || plan);

    // Optional local trial marker for monthly UX
    if ((data.plan || plan) === "monthly" && !localStorage.getItem(TRIAL_KEY)){
      localStorage.setItem(TRIAL_KEY, new Date().toISOString());
    }

    showMsg("Unlocked. Opening Daily Proof...");
    window.location.href = "./app.html";
  } catch (e){
    showMsg("Network error. Try again in a moment.");
  }
}

document.getElementById("unlockMonthlyBtn")?.addEventListener("click", ()=> verify("monthly"));
document.getElementById("unlockLifetimeBtn")?.addEventListener("click", ()=> verify("lifetime"));

emailEl?.addEventListener("keydown", (e)=> {
  if (e.key === "Enter") verify("monthly");
});
keyEl?.addEventListener("keydown", (e)=> {
  if (e.key === "Enter") verify("lifetime");
});
