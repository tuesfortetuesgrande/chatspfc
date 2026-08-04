// sw.js — Service Worker do Tricolor Chat
// Precisa estar na RAIZ do site (mesmo nível do index.html) para o scope "/" funcionar.

const CACHE_NAME = 'tricolor-chat-v2';
const APP_SHELL = [
  '/',
  '/index.html'
];

// Instala e guarda o "esqueleto" do app em cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos (de versões anteriores do app)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Serve do cache primeiro; se não tiver, busca na rede e guarda uma cópia
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
