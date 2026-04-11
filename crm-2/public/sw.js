/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SAI RoloTech Service Worker v2.0
   Strategy: Network-first for pages, Cache-first for assets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const VERSION = "sai-v2.0";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const MAX_RUNTIME_ENTRIES = 60;
const OFFLINE_PAGE = "/offline.html";

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.svg",
  "/product-catalog.json",
];

// ── Install ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try { await cache.addAll(PRECACHE); } catch (e) { console.warn("[SW] Precache partial fail:", e); }
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, API calls, browser extensions
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (!url.protocol.startsWith("http")) return;

  // Navigation requests → SPA fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Static assets (fonts, images, CSS, JS) → cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else → network-first with runtime cache
  event.respondWith(networkFirst(request));
});

// ── Strategies ────────────────────────────

async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request, { credentials: "same-origin" });
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
      // Update last-online timestamp for offline page
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: "ONLINE" }))
      );
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return the offline page
    const offline = await caches.match(OFFLINE_PAGE);
    if (offline) return offline;
    return new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 404 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await limitCacheSize(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503 });
  }
}

// ── Helpers ──────────────────────────────

function isStaticAsset(url) {
  return (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com" ||
    /\.(woff2?|ttf|eot|ico|svg|png|jpg|webp|gif|css|js)(\?.*)?$/.test(url.pathname)
  );
}

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
  }
}

// ── Message handler ──────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
});
