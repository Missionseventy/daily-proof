export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    if (url.pathname === "/api/verify" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = (body.email || "").trim().toLowerCase();
        const licenseKey = (body.licenseKey || "").trim();
        const plan = (body.plan || "").trim(); // "monthly" | "lifetime"

        if (!email) return json({ ok: false, error: "Email is required." }, 400, request);

        // Verify against Gumroad
        // Lifetime: use license verification if provided
        // Monthly: verify active subscriber by email (license key optional)

        let verified = false;

        if (plan === "lifetime") {
          if (!licenseKey) return json({ ok: false, error: "License key required for lifetime." }, 400, request);
          verified = await verifyLicenseWithGumroad(env, licenseKey);
        } else if (plan === "monthly") {
          verified = await verifyMonthlySubscriberWithGumroad(env, email);
        } else {
          return json({ ok: false, error: "Invalid plan." }, 400, request);
        }

        if (!verified) {
          return json(
            { ok: false, error: "Could not verify purchase. Double-check email/license and try again." },
            403,
            request
          );
        }

        // Issue simple signed token (HMAC) - no JWT lib needed
        const token = await issueToken(env, { email, plan });

        // Optional: store minimal record in KV (privacy-first)
        await env.DP_ACCESS.put(`access:${email}`, JSON.stringify({ plan, updatedAt: new Date().toISOString() }), {
          expirationTtl: 60 * 60 * 24 * 365 * 2, // 2 years
        });

        return json({ ok: true, token, plan }, 200, request);
      } catch (e) {
        return json({ ok: false, error: "Server error." }, 500, request);
      }
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "") || "";
      const ok = await verifyToken(env, token);
      return json({ ok }, 200, request);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(request) });
  },
};

// ---------------- Helpers ----------------

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

// Gumroad license verification (works great for Lifetime product)
async function verifyLicenseWithGumroad(env, licenseKey) {
  // Gumroad license verify endpoint:
  // https://api.gumroad.com/v2/licenses/verify
  // form params: product_permalink (optional), license_key
  const form = new URLSearchParams();
  form.set("access_token", env.GUMROAD_ACCESS_TOKEN);
  form.set("license_key", licenseKey);

  // If you want to lock to only your lifetime product, add permalink:
  // form.set("product_permalink", env.GUMROAD_LIFETIME_PERMALINK);

  const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return !!data.success;
}

// Monthly subscription verification by email (membership)
async function verifyMonthlySubscriberWithGumroad(env, email) {
  // Gumroad subscribers endpoint:
  // https://api.gumroad.com/v2/subscribers
  // This returns pages. We'll search a few pages for matching email.
  // NOTE: Depending on your Gumroad settings, this might be "subscribers" or membership endpoints.
  // If this fails, we fallback to "sales" search by email.
  const base = "https://api.gumroad.com/v2/subscribers";
  let page = 1;

  for (let i = 0; i < 5; i++) {
    const url = `${base}?access_token=${encodeURIComponent(env.GUMROAD_ACCESS_TOKEN)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) break;

    const data = await res.json();
    const subs = data.subscribers || [];

    const hit = subs.find((s) => (s.email || "").toLowerCase() === email);
    if (hit) {
      // If Gumroad indicates cancellation/ended, check those flags if present.
      // Many accounts expose "cancelled" or "ended_at".
      if (hit.cancelled === true) return false;
      return true;
    }

    if (!data.next_page_url) break;
    page += 1;
  }

  // Fallback: check sales list for email (not perfect but works as backup)
  return await verifyAnySaleByEmail(env, email);
}

async function verifyAnySaleByEmail(env, email) {
  const url = `https://api.gumroad.com/v2/sales?access_token=${encodeURIComponent(env.GUMROAD_ACCESS_TOKEN)}`;
  const res = await fetch(url);
  if (!res.ok) return false;

  const data = await res.json();
  const sales = data.sales || [];
  return sales.some((s) => (s.email || "").toLowerCase() === email);
}

// Token issuing (HMAC)
async function issueToken(env, payload) {
  const msg = JSON.stringify({ ...payload, iat: Date.now() });
  const sig = await hmac(env.DP_HMAC_SECRET, msg);
  return btoa(msg) + "." + sig;
}

async function verifyToken(env, token) {
  try {
    const [msgB64, sig] = token.split(".");
    if (!msgB64 || !sig) return false;
    const msg = atob(msgB64);
    const expected = await hmac(env.DP_HMAC_SECRET, msg);
    return sig === expected;
  } catch {
    return false;
  }
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
