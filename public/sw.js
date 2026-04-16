const CACHE_NAME = "ai-chat-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

/* =========================
   FETCH STRATEGY (FIXED)
========================= */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 1. HTML navigation → network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 2. Static assets → cache first
  if (
    request.url.includes(".css") ||
    request.url.includes(".js") ||
    request.url.includes(".png") ||
    request.url.includes(".jpg") ||
    request.url.includes(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }

  // 3. Default → network first fallback to cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        return res;
      })
      .catch(() => caches.match(request))
  );
});