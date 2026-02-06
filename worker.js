/* worker.js */

const CACHE_NAME = "daily-proof-cache-v3";

// Cache only static assets (safe)
const STATIC_ASSET_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".json"
];

self.addEventListener("install", (event) => {
  // Activate new SW immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Take control immediately
    await self.clients.claim();

    // Clean old caches
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
  })());
});

function isStaticAsset(url) {
  return STATIC_ASSET_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ✅ 1) NEVER intercept API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  // ✅ 2) Only cache GET requests
  if (req.method !== "GET") {
    event.respondWith(fetch(req));
    return;
  }

  // ✅ 3) Cache-first for static assets, network-first for HTML/pages
  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Network-first for pages (so you don't get stuck on old login shells)
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      return res;
    } catch (err) {
      // fallback (best-effort)
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
