/**
 * Sentinella service worker.
 *
 * Strategy:
 *  - Precache the safety-critical routes so Emergency and the Guide open
 *    with no connection.
 *  - Navigations: network-first, falling back to cache, then /offline.
 *  - Static assets (/_next/static, /icons, /map-fonts): cache-first (immutable).
 *  - API requests are never cached — stale safety data is worse than none.
 *  - Offline map packs (/map-packs) are never cached here: they are multi-MB
 *    files managed in IndexedDB by the Map screen, and their online mode uses
 *    HTTP range requests the Cache API can't store.
 */
// v3: crest rebrand — new icon artwork and the in-app crest rendition.
const VERSION = "sentinella-v3";
const PRECACHE = [
  "/",
  "/emergency",
  "/guide",
  "/map",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/crest-ui.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/map-packs/") || request.headers.has("range")) return;

  // Navigations: fresh when possible, cached when not, /offline as last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(url.pathname))
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
    return;
  }

  // Hashed build assets, icons, and map glyphs: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/map-fonts/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else: network with cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
