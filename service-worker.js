self.addEventListener('install', e=>{
 e.waitUntil(caches.open('pspv3').then(c=>c.addAll(['./','./index.html','./manifest.json',
 'https://cdn.jsdelivr.net/npm/chart.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
 'https://html2canvas.hertzen.com/dist/html2canvas.min.js'
 ])));
});
self.addEventListener('fetch', e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
