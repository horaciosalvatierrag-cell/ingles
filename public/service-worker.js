const CACHE_NAME = 'ingles-shell-v5';
const APP_BASE_URL = new URL(self.registration.scope);
const APP_BASE = APP_BASE_URL.pathname;
const APP_SHELL = [
  APP_BASE_URL.href,
  new URL('manifest.webmanifest', APP_BASE_URL).href,
  new URL('icons/app-192.png', APP_BASE_URL).href,
  new URL('icons/app-512.png', APP_BASE_URL).href,
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const page = await cache.match(APP_BASE_URL.href);
    if (!page) return;

    const html = await page.text();
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(match => new URL(match[1], APP_BASE_URL))
      .filter(url => url.origin === self.location.origin
        && url.pathname.startsWith(APP_BASE)
        && /\.(?:js|css)$/i.test(url.pathname));
    await Promise.allSettled(assets.map(async asset => {
      const response = await fetch(asset.href);
      if (response.ok) await cache.put(asset.href, response);
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('ingles-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request)
      .then(response => {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then(cache => cache.put(APP_BASE, copy));
        return response;
      })
      .catch(async () => (await caches.match(request)) || (await caches.match(APP_BASE_URL.href))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    });
  }));
});
