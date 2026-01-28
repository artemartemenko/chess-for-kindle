const CACHE_NAME = 'chess-v8';

self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['./', './index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('chess-') && cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  if (url.startsWith('chrome-extension://') || 
      url.startsWith('moz-extension://') ||
      url.startsWith('safari-extension://')) {
    return;
  }
  
  if (url.includes('google-analytics.com') || 
      url.includes('googletagmanager.com') ||
      !url.startsWith(self.location.origin)) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(err => console.log('Cache put failed:', err));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});