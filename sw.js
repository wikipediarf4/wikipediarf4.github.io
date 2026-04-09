// ══════════════════════════════════════════
//  CLIPUY — Service Worker
//  Estrategia: Cache-first para assets,
//  Network-first para el feed/API,
//  Offline fallback para el resto.
// ══════════════════════════════════════════

const VERSION = 'clipuy-v1';

// Assets que se cachean al instalar (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Fuentes de Google (si las servís localmente en el futuro)
];

// Prefijos de URL que NO se cachean nunca (API dinámica)
const NEVER_CACHE = [
  '/audio/stream/',   // streams de audio
  '/upload',          // subidas
];

// Cache de feeds (Network-first, fallback a cache)
const FEED_CACHE = 'clipuy-feed-v1';

// Cache de assets estáticos (Cache-first)
const STATIC_CACHE = 'clipuy-static-v1';

// ── INSTALL: precachear app shell ──────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Si algún asset falla (ej: íconos no existen aún), no bloquear install
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos ───────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== FEED_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de request ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET
  if (request.method !== 'GET') return;

  // Nunca cachear streams de audio ni uploads
  if (NEVER_CACHE.some((p) => url.pathname.includes(p))) return;

  // ── API del feed (clips, stories, perfil) → Network-first ──
  if (isFeedRequest(url)) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // ── Assets estáticos → Cache-first ──
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── HTML principal → Network-first con fallback offline ──
  if (request.destination === 'document') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
});

// ───────────────────────────────────────────
//  ESTRATEGIAS
// ───────────────────────────────────────────

// Network-first: intenta red, si falla usa cache
async function networkFirstWithFallback(request) {
  const cache = await caches.open(FEED_CACHE);
  try {
    const networkRes = await fetchWithTimeout(request, 5000);
    if (networkRes.ok) {
      // Solo cachear respuestas JSON del feed (no binarios)
      const contentType = networkRes.headers.get('content-type') || '';
      if (contentType.includes('json') || request.destination === 'document') {
        cache.put(request, networkRes.clone());
      }
    }
    return networkRes;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback final: página offline
    return offlinePage();
  }
}

// Cache-first: sirve desde cache, si no está va a red y guarda
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) cache.put(request, networkRes.clone());
    return networkRes;
  } catch {
    return new Response('', { status: 503 });
  }
}

// Fetch con timeout
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then((res) => {
      clearTimeout(timer);
      resolve(res);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Página offline minimalista
function offlinePage() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Clipuy — Sin conexión</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;color:#fff;font-family:'Space Grotesk',sans-serif;
       display:flex;align-items:center;justify-content:center;
       height:100vh;text-align:center;padding:24px;}
  h1{font-size:2rem;margin-bottom:8px;
     background:linear-gradient(135deg,#fff,#25f4ee,#fe2c55);
     -webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  p{color:#888;font-size:.9rem;margin-bottom:24px;line-height:1.5;}
  button{background:linear-gradient(135deg,#25f4ee,#fe2c55);
         border:none;border-radius:10px;padding:12px 28px;
         color:#fff;font-size:.95rem;font-weight:700;cursor:pointer;}
</style>
</head>
<body>
  <div>
    <div style="font-size:3rem;margin-bottom:16px">📵</div>
    <h1>Clipuy</h1>
    <p>Estás sin conexión.<br>Revisá tu internet y volvé a intentarlo.</p>
    <button onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ───────────────────────────────────────────
//  HELPERS
// ───────────────────────────────────────────

function isFeedRequest(url) {
  // Rutas de tu API backend
  const feedPaths = ['/clips', '/feed', '/stories', '/profile', '/users', '/audio/list'];
  return feedPaths.some((p) => url.pathname.startsWith(p));
}

function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?|ico)$/) !== null
  );
}

// ── BACKGROUND SYNC: reintentar likes/follows offline ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'clipuy-pending-actions') {
    event.waitUntil(flushPendingActions());
  }
});

async function flushPendingActions() {
  // Lee acciones pendientes desde IndexedDB (likes, follows, etc.)
  // guardadas cuando estaba offline y las reenvía
  try {
    const db = await openActionsDB();
    const actions = await getAllActions(db);
    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });
        await deleteAction(db, action.id);
      } catch {
        // Si falla, queda para el próximo sync
      }
    }
  } catch {
    // IndexedDB no disponible
  }
}

// Mini IndexedDB helper para acciones pendientes
function openActionsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('clipuy-actions', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getAllActions(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('actions', 'readonly');
    const req = tx.objectStore('actions').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function deleteAction(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('actions', 'readwrite');
    tx.objectStore('actions').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
