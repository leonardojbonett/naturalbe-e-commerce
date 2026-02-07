// Service Worker para Natural Be - v2026-02-05
const CACHE_NAME = 'natural-be-v2026-02-05';
const STATIC_CACHE = 'natural-be-static-v2026-02-05';
const RUNTIME_CACHE = 'natural-be-runtime-v2026-02-05';

// Recursos estáticos críticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/category.html',
  '/static/css/main.min.css?v=2026-01-11',
  '/static/js/bundle.min.js?v=2026-02-05',
  '/static/js/webp-support.js?v=2026-02-05',
  '/static/img/logo.webp',
  '/static/img/placeholder.webp',
  '/static/img/og-naturalbe.jpg',
  '/static/img/og-naturalbe.webp',
  '/static/favicon.ico',
  '/static/favicon-32x32.png',
  '/static/favicon-16x16.png',
  '/static/android-chrome-192x192.png',
  '/static/apple-touch-icon.png'
];

// Recursos de red que pueden cachearse
const NETWORK_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
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
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
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
  
  // Solo cachear peticiones GET y HTTPS
  if (request.method !== 'GET' || url.protocol !== 'https:') {
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
          return cache.match(request)
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
      throw error;
    });
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
