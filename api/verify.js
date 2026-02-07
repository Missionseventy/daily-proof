// api/verify.js
export default async function handler(req, res) {
  // --- CORS (safe defaults) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Allow BOTH GET (browser testing) and POST (app)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Read inputs from GET query or POST body
    const email =
      (req.method === "GET" ? req.query.email : req.body?.email) || "";
    const plan =
      (req.method === "GET" ? req.query.plan : req.body?.plan) || "monthly";

    const cleanedEmail = String(email).trim().toLowerCase();
    const cleanedPlan = String(plan).trim().toLowerCase();

    if (!cleanedEmail) {
      return res.status(400).json({ ok: false, error: "Missing email" });
    }

    // ENV VARS (set these in Vercel Project Settings → Environment Variables)
    const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
    const monthlyPermalink = process.env.GUMROAD_MONTHLY_PERMALINK;
    const lifetimePermalink = process.env.GUMROAD_LIFETIME_PERMALINK;

    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error:
          "Missing GUMROAD_ACCESS_TOKEN in Vercel env. Add it then redeploy.",
      });
    }

    const permalink =
      cleanedPlan === "lifetime" ? lifetimePermalink : monthlyPermalink;

    if (!permalink) {
      return res.status(500).json({
        ok: false,
        error:
          cleanedPlan === "lifetime"
            ? "Missing GUMROAD_LIFETIME_PERMALINK in Vercel env."
            : "Missing GUMROAD_MONTHLY_PERMALINK in Vercel env.",
      });
    }

    // Gumroad Sales API — verifies whether this email bought the product
    const url = new URL("https://api.gumroad.com/v2/sales");
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("product_permalink", permalink);
    url.searchParams.set("email", cleanedEmail);

    const r = await fetch(url.toString(), { method: "GET" });
    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({
        ok: false,
        error: "Gumroad API error",
        status: r.status,
        gumroad: data,
      });
    }

    // Gumroad returns { success: true, sales: [...] }
    const hasPurchase = Boolean(data?.success && Array.isArray(data?.sales) && data.sales.length > 0);

    return res.status(200).json({
      ok: true,
      email: cleanedEmail,
      plan: cleanedPlan,
      access: hasPurchase,
      // optional debug count (helps you confirm matching)
      matchedSales: Array.isArray(data?.sales) ? data.sales.length : 0,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Server error",
      message: e?.message || String(e),
    });
  }
}
