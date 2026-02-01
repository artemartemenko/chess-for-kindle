const CACHE_NAME = 'chess-v19';

function cacheUrl(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        './', './index.html',
        './chess/', './chess/index.html',
        './checkers/', './checkers/index.html',
        './reversi/', './reversi/index.html',
        './peg-solitaire/', './peg-solitaire/index.html',
        './backgammon/', './backgammon/index.html',
        './css/games-common.css',
        './js/games-common.js'
      ]))
      .catch(function() {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  if (url.includes('google-analytics.com') || 
      url.includes('googletagmanager.com') ||
      url.includes('gtag')) {
    event.respondWith(fetch(event.request));
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
      .catch(function() {
        if (event.request.mode === 'navigate') {
          var pathname = new URL(event.request.url).pathname;
          var path = pathname.replace(/\/$/, '');
          var isRoot = (pathname === '' || pathname === '/') || (pathname.slice(-1) === '/' && !/\/chess$/.test(path) && !/\/checkers$/.test(path) && !/\/reversi$/.test(path) && !/\/peg-solitaire$/.test(path) && !/\/backgammon$/.test(path));
          if (isRoot) {
            return caches.match(cacheUrl('./index.html')).then(function(r) {
              return r || caches.match(cacheUrl('index.html')) || caches.match(event.request);
            });
          }
          if (/\/chess$/.test(path) || /\/chess\//.test(event.request.url)) return caches.match(cacheUrl('./chess/index.html'));
          if (/\/checkers$/.test(path) || /\/checkers\//.test(event.request.url)) return caches.match(cacheUrl('./checkers/index.html'));
          if (/\/reversi$/.test(path) || /\/reversi\//.test(event.request.url)) return caches.match(cacheUrl('./reversi/index.html'));
          if (/\/peg-solitaire$/.test(path) || /\/peg-solitaire\//.test(event.request.url)) return caches.match(cacheUrl('./peg-solitaire/index.html'));
          if (/\/backgammon$/.test(path) || /\/backgammon\//.test(event.request.url)) return caches.match(cacheUrl('./backgammon/index.html'));
        }
        return caches.match(event.request);
      })
  );
});