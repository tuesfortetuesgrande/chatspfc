// sw.js — Service Worker do Tricolor Chat
// Precisa estar na RAIZ do site (mesmo nível do index.html) para o scope "/" funcionar.

const CACHE_NAME = 'tricolor-chat-v3';
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

// Serve o HTML sempre da rede primeiro (assim toda atualização publicada aparece
// na hora, sem precisar limpar cache); só cai pro cache se estiver sem internet.
// Os demais arquivos estáticos (imagens, ícones etc.) continuam cache-primeiro,
// que é mais rápido e não muda com frequência.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const ehNavegacao = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (ehNavegacao) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

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
