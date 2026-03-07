// Daily Proof · shared.js (used by landing + pricing pages)
// Theme is consistent across all pages via this single file

const THEME_KEY = "dp_theme";

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem(THEME_KEY, t);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = t === "day" ? "Day" : "Night";
}

function toggleTheme() {
  const cur = localStorage.getItem(THEME_KEY) || "night";
  setTheme(cur === "day" ? "night" : "day");
}

// Init on page load
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme immediately
  setTheme(localStorage.getItem(THEME_KEY) || "night");

  // Wire theme button — works on any page
  document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

  // Trial start button(s)
  document.querySelectorAll("[data-trial]").forEach(el => {
    el.addEventListener("click", () => {
      if (!localStorage.getItem("dp_trial_start")) {
        localStorage.setItem("dp_trial_start", new Date().toISOString());
      }
    });
  });
});

// ── Gumroad popup helper (used on landing + pricing) ──────────────
// Opens Gumroad in a small popup window instead of new tab.
// Shows a "completing purchase" overlay while window is open.
// When popup closes, checks localStorage for paid status.

function openGumroad(url, plan) {
  const w = 520, h = 680;
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);

  const popup = window.open(
    url,
    "gumroad_checkout",
    `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    // Fallback: blocked popups — open in same tab
    window.location.href = url;
    return;
  }

  // Show "waiting for purchase" overlay
  showPurchaseOverlay(plan, popup);
}

function showPurchaseOverlay(plan, popup) {
  // Create overlay if it doesn't exist
  let overlay = document.getElementById("purchaseOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "purchaseOverlay";
    overlay.className = "purchase-overlay";
    overlay.innerHTML = `
      <div class="purchase-spinner"></div>
      <div class="purchase-title">Completing your purchase</div>
      <div class="purchase-sub">Gumroad is open in a small window.<br>Complete your purchase there — we'll activate your access automatically.</div>
      <button class="btn btn-ghost" id="purchaseCancel" style="margin-top:8px; font-size:12px; color:var(--muted);">Cancel</button>
    `;
    document.body.appendChild(overlay);
    document.getElementById("purchaseCancel")?.addEventListener("click", () => {
      overlay.classList.remove("show");
      if (popup && !popup.closed) popup.close();
      clearInterval(pollTimer);
    });
  }
  overlay.classList.add("show");

  // Poll every second: did user complete purchase?
  let pollTimer = setInterval(() => {
    // Check if popup was closed
    if (popup.closed) {
      clearInterval(pollTimer);
      overlay.classList.remove("show");

      // Check if paid was set (via ?paid= param handled in app.html)
      // For landing/pricing: just redirect to app with confirmation
      const paid = localStorage.getItem("dp_paid");
      if (paid) {
        showSuccess();
      }
      // else: they just closed without buying — that's fine
    }
  }, 1000);
}

function showSuccess() {
  let overlay = document.getElementById("purchaseOverlay");
  if (overlay) {
    overlay.innerHTML = `
      <div style="font-size:40px; margin-bottom:16px;">✓</div>
      <div class="purchase-title" style="color:var(--green);">Access activated!</div>
      <div class="purchase-sub">Welcome to Daily Proof. Taking you to the app…</div>
    `;
    overlay.style.background = "var(--bg)";
    setTimeout(() => { window.location.href = "./app.html"; }, 1800);
  }
}
