// /api/verify.js
import crypto from "crypto";

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!r.ok) return null;
  const data = await r.json();
  return data?.result ?? null;
}

export default async function handler(req, res) {
  // CORS + no-cache (important so it doesn't “stick”)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "OPTIONS") return res.status(204).end();

  // ✅ This fixes your browser test: GET should work
  if (req.method === "GET" && !req.query.email) {
    return res.status(200).json({
      ok: true,
      message: "verify endpoint live (GET works)",
    });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email =
    req.method === "GET"
      ? (req.query.email || "").toString().trim().toLowerCase()
      : (req.body?.email || "").toString().trim().toLowerCase();

  if (!email) return res.status(400).json({ error: "Missing email" });

  const emailHash = sha256(email);

  // Keys written by Gumroad Ping webhook (Option C)
  const lifetimeKey = `access:lifetime:${emailHash}`;
  const monthlyKey = `access:monthly:${emailHash}`;

  const lifetime = await kvGet(lifetimeKey);
  const monthly = await kvGet(monthlyKey);

  return res.status(200).json({
    ok: true,
    emailHash,
    access: Boolean(lifetime || monthly),
    plan: lifetime ? "lifetime" : monthly ? "monthly" : null,
  });
}
