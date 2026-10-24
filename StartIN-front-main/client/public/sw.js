const CACHE_NAME = "startin-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/favicon.svg",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
  "/icons/icon-maskable.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Requisições de API (/api) vão sempre primeiro para a rede (Backend Spring Boot + MySQL)
  if (url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request));
    return;
  }

  // Apenas GET é cacheado pelo Service Worker
  if (request.method !== "GET") {
    return;
  }

  // Estratégia Network-First com fallback para Cache nas navegações e assets
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        })
      )
  );
});
