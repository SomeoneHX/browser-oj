const EMCEPTION_VERSION = '3.8.0'
const CACHE_NAME = `emception-${EMCEPTION_VERSION}`
const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/`
const PYODIDE_VERSION = '0.29.3'
const PYODIDE_CACHE_NAME = `pyodide-${PYODIDE_VERSION}`
const PYODIDE_PREFIX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const BRYTHON_VERSION = '3.12.5'
const BRYTHON_CACHE_NAME = `brython-${BRYTHON_VERSION}`
const BRYTHON_PREFIX = `https://cdn.jsdelivr.net/npm/brython@${BRYTHON_VERSION}/`
const SW_VERSION = 'worker-coep-v5'

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
  const isPyodideResource = request.url.startsWith(PYODIDE_PREFIX)
  const isBrythonResource = request.url.startsWith(BRYTHON_PREFIX)
  const isSameOrigin = new URL(request.url).origin === self.location.origin
  const isWorkerScript = request.destination === 'worker' || request.destination === 'script'
  const cacheName = isEmceptionResource ? CACHE_NAME : isPyodideResource ? PYODIDE_CACHE_NAME : BRYTHON_CACHE_NAME
  const responder = isEmceptionResource || isPyodideResource || isBrythonResource
    ? caches
        .open(cacheName)
        .then((cache) => cache.match(request).then((cached) => cached || fetch(request)))
    : fetch(request)

  event.respondWith(
    responder.then((response) => {
      if (!response || response.status === 0 || response.type === 'opaque') return response
      // Worker scripts inherit the document's isolation requirements. Keep
      // same-origin scripts isolated, but never rewrite arbitrary cross-origin
      // resources such as user-selected theme images.
      if (!isEmceptionResource && !isPyodideResource && !isBrythonResource && request.mode !== 'navigate' && !(isSameOrigin && isWorkerScript)) return response
      const newHeaders = new Headers(response.headers)
      if (request.mode === 'navigate' || (isSameOrigin && isWorkerScript)) {
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
