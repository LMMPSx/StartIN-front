const CACHE_NAME = "startin-pwa-v3";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/rocket-icon.png",
  "/icons/apple-touch-icon.png",
  "/icons/pwa-rocket-192.png",
  "/icons/pwa-rocket-512.png",
  "/icons/pwa-rocket-maskable.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url))))
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

  // Requisicoes de API (/api) vao sempre direto para a rede (Backend Spring Boot + MySQL)
  if (url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request));
    return;
  }

  // Apenas GET e cacheado pelo Service Worker
  if (request.method !== "GET") {
    return;
  }

  // Estrategia Network-First com fallback para Cache nas navegacoes e assets
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
