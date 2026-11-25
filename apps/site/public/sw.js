// Migration shim for the old Studio service worker that lived at /slotforge/.
// It clears the old cache, unregisters itself and reloads open clients, so the
// landing page is not served from a stale app shell.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch {
          // Cross-origin or detached clients are fine to skip.
        }
      }
    })(),
  );
});
