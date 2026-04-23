const CACHE_NAME = 'levitar-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/assets/images/logo.png',
  '/js/app.js',
  '/js/services/database.js',
  '/js/services/dataStore.js',
  '/js/services/articulosService.js',
  '/js/services/clientesService.js',
  '/js/services/ventasService.js',
  '/js/services/mediosPagoService.js',
  '/js/services/datosNegocioService.js',
  '/js/services/cajaService.js',
  '/js/services/whatsappService.js',
  '/js/services/categoriasService.js',
  '/js/services/authService.js',
  '/js/services/backupService.js',
  '/js/components/router.js',
  '/js/components/sidebar.js',
  '/js/components/header.js',
  '/js/components/modal.js',
  '/js/components/topNav.js',
  '/js/pages/login.js',
  '/js/pages/pos.js',
  '/js/pages/dashboard.js',
  '/js/pages/catalogo.js',
  '/js/lib/chart.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return response;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});