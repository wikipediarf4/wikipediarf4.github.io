// VibeChat Service Worker
// Estrategia: Cache First para assets estáticos, Network First para Firebase/API

const CACHE_NAME = 'vibechat-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

// Assets que se cachean en la instalación (shell de la app)
const APP_SHELL = [
  './index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap',
];

// Dominios que NUNCA se cachean (siempre van a la red)
const NETWORK_ONLY = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseapp.com',
  'googleapis.com/identitytoolkit',
];

// ── INSTALL: cachear el app shell ─────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Error cacheando app shell:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés viejas ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia inteligente ─────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Chrome extensions y requests no-http → ignorar
  if (!event.request.url.startsWith('http')) return;

  // 2. Firebase / APIs → siempre Network (nunca cachear datos en tiempo real)
  if (NETWORK_ONLY.some(domain => url.hostname.includes(domain))) {
    return; // deja que el browser lo maneje normalmente
  }

  // 3. POST / PUT / DELETE → nunca cachear
  if (event.request.method !== 'GET') return;

  // 4. Google Fonts CSS → Cache First con revalidación
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 5. Módulos Firebase JS (gstatic) → Cache First (son versionados, no cambian)
  if (url.hostname === 'www.gstatic.com') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 6. DiceBear avatars y CDNs de imágenes → Cache First
  if (url.hostname.includes('dicebear.com') || url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 7. El propio index.html → Network First (siempre tenés la última versión)
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 8. Todo lo demás → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// ── ESTRATEGIAS DE CACHÉ ──────────────────────────

// Cache First: busca en caché, si no está va a la red y cachea
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

// Network First: intenta la red, si falla usa caché
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

// Stale While Revalidate: responde con caché inmediatamente,
// actualiza en segundo plano (como TikTok/Instagram)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}
