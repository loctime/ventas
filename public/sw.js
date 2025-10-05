// Service Worker para PWA - Optimizado para móvil
const CACHE_NAME = 'control-ventas-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.jpg',
  '/icon-512.jpg',
  '/sw.js'
]

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('Service Worker: Instalación completada')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.log('Service Worker: Error durante instalación', error)
      })
  )
)

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activación completada')
      return self.clients.claim()
    })
  )
})

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si está disponible
        if (response) {
          return response
        }
        
        // Si no está en cache, hacer fetch y cachear
        return fetch(event.request).then((response) => {
          // Verificar que la respuesta sea válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Clonar la respuesta
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
      })
  )
})
