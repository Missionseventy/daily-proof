const VERIFY_ENDPOINT = "/api/verify";

const LS_UNLOCK = "dp_unlock_v2"; // {plan,email,ts}

const $ = (id) => document.getElementById(id);

function setMsg(t){ $("msg").textContent = t || ""; }

function getUnlock(){
  try{
    const raw = localStorage.getItem(LS_UNLOCK);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}
function setUnlock(data){ localStorage.setItem(LS_UNLOCK, JSON.stringify(data)); }
function clearUnlock(){ localStorage.removeItem(LS_UNLOCK); }

function showUnlocked(plan, email){
  $("unlockCard").classList.add("hidden");
  $("appCard").classList.remove("hidden");
  $("planLine").textContent = `Unlocked: ${plan} • ${email}`;
}

async function postVerify(body){
  // NOTE: opening /api/verify in browser sends GET -> 405 "Method not allowed"
  // This function sends the required POST.
  const r = await fetch(VERIFY_ENDPOINT, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  return r.json();
}

async function unlockMonthly(){
  const email = ($("email").value || "").trim().toLowerCase();
  if (!email) return setMsg("Enter the email used at checkout.");

  setMsg("Checking monthly purchase…");
  const data = await postVerify({ plan:"monthly", email });

  if (data.ok){
    setUnlock({ plan:"monthly", email, ts: Date.now() });
    showUnlocked("Monthly", email);
  } else {
    setMsg(data.error || "Could not verify. Double-check your checkout email.");
  }
}

async function unlockLifetime(){
  const email = ($("email").value || "").trim().toLowerCase();
  const license_key = ($("license").value || "").trim();
  if (!email) return setMsg("Enter the email used at checkout.");
  if (!license_key) return setMsg("Enter your Gumroad license key for lifetime.");

  setMsg("Checking lifetime license…");
  const data = await postVerify({ plan:"lifetime", email, license_key });

  if (data.ok){
    setUnlock({ plan:"lifetime", email, ts: Date.now() });
    showUnlocked("Lifetime", email);
  } else {
    setMsg(data.error || "Invalid license or email mismatch.");
  }
}

$("unlockMonthly").addEventListener("click", () => unlockMonthly().catch(() => setMsg("Network error.")));
$("unlockLifetime").addEventListener("click", () => unlockLifetime().catch(() => setMsg("Network error.")));
$("lock").addEventListener("click", () => { clearUnlock(); location.reload(); });

(function init(){
  const u = getUnlock();
  if (u?.plan && u?.email){
    showUnlocked(u.plan === "monthly" ? "Monthly" : "Lifetime", u.email);
  }
})();




