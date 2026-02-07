// api/verify.js
import crypto from "crypto";
import { kv } from "@vercel/kv";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function safeCompare(a = "", b = "") {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export default async function handler(req, res) {
  // ✅ GET = simple test from browser
  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      message: "verify endpoint live (GET works)",
      hasKV: !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN,
      hasSecret: !!process.env.WEBHOOK_SECRET,
    });
  }

  // ✅ POST = Gumroad webhook (or manual curl)
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const secret = process.env.WEBHOOK_SECRET || "";
  if (!secret) {
    return json(res, 500, { ok: false, error: "Missing WEBHOOK_SECRET" });
  }

  // We support either header style:
  // - x-webhook-secret: <secret> (simple)
  // - x-signature: hmac_sha256(rawBody, secret) (stronger)
  const headerSecret = req.headers["x-webhook-secret"];
  const signature = req.headers["x-signature"];

  const raw = await getRawBody(req);

  // If x-signature is present, verify HMAC
  if (signature) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");

    if (!safeCompare(signature, expected)) {
      return json(res, 401, { ok: false, error: "Invalid signature" });
    }
  } else {
    // Otherwise fall back to simple shared-secret header
    if (!safeCompare(headerSecret, secret)) {
      return json(res, 401, { ok: false, error: "Invalid webhook secret" });
    }
  }

  // Parse payload
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return json(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  // Minimal data we store (privacy-first):
  // store only purchase proof tokens / emails hash if you want later
  const email = (payload.email || "").trim().toLowerCase();
  const productId = payload.product_id || payload.product_permalink || "unknown";
  const saleId = payload.sale_id || payload.order_id || crypto.randomUUID();

  // You can decide what your "proof key" is.
  // For now: allow "email + productId"
  const key = email ? `proof:${productId}:${email}` : `proof:${productId}:${saleId}`;

  // Store a tiny record
  const record = {
    ok: true,
    productId,
    saleId,
    createdAt: new Date().toISOString(),
  };

  await kv.set(key, record);

  return json(res, 200, { ok: true, stored: true, key });
}
