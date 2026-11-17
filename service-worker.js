const CACHE_NAME = 'minibus-misfits-v2';
const CORE_ASSETS = [
  './', './index.html', './play.html', './manifest.json', './assets.json', './game-config.json',
  './GameCover.png', './1.png', './2.png', './3.png', './4.png', './5.png',
  './MinibusClosed.png', './MinibusFront.png', './MinibusOpen.png', './MinibusTop.png',
  './SSCharacters01.png', './SSCharacters02.png', './SSZombie1.png', './SSZombie2.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
