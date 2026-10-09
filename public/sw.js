const CACHE_NAME = 'dahshah-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Installed. Pre-caching static shell.');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to prevent errors with other methods (POST, PUT, etc.)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip caching browser extensions or unsupported protocols
  if (!event.request.url.startsWith('http')) return;

  // 1. Navigation requests fallback (SPA Routing fallback to root /)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Try Cache first, fallback to network with dynamic cache recording
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const isSameOrigin = url.origin === self.location.origin;
        const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

        if (networkResponse && networkResponse.status === 200 && (isSameOrigin || isGoogleFont)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Fetch failed offline for:', event.request.url, err);
        return new Response('Network error occurred.', { status: 480, statusText: 'Offline Resource Unavailable' });
      });
    })
  );
});
