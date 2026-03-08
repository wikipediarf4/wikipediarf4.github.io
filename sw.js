// RF4 Social — Service Worker
// Maneja cache, actualizaciones y rutas SPA correctamente
const CACHE_NAME = 'rf4social-v4';
const BASE = '/chatrf4';

// Solo cachear lo que existe seguro
const PRECACHE = [
  BASE + '/index.html',
];

// ── Instalación ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll con manejo de errores — si algo falla no rompe todo
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('SW: no se pudo cachear', url, err))
        )
      )
    )
  );
});

// ── Activación ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Mensaje desde la página (botón Actualizar) ───────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: estrategia SPA ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo interceptar peticiones al mismo origen
  if (url.origin !== location.origin) return;

  // Para navegación (HTML): siempre red primero, cache como fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(BASE + '/index.html')
        .catch(() => caches.match(BASE + '/index.html'))
    );
    return;
  }

  // Para el resto: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
