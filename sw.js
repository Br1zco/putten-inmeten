// ─── Versie: verhoog dit getal bij elke nieuwe deploy ───────────────────────
const VERSIE = 'putten-v1';

// Basis-URL werkt automatisch op elke GitHub Pages submap
const BASE = new URL('./', self.location).href;

// Bestanden die direct bij installatie gecacht worden
const KERN_BESTANDEN = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
];

// ─── Installatie: cache de kernbestanden ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSIE)
      .then(cache => cache.addAll(KERN_BESTANDEN))
      .then(() => self.skipWaiting()) // direct actief worden, geen wacht
  );
});

// ─── Activatie: verwijder oude caches (= automatische update voor gebruikers)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(sleutels =>
        Promise.all(
          sleutels
            .filter(sleutel => sleutel !== VERSIE)
            .map(sleutel => caches.delete(sleutel))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first strategie ────────────────────────────────────────────
self.addEventListener('fetch', event => {
  // Alleen GET-verzoeken cachen, geen cross-origin (camera, etc.)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(gecacht => {
      if (gecacht) return gecacht;

      // Niet in cache: haal op van netwerk en sla op
      return fetch(event.request).then(response => {
        if (response.ok) {
          const kopie = response.clone();
          caches.open(VERSIE).then(cache => cache.put(event.request, kopie));
        }
        return response;
      });
    })
  );
});
