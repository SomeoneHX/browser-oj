const EMCEPTION_VERSION = '3.8.0'
const CACHE_NAME = `emception-${EMCEPTION_VERSION}`
const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/`

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

  const isEmceptionResource = request.url.startsWith(CDN_PREFIX)
  const responder = isEmceptionResource
    ? caches
        .open(CACHE_NAME)
        .then((cache) => cache.match(request).then((cached) => cached || fetch(request)))
    : fetch(request)

  event.respondWith(
    responder.then((response) => {
      if (!response || response.status === 0 || response.type === 'opaque') return response
      const newHeaders = new Headers(response.headers)
      newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp')
      newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin')
      newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }),
  )
})
