// /js/pricing.js
// Handles "Unlock with license key" flow

const PAID_KEY = "dp_paid"; // "monthly" | "lifetime" | "paid"

function $(id) { return document.getElementById(id); }

async function verifyLicense(plan) {
  const keyEl = $("licenseKey");
  const statusEl = $("unlockStatus");

  const license_key = (keyEl?.value || "").trim();
  if (!license_key) {
    statusEl.textContent = "Enter your license key.";
    return;
  }

  statusEl.textContent = "Verifying…";

  try {
    const resp = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key, plan }),
    });

    const data = await resp.json();

    if (!data?.ok) {
      statusEl.textContent = data?.message || "Invalid key.";
      return;
    }

    // Block refunded/chargebacked purchases
    if (data?.purchase?.refunded || data?.purchase?.chargebacked || data?.purchase?.disputed) {
      statusEl.textContent = "This purchase can’t be used (refunded/chargeback/disputed).";
      return;
    }

    localStorage.setItem(PAID_KEY, plan || "paid");
    statusEl.textContent = "Unlocked. Redirecting…";
    window.location.href = "/app.html";
  } catch (e) {
    statusEl.textContent = "Could not verify. Try again.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const unlockBtn = $("unlockToggle");
  const panel = $("unlockPanel");

  unlockBtn?.addEventListener("click", () => {
    panel?.classList.toggle("show");
    $("licenseKey")?.focus();
  });

  $("verifyMonthly")?.addEventListener("click", () => verifyLicense("monthly"));
  $("verifyLifetime")?.addEventListener("click", () => verifyLicense("lifetime"));
});
