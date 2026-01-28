const CACHE_NAME = 'chess-v4';
const ANALYTICS_QUEUE = 'analytics-queue';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['./', './index.html']))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('google-analytics.com') || 
      event.request.url.includes('googletagmanager.com')) {
    
    event.respondWith(
      fetch(event.request.clone())
        .catch(() => {
          return caches.open(ANALYTICS_QUEUE).then(cache => {
            cache.put(event.request.url + '?' + Date.now(), event.request.clone());
            return new Response('', { status: 200 });
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

async function sendQueuedAnalytics() {
  const cache = await caches.open(ANALYTICS_QUEUE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (err) {
      console.log('Failed to send analytics:', err);
    }
  }
}

self.addEventListener('activate', event => {
  event.waitUntil(sendQueuedAnalytics());
});

self.addEventListener('message', event => {
  if (event.data.type === 'SEND_ANALYTICS') {
    sendQueuedAnalytics();
  }
});