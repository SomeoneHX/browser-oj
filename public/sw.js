const EMCEPTION_VERSION = '3.8.0'
const CACHE_NAME = `emception-${EMCEPTION_VERSION}`
const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/`
const PYODIDE_VERSION = '0.29.3'
const PYODIDE_CACHE_NAME = `pyodide-${PYODIDE_VERSION}`
const PYODIDE_PREFIX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const BRYTHON_VERSION = '3.12.5'
const BRYTHON_CACHE_NAME = `brython-${BRYTHON_VERSION}`
const BRYTHON_PREFIX = `https://cdn.jsdelivr.net/npm/brython@${BRYTHON_VERSION}/`
// No COOP/COEP headers are needed anymore: emception reads stdin from bytes
// preloaded into the run message (see patches/), so SharedArrayBuffer is not
// required and every page stays embeddable for third-party iframes (giscus).
const SW_VERSION = 'worker-no-coep-v7'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return
  // Let the browser load images directly. This avoids altering or caching
  // cross-origin image responses used by user-selected themes and avatars.
  if (request.destination === 'image' || request.url.match(/\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i)) return
  // Let the browser load cross-origin iframe documents directly.
  if (request.mode === 'navigate' && new URL(request.url).origin !== self.location.origin) return

  const isEmceptionResource = request.url.startsWith(CDN_PREFIX)
  const isPyodideResource = request.url.startsWith(PYODIDE_PREFIX)
  const isBrythonResource = request.url.startsWith(BRYTHON_PREFIX)
  const cacheName = isEmceptionResource ? CACHE_NAME : isPyodideResource ? PYODIDE_CACHE_NAME : BRYTHON_CACHE_NAME
  if (isEmceptionResource || isPyodideResource || isBrythonResource) {
    event.respondWith(
      caches
        .open(cacheName)
        .then((cache) => cache.match(request).then((cached) => cached || fetch(request))),
    )
  }
})

// Keep the version visible while debugging an installed worker in DevTools.
void SW_VERSION
