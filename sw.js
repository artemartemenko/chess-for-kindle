const CACHE_NAME = 'chess-v7';
const ANALYTICS_QUEUE = 'analytics-queue-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['./', './index.html']))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== ANALYTICS_QUEUE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      sendQueuedAnalytics()
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  if (url.includes('google-analytics.com') || 
      url.includes('googletagmanager.com') ||
      url.includes('/g/collect')) {
    
    event.respondWith(
      fetch(event.request.clone())
        .catch(async () => {
          try {
            const cache = await caches.open(ANALYTICS_QUEUE);
            const queuedRequest = new Request(url + '&qt=' + Date.now(), {
              method: event.request.method,
              headers: event.request.headers,
              body: event.request.method === 'POST' ? await event.request.clone().text() : null
            });
            await cache.put(queuedRequest, new Response('', {status: 200}));
            console.log('Analytics queued:', url);
          } catch (err) {
            console.error('Failed to queue analytics:', err);
          }
          return new Response('', { status: 200 });
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
  try {
    const cache = await caches.open(ANALYTICS_QUEUE);
    const requests = await cache.keys();
    
    console.log('Sending queued analytics:', requests.length, 'requests');
    
    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          console.log('Analytics sent:', request.url);
        }
      } catch (err) {
        console.log('Failed to send analytics (will retry):', err);
      }
    }
  } catch (err) {
    console.error('Error in sendQueuedAnalytics:', err);
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SEND_ANALYTICS') {
    event.waitUntil(sendQueuedAnalytics());
  }
});