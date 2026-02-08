// /api/verify.js
// Vercel Serverless Function
// Verifies Gumroad license keys using Gumroad's public verify endpoint.

export default async function handler(req, res) {
  // Allow POST only (clean + avoids logging keys in URLs)
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { license_key, plan } = req.body || {};
    const key = String(license_key || "").trim();

    if (!key) {
      return res.status(400).json({ ok: false, message: "Missing license key" });
    }

    const monthlyId = process.env.GUMROAD_PRODUCT_ID_MONTHLY;
    const lifetimeId = process.env.GUMROAD_PRODUCT_ID_LIFETIME;

    // Decide which product_id to verify against
    let productId = "";
    if (plan === "lifetime") productId = lifetimeId;
    else if (plan === "monthly") productId = monthlyId;
    else productId = monthlyId || lifetimeId; // fallback if plan not passed

    if (!productId) {
      return res.status(500).json({
        ok: false,
        message: "Server missing product_id env vars",
      });
    }

    const body = new URLSearchParams();
    body.append("product_id", productId);
    body.append("license_key", key);
    // IMPORTANT:
    // We do NOT increment uses count (privacy-first, fewer false lockouts)
    body.append("increment_uses_count", "false");

    const resp = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(200).json({
        ok: false,
        message: data?.message || "Verification failed",
      });
    }

    if (!data?.success) {
      return res.status(200).json({
        ok: false,
        message: data?.message || "Invalid license key",
      });
    }

    // If valid
    return res.status(200).json({
      ok: true,
      plan: plan || "paid",
      purchase: {
        refunded: !!data?.purchase?.refunded,
        chargebacked: !!data?.purchase?.chargebacked,
        disputed: !!data?.purchase?.disputed,
        test: !!data?.purchase?.test,
        email: data?.purchase?.email || null,
      },
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      message: "Server error verifying license",
    });
  }
}


