// VERSION: Se actualiza automáticamente en cada build
const SW_VERSION = "BUILD_TIMESTAMP"
const STATIC_CACHE = `control-ventas-static-${SW_VERSION}`
const DYNAMIC_CACHE = `control-ventas-dynamic-${SW_VERSION}`
const RUNTIME_CACHE = `control-ventas-runtime-${SW_VERSION}`

const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg"
]

// Instalar Service Worker - Forzar instalación inmediata
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}...`)
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("[SW] Skip waiting - activating immediately")
        return self.skipWaiting()
      })
  )
})

// Activar Service Worker - Limpiar cachés antiguos
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}...`)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cualquier caché que no sea de la versión actual
          if (
            cacheName.startsWith('control-ventas-') && 
            !cacheName.includes(SW_VERSION)
          ) {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log("[SW] Claiming clients")
      return self.clients.claim()
    })
  )
})

// Estrategia de caché inteligente
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return
  }

  // Ignorar requests de Firebase y APIs externas
  if (
    url.hostname.includes('firebase') || 
    url.hostname.includes('firestore') ||
    url.hostname !== self.location.hostname
  ) {
    return
  }

  // Network-First para HTML y rutas de la app (siempre obtener última versión)
  if (
    request.headers.get('accept')?.includes('text/html') || 
    url.pathname === '/' ||
    url.pathname.startsWith('/_next/data/')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Guardar en caché la nueva versión
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Si falla la red, intentar desde caché
          return caches.match(request).then(cached => {
            return cached || new Response('Offline', { status: 503 })
          })
        })
    )
    return
  }

  // Cache-First para assets estáticos (imágenes, fonts, JS, CSS)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          return cached
        }
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Stale-While-Revalidate para otros recursos
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})

// Mensaje para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Force update - skipping waiting')
    self.skipWaiting()
  }
})