const CACHE = "reiki-timer-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./js/app.js",
  "./js/i18n.js",
  "./js/positions.js",
  "./js/audio.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache instantly, refresh in the background.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Voice clips are immutable — once cached, skip the background refetch.
      if (cached && e.request.url.includes("/audio/voice/")) return cached;
      // no-cache: revalidate with the server instead of trusting the
      // 10-minute HTTP cache GitHub Pages sets, so updates land on next load.
      const fresh = fetch(e.request, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
