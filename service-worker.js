const CACHE='psp-v3-full-1755616088';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.json',
'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
'https://cdn.jsdelivr.net/npm/chart.js',
'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
'https://html2canvas.hertzen.com/dist/html2canvas.min.js'
])));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
