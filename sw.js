// Service Worker para Natural Be - v2026-02-16
const CACHE_NAME = 'natural-be-v2026-02-16';
const STATIC_CACHE = 'natural-be-static-v2026-02-16';
const RUNTIME_CACHE = 'natural-be-runtime-v2026-02-16';
const OFFLINE_FALLBACK = '/index.html';

// Recursos estáticos críticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/category.html',
  '/product.html',
  '/static/css/main.min.css',
  '/static/js/cart.min.js',
  '/static/js/search-engine.js',
  '/static/js/webp-support.js',
  '/static/js/tracking.js',
  '/static/img/logo.webp',
  '/static/img/placeholder.webp',
  '/static/img/og-naturalbe.jpg',
  '/static/img/og-naturalbe.webp',
  '/static/img/favicon.ico',
  '/static/img/favicon-32x32.png',
  '/static/img/favicon-16x16.png',
  '/static/img/android-chrome-192x192.png',
  '/static/img/apple-touch-icon.png'
];

// Recursos de red que pueden cachearse
const NETWORK_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /^https:\/\/cdn\.jsdelivr\.net/,
  /^https:\/\/naturalbe\.com\.co\/static\/data\/productos\.json/,
  /^https:\/\/www\.googletagmanager\.com/,
  /^https:\/\/connect\.facebook\.net/,
  /^https:\/\/www\.facebook\.com/,
  /^https:\/\/wa\.me/
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => precacheAssets(cache, STATIC_ASSETS))
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Estrategia de caché: Stale-While-Revalidate para recursos estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar esquemas no soportados por SW
  if (!['http:', 'https:'].includes(url.protocol)) {
    return;
  }

  // No interceptar extensiones del navegador ni GTM preview
  if (url.pathname.startsWith('/chrome-extension/') || url.searchParams.has('gtm_debug')) {
    return;
  }
  
  // Estrategia para recursos estáticos
  if (STATIC_ASSETS.includes(url.pathname) || 
      url.pathname.startsWith('/static/css/') || 
      url.pathname.startsWith('/static/js/') ||
      url.pathname.startsWith('/static/img/')) {
    
    event.respondWith(
      caches.open(STATIC_CACHE)
        .then((cache) => {
          const cacheLookupOptions = { ignoreSearch: true };
          return cache.match(request, cacheLookupOptions)
            .then((response) => {
              if (response) {
                // Devolver del caché y actualizar en background
                fetchAndCache(request, cache);
                return response;
              }
              
              // No está en caché, obtener de red
              return fetchAndCache(request, cache);
            });
        })
    );
    return;
  }
  
  // Estrategia para datos de productos (Network First)
  if (url.pathname.includes('productos.json')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                // Actualizar caché con respuesta fresca
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Si falla la red, intentar con caché
              return cache.match(request);
            });
        })
    );
    return;
  }
  
  // Estrategia para recursos externos (fonts, analytics)
  if (NETWORK_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              
              return fetch(request)
                .then((response) => {
                  if (response.ok) {
                    cache.put(request, response.clone());
                  }
                  return response;
                })
                .catch((error) => {
                  // Silenciar errores de CSP en fetch (ej: Google Fonts)
                  // Intentar retornar del caché o una respuesta vacía
                  return cache.match(request) || new Response('', { status: 503 });
                });
            });
        })
    );
    return;
  }
});

// Función helper para fetch y caché
function fetchAndCache(request, cache) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.error('[SW] Fetch failed:', error);
      return cache.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_FALLBACK);
        }
        return Response.error();
      });
    });
}

async function precacheAssets(cache, assets) {
  console.log('[SW] Caching static assets');
  const jobs = assets.map(async (asset) => {
    try {
      const req = new Request(asset, { cache: 'no-cache' });
      const res = await fetch(req);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await cache.put(asset, res.clone());
      return { asset, ok: true };
    } catch (error) {
      console.warn('[SW] Skipping precache asset:', asset, error && error.message ? error.message : error);
      return { asset, ok: false };
    }
  });

  const results = await Promise.all(jobs);
  const failed = results.filter((r) => !r.ok).map((r) => r.asset);
  if (failed.length) {
    console.warn('[SW] Precache completed with skipped assets:', failed);
  }
}

// Background Sync para carrito offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart());
  }
});

// Función para sincronizar carrito
async function syncCart() {
  try {
    const cartData = await getOfflineCartData();
    if (cartData && cartData.length > 0) {
      // Aquí iría la lógica para sincronizar con el servidor
      console.log('[SW] Syncing cart data:', cartData);
      // await syncWithServer(cartData);
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

// Obtener datos del carrito offline
async function getOfflineCartData() {
  // Implementar lógica para obtener datos del carrito guardados offline
  return [];
}

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/static/img/logo.webp',
      badge: '/static/img/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver oferta',
          icon: '/static/img/logo.webp'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/static/img/favicon.ico'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/category.html')
    );
  }
});

// Limpieza periódica de caché
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter(name => name.includes('natural-be-'))
              .map(name => caches.delete(name))
          );
        })
    );
  }
});

console.log('[SW] Service Worker loaded successfully');
