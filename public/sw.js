const CACHE_VERSION = 'vocentro-v1';
const STATIC_CACHE = `vocentro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `vocentro-dynamic-${CACHE_VERSION}`;

// Assets essenciais para boot offline
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/apple-touch-icon.png'
];

// 1. Instalação: Pré-cache inicial e skipWaiting() IMEDIATO
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache parcial:', err);
      });
    })
  );
});

// 2. Ativação: clients.claim() IMEDIATO e limpeza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[SW] Purgando cache legado:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptação de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Métodos não-GET e esquemas não suportados
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // B. Chamadas de Backend, Supabase, Asaas, Stripe e Edge Functions: Network Only
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('asaas.com') ||
    url.hostname.includes('stripe.com') ||
    url.hostname.includes('resend.com') ||
    url.pathname.startsWith('/functions/v1') ||
    url.pathname.startsWith('/api')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // C. Navegação de Páginas HTML (Documentos): NETWORK-FIRST ESTRITO
  // Garante que o usuário NUNCA fique preso num HTML antigo após novos deploys
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline - VoCentro', { status: 200, headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  // D. Assets versionados pelo Vite (/assets/*): STALE-WHILE-REVALIDATE com atualização em background
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // E. Imagens, Fontes e Arquivos Estáticos: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request).then((netRes) => {
          if (netRes && netRes.status === 200) {
            caches.open(STATIC_CACHE).then((c) => c.put(request, netRes));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then((netRes) => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
        }
        return netRes;
      });
    })
  );
});

// Listener para comando explícito de skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
