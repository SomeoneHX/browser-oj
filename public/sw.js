const EMCEPTION_VERSION = '3.8.0'
const CACHE_NAME = `emception-${EMCEPTION_VERSION}`
const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/`
const SW_VERSION = 'theme-coep-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return
  // Let the browser load images directly. This avoids altering or caching
  // cross-origin image responses used by user-selected themes and avatars.
  if (request.destination === 'image' || request.url.match(/\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i)) return

  const isEmceptionResource = request.url.startsWith(CDN_PREFIX)
  const responder = isEmceptionResource
    ? caches
        .open(CACHE_NAME)
        .then((cache) => cache.match(request).then((cached) => cached || fetch(request)))
    : fetch(request)

  event.respondWith(
    responder.then((response) => {
      if (!response || response.status === 0 || response.type === 'opaque') return response
      // Only the same-origin document needs isolation headers. Rewriting
      // arbitrary cross-origin responses can make otherwise valid resources
      // unusable under COEP.
      if (!isEmceptionResource && request.mode !== 'navigate') return response
      const newHeaders = new Headers(response.headers)
      if (request.mode === 'navigate') {
        newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless')
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')
      } else {
        newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin')
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }),
  )
})

// Keep the version visible while debugging an installed worker in DevTools.
void SW_VERSION
