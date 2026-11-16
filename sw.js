/* ============================================================
   ContaFaltas · sw.js  (Service Worker)
   Guarda una copia de la app en el móvil para que se abra rápido
   y funcione SIN INTERNET. Solo actúa cuando la app está publicada
   en una web (https://...); al abrir index.html con doble clic no hace nada.
   Si cambias algún archivo de la app, sube el número de VERSION
   para que los móviles descarguen la versión nueva.
   ============================================================ */

const VERSION = 'contafaltas-v3';

// Archivos de la app que se guardan al instalarla
const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/datos.js',
  './js/calculos.js',
  './js/app.js',
  './manifest.webmanifest',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/favicon-32.png'
];

// 1. Instalación: se descargan y guardan todos los archivos
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(ARCHIVOS); })
  );
  self.skipWaiting();
});

// 2. Activación: se borran las copias de versiones antiguas
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(nombres
        .filter(function (n) { return n !== VERSION; })
        .map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// 3. Cada vez que la app pide un archivo:
//    primero se busca la copia guardada; si no está, se pide a internet
//    y se guarda (así también se guardan las fuentes de Google).
self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request, { ignoreSearch: true }).then(function (guardada) {
      if (guardada) return guardada;
      return fetch(evento.request).then(function (respuesta) {
        if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
          const copia = respuesta.clone();
          caches.open(VERSION).then(function (cache) { cache.put(evento.request, copia); });
        }
        return respuesta;
      }).catch(function () {
        // Sin internet y sin copia: si era una página, se muestra la app
        if (evento.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
