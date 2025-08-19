self.addEventListener('install', e=>{
  e.waitUntil(caches.open('psp-v1').then(c=>c.addAll([
    './','./index.html','./manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});