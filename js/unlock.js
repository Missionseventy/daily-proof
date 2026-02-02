const API_BASE = "https://YOUR-WORKER.your-subdomain.workers.dev"; // <- replace

const emailEl = document.getElementById("unlockEmail");
const keyEl = document.getElementById("unlockKey");
const msgEl = document.getElementById("unlockMsg");

const monthlyBtn = document.getElementById("unlockMonthlyBtn");
const lifetimeBtn = document.getElementById("unlockLifetimeBtn");

const PAID_KEY  = "dp_paid";       // "monthly" | "lifetime"
const TRIAL_KEY = "dp_trial_start"; // keep for UI wording if you want
const AUTH_KEY  = "dp_auth_token";  // new: backend token

async function verify(plan){
  const email = (emailEl?.value || "").trim();
  const licenseKey = (keyEl?.value || "").trim();

  if (!email) return showMsg("Email is required.");

  showMsg("Verifying...");

  const res = await fetch(`${API_BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, licenseKey, plan }),
  });

  const data = await res.json().catch(()=> ({}));

  if (!res.ok || !data.ok){
    return showMsg(data.error || "Could not verify. Try again.");
  }

  localStorage.setItem(AUTH_KEY, data.token);
  localStorage.setItem(PAID_KEY, data.plan);

  // Optional: mark a "trial_start" for monthly UX text consistency
  if (data.plan === "monthly" && !localStorage.getItem(TRIAL_KEY)){
    localStorage.setItem(TRIAL_KEY, new Date().toISOString());
  }

  showMsg("Unlocked. Opening Daily Proof...");
  window.location.href = "./app.html";
}

function showMsg(t){
  if (msgEl) msgEl.textContent = t;
}

monthlyBtn?.addEventListener("click", ()=> verify("monthly"));
lifetimeBtn?.addEventListener("click", ()=> verify("lifetime"));
