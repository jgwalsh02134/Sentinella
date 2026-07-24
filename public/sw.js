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
// v10: guide became list→detail routes — precache every /guide/* page AND
// the hashed JS/CSS chunks referenced by precached pages, so a page first
// opened offline still hydrates (search, phrase Show mode, disclosures).
const VERSION = "sentinella-v11";
const PRECACHE = [
  "/",
  "/emergency",
  "/guide",
  "/guide/basics",
  "/guide/scams",
  "/guide/phrases",
  "/guide/cities",
  "/guide/health",
  "/map",
  "/prepare",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/crest-ui.png",
  "/brand/us-state-seal.svg",
];

/**
 * Interactivity offline: precached HTML references hashed /_next/static
 * chunks; without them a precached page renders but never hydrates. Parse
 * each precached page for chunk URLs and cache those too. Individual
 * fetch failures are tolerated — a missed chunk degrades interactivity,
 * never the install.
 */
async function precachePageChunks(cache) {
  const pages = PRECACHE.filter((p) => !p.includes("."));
  const urls = new Set();
  for (const page of pages) {
    const cached = await cache.match(page);
    if (!cached) continue;
    const html = await cached.clone().text();
    for (const match of html.matchAll(/\/_next\/static\/[^"'\\ ]+/g)) {
      urls.add(match[0].replace(/&amp;/g, "&"));
    }
  }
  await Promise.all(
    Array.from(urls).map(async (u) => {
      if (await cache.match(u)) return;
      try {
        const response = await fetch(u);
        if (response.ok) await cache.put(u, response);
      } catch {
        // Offline mid-install or a stale reference — skip this chunk.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE).then(() => precachePageChunks(cache)))
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

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON payloads fall through to the generic notification.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Sentinella", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).pathname === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/map-packs/") || request.headers.has("range")) return;

  // /map shell: cache-first with background refresh. The map must open
  // deterministically offline; a stale shell is refreshed for next time.
  if (request.mode === "navigate" && url.pathname === "/map") {
    event.respondWith(
      caches.match("/map").then((cached) => {
        const refresh = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put("/map", copy));
            return response;
          })
          .catch(() => cached || caches.match("/offline"));
        return cached || refresh;
      }),
    );
    return;
  }

  // Other navigations: fresh when possible, cached when not, /offline last.
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
    url.pathname.startsWith("/map-fonts/") ||
    url.pathname.startsWith("/map-sprites/")
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
