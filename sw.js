const CACHE_RESET_VERSION = "doctor-woyz-browser-only-cache-reset-2026-09-12";

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.map(name => caches.delete(name))))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.navigate(client.url);
      }
    } catch (error) {
      console.warn(`${CACHE_RESET_VERSION}: cache reset skipped`, error);
    }
  })());
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
