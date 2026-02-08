export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: "Missing GUMROAD_ACCESS_TOKEN" });
  }

  const { plan, email, license_key } = req.body || {};
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!plan || !cleanEmail) {
    return res.status(400).json({ ok: false, error: "Missing plan or email" });
  }

  try {
    if (plan === "monthly") {
      const productPermalink = "citlrs";
      const url =
        `https://api.gumroad.com/v2/sales?access_token=${encodeURIComponent(token)}` +
        `&product_permalink=${encodeURIComponent(productPermalink)}`;

      const r = await fetch(url);
      const data = await r.json();

      if (!data?.success) {
        return res.status(200).json({ ok: false, error: "Could not verify monthly purchase." });
      }

      const found = (data.sales || []).some(s => {
        const saleEmail = String(s.email || "").trim().toLowerCase();
        return saleEmail === cleanEmail && !s.refunded;
      });

      if (!found) {
        return res.status(200).json({ ok: false, error: "No active monthly purchase found for that email." });
      }

      return res.status(200).json({ ok: true });
    }

    if (plan === "lifetime") {
      const productPermalink = "nscnb";
      const key = String(license_key || "").trim();
      if (!key) return res.status(400).json({ ok: false, error: "Missing license key" });

      const verifyRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          product_permalink: productPermalink,
          license_key: key
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyData?.success || !verifyData?.purchase) {
        return res.status(200).json({ ok: false, error: "Invalid license key." });
      }

      const purchaseEmail = String(verifyData.purchase.email || "").trim().toLowerCase();
      if (purchaseEmail && purchaseEmail !== cleanEmail) {
        return res.status(200).json({ ok: false, error: "Email does not match the purchase email." });
      }

      if (verifyData.purchase.refunded) {
        return res.status(200).json({ ok: false, error: "Purchase was refunded." });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "Invalid plan" });
  } catch (e) {
    return res.status(200).json({ ok: false, error: "Network error verifying purchase." });
  }
}



