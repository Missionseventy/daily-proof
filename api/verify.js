// api/verify.js
// Vercel Serverless Function: verifies Gumroad purchase/subscription (Option C)

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { plan, email, license_key } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
    const monthlyPermalink = process.env.GUMROAD_MONTHLY_PERMALINK;   // citlrs
    const lifetimePermalink = process.env.GUMROAD_LIFETIME_PERMALINK; // nscnb

    if (!accessToken || !monthlyPermalink || !lifetimePermalink) {
      return res.status(500).json({ error: "Server not configured (missing env vars)" });
    }

    // --- Helper: call Gumroad API ---
    async function gumroadGET(url) {
      const r = await fetch(url, { method: "GET" });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, json: j };
    }

    async function gumroadPOST(url, form) {
      const body = new URLSearchParams(form);
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, json: j };
    }

    // --- 1) LIFETIME: verify license key (strongest) ---
    async function verifyLifetime() {
      const key = String(license_key || "").trim();
      if (!key) return { lifetime: false };

      // Gumroad license verification endpoint (POST)
      // We include email too (extra check).
      const out = await gumroadPOST("https://api.gumroad.com/v2/licenses/verify", {
        product_permalink: lifetimePermalink,
        license_key: key,
        email: cleanEmail,
      });

      // Expected: { success: true, purchase: {...} } when valid.
      if (out.ok && out.json && out.json.success === true) {
        return { lifetime: true };
      }

      return { lifetime: false };
    }

    // --- 2) MONTHLY: verify active membership by checking Sales for that email ---
    // This is “good enough to ship” without Gumroad redirect.
    // If you later want stricter “active subscription” checks, we can upgrade it.
    async function verifyMonthly() {
      // Sales endpoint returns purchases; for memberships it should still record the transaction.
      // We check if there is at least one sale for this product + email.
      const url =
        `https://api.gumroad.com/v2/sales` +
        `?access_token=${encodeURIComponent(accessToken)}` +
        `&product_permalink=${encodeURIComponent(monthlyPermalink)}` +
        `&email=${encodeURIComponent(cleanEmail)}`;

      const out = await gumroadGET(url);

      // Common response shape: { success: true, sales: [...] }
      if (out.ok && out.json && out.json.success === true) {
        const sales = Array.isArray(out.json.sales) ? out.json.sales : [];
        if (sales.length > 0) {
          return { monthlyActive: true };
        }
      }

      return { monthlyActive: false };
    }

    let lifetime = false;
    let monthlyActive = false;

    if (plan === "lifetime") {
      const r = await verifyLifetime();
      lifetime = !!r.lifetime;
    } else if (plan === "monthly") {
      const r = await verifyMonthly();
      monthlyActive = !!r.monthlyActive;
    } else {
      // Allow a "both" check if you want later, but keep strict now.
      return res.status(400).json({ error: "plan must be 'monthly' or 'lifetime'" });
    }

    return res.status(200).json({
      ok: true,
      plan,
      lifetime,
      monthlyActive,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
