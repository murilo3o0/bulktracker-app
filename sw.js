const CACHE_NAME = 'bulktracker-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalar Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Background Sync para dados offline
self.addEventListener('sync', function(event) {
  if (event.tag === 'meal-sync') {
    event.waitUntil(syncMealData());
  }
});

function syncMealData() {
  // Implementar sincronização de dados quando voltar online
  return new Promise((resolve) => {
    console.log('Sincronizando dados das refeições...');
    resolve();
  });
}

// Push notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Hora da refeição! 🍽️',
    icon: './icon-192x192.png',
    badge: './badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'mark-complete',
        title: 'Marcar como feito',
        icon: './check-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: './close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BulkTracker', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'mark-complete') {
    // Abrir app e marcar refeição
    event.waitUntil(
      clients.openWindow('/?action=mark')
    );
  } else if (event.action === 'close') {
    // Apenas fechar notificação
    return;
  } else {
    // Abrir app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
