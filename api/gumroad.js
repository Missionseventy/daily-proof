// /api/gumroad.js
import crypto from "crypto";

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function kvSet(key, value, ttlSeconds = null) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Missing KV env vars");

  const setUrl = `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(
    value
  )}${ttlSeconds ? `?ex=${ttlSeconds}` : ""}`;

  const r = await fetch(setUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`KV set failed: ${t}`);
  }
}

function parseFormUrlEncoded(bodyText) {
  const params = new URLSearchParams(bodyText);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Gumroad Ping is POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Simple protection: secret in URL (since Gumroad can’t send custom headers)
  const secret = (req.query.secret || "").toString();
  if (!process.env.WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing WEBHOOK_SECRET env var" });
  }
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Gumroad usually sends x-www-form-urlencoded
  const raw = typeof req.body === "string" ? req.body : null;

  let payload = null;

  if (raw) {
    payload = parseFormUrlEncoded(raw);
  } else if (req.headers["content-type"]?.includes("application/json")) {
    payload = req.body;
  } else {
    // Vercel may parse form body into an object already
    payload = req.body || {};
  }

  const email = (payload.email || "").toString().trim().toLowerCase();
  const productName = (payload.product_name || "").toString().trim();
  const cancelled = (payload.cancelled || "").toString() === "true";
  const refunded = (payload.refunded || "").toString() === "true";

  if (!email) return res.status(400).json({ error: "Missing email" });

  // Decide plan based on your Gumroad products (edit these names to match your exact Gumroad product titles)
  // You can also switch to payload.product_permalink or product_id if you want.
  const isLifetime = /lifetime/i.test(productName);
  const isMonthly = /monthly/i.test(productName);

  const emailHash = sha256(email);

  // If cancelled/refunded → remove access by letting TTL expire for monthly; for lifetime you can just overwrite to "0"
  // We'll keep it simple:
  if (refunded || cancelled) {
    // For monthly, just set a short TTL. For lifetime, clear.
    if (isMonthly) {
      await kvSet(`access:monthly:${emailHash}`, "0", 60); // expires quickly
    }
    if (isLifetime) {
      await kvSet(`access:lifetime:${emailHash}`, "0", 60);
    }

    return res.status(200).json({ ok: true, action: "revoked", emailHash });
  }

  // Grant access
  if (isLifetime) {
    await kvSet(`access:lifetime:${emailHash}`, "1"); // no TTL
    return res.status(200).json({ ok: true, action: "granted", plan: "lifetime", emailHash });
  }

  if (isMonthly) {
    // 35 days TTL to cover billing cycles + delays
    await kvSet(`access:monthly:${emailHash}`, "1", 35 * 24 * 60 * 60);
    return res.status(200).json({ ok: true, action: "granted", plan: "monthly", emailHash });
  }

  // If product name doesn't match, still store generic access:
  await kvSet(`access:monthly:${emailHash}`, "1", 35 * 24 * 60 * 60);
  return res.status(200).json({ ok: true, action: "granted", plan: "monthly(default)", emailHash });
}
