/* js/app.js
   Daily Proof — Local-first app with Gumroad unlock (Option C)
*/

(() => {
  // ====== CONFIG ======
  const SELECTORS = {
    email: "#unlockEmail",
    license: "#unlockLicense",
    monthlyBtn: "#unlockMonthlyBtn",
    lifetimeBtn: "#unlockLifetimeBtn",
    status: "#unlockStatus",
  };

  // Where your actual tool lives (the part you want to protect).
  // If your tool is on the same page, you can just call applyEntitlements().
  const TOOL_ROUTE = "./app.html"; // change if your tool page is different

  // ====== LOCAL STORAGE KEYS ======
  const LS = {
    ent: "dp_entitlements_v1",
  };

  // ====== HELPERS ======
  const $ = (sel) => document.querySelector(sel);

  function setStatus(msg) {
    const el = $(SELECTORS.status);
    if (el) el.textContent = msg || "";
  }

  function loadEntitlements() {
    try {
      const raw = localStorage.getItem(LS.ent);
      return raw ? JSON.parse(raw) : { lifetime: false, monthlyActive: false, updatedAt: 0 };
    } catch {
      return { lifetime: false, monthlyActive: false, updatedAt: 0 };
    }
  }

  function saveEntitlements(ent) {
    localStorage.setItem(LS.ent, JSON.stringify({ ...ent, updatedAt: Date.now() }));
  }

  function isUnlocked(ent) {
    return !!(ent && (ent.lifetime || ent.monthlyActive));
  }

  // Call this to hide/show locked sections if your UI supports it.
  // Keep it simple: if unlocked, remove "is-locked" from <body>.
  function applyEntitlements(ent) {
    const unlocked = isUnlocked(ent);
    document.body.classList.toggle("is-locked", !unlocked);

    // If you have a lock banner, you can toggle it here.
    // Example:
    // const lockPanel = document.querySelector(".unlock-card");
    // if (lockPanel) lockPanel.style.display = unlocked ? "none" : "block";
  }

  async function verifyWithServer({ plan, email, licenseKey }) {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan, // "monthly" | "lifetime"
        email,
        license_key: licenseKey || "",
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    if (!res.ok) {
      const msg = (data && data.error) ? data.error : `Verification failed (${res.status})`;
      throw new Error(msg);
    }

    return data; // { ok: true, plan: "...", monthlyActive: bool, lifetime: bool }
  }

  async function handleUnlock(plan) {
    const emailEl = $(SELECTORS.email);
    const licenseEl = $(SELECTORS.license);

    const email = (emailEl?.value || "").trim().toLowerCase();
    const licenseKey = (licenseEl?.value || "").trim();

    if (!email || !email.includes("@")) {
      setStatus("Enter the email you used at checkout.");
      return;
    }

    if (plan === "lifetime" && !licenseKey) {
      // We keep lifetime strict: require license key to avoid random email guessing.
      setStatus("For lifetime, paste the license key from your Gumroad receipt.");
      return;
    }

    setStatus("Checking Gumroad…");

    try {
      const result = await verifyWithServer({ plan, email, licenseKey });

      const ent = loadEntitlements();
      const next = {
        lifetime: !!(ent.lifetime || result.lifetime),
        monthlyActive: !!(ent.monthlyActive || result.monthlyActive),
      };

      saveEntitlements(next);
      applyEntitlements(next);

      if (isUnlocked(next)) {
        setStatus("Unlocked. Opening the tool…");
        // If you’re already on the tool page, you can remove this redirect.
        window.location.href = TOOL_ROUTE;
      } else {
        setStatus("Not active yet. If you just paid, try again in 1–2 minutes.");
      }
    } catch (e) {
      setStatus(e?.message || "Network error. Try again.");
    }
  }

  // ====== INIT ======
  document.addEventListener("DOMContentLoaded", () => {
    const ent = loadEntitlements();
    applyEntitlements(ent);

    const monthlyBtn = $(SELECTORS.monthlyBtn);
    const lifetimeBtn = $(SELECTORS.lifetimeBtn);

    if (monthlyBtn) monthlyBtn.addEventListener("click", () => handleUnlock("monthly"));
    if (lifetimeBtn) lifetimeBtn.addEventListener("click", () => handleUnlock("lifetime"));
  });
})();



