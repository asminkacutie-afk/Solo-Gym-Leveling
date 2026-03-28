/**
 * GymRPG Service Worker
 * Strategy:
 *   - App shell (HTML, JS, CSS, fonts): Cache-first, update in background
 *   - API calls (/api/*): Network-first, fall back to cached response
 *   - Static assets (/icons, images): Cache-first, long TTL
 */

const SHELL_CACHE  = 'gymrpg-shell-v1'
const API_CACHE    = 'gymrpg-api-v1'
const STATIC_CACHE = 'gymrpg-static-v1'

const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
]

const STATIC_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  )
  // Take control immediately — don't wait for old SW to die
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowed = new Set([SHELL_CACHE, API_CACHE, STATIC_CACHE])
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !allowed.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension:// etc.
  if (request.method !== 'GET') return
  if (!['http:', 'https:'].includes(url.protocol)) return

  // Skip WebSocket upgrades
  if (request.headers.get('upgrade') === 'websocket') return

  // ── API: network-first, cache fallback ─────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE))
    return
  }

  // ── Google Fonts / static CDN: cache-first ─────────────────────────────────
  if (STATIC_ORIGINS.some((o) => url.hostname.includes(o))) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE))
    return
  }

  // ── App shell and built assets: cache-first, revalidate in bg ──────────────
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE))
})

// ─── Sync (background sync for offline workout logs) ─────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout') {
    event.waitUntil(flushOfflineQueue())
  }
})

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'GymRPG', body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'GymRPG', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: payload.tag ?? 'gymrpg',
      data: payload.url ? { url: payload.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(target)
        } else {
          self.clients.openWindow(target)
        }
      })
  )
})

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Network first — useful for API data. Falls back to cache on failure.
 * Always updates cache with fresh network responses.
 */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return offlineJson({ error: 'offline', cached: false })
  }
}

/**
 * Cache first — useful for fonts and icons. Falls through to network on miss.
 */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

/**
 * Stale-while-revalidate — serve from cache immediately, update in background.
 * Falls through to network for cache misses.
 * For navigation requests always falls back to '/' (SPA shell).
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    // Revalidate in background, return stale immediately
    networkPromise // fire-and-forget
    return cached
  }

  // Cache miss — wait for network
  const networkResponse = await networkPromise
  if (networkResponse) return networkResponse

  // Navigation fallback: serve app shell so React Router can handle it
  if (request.mode === 'navigate') {
    const shell = await cache.match('/')
    if (shell) return shell
  }

  return new Response('Offline', { status: 503 })
}

/**
 * Offline queue: POST requests stored in IndexedDB and replayed on sync.
 */
async function flushOfflineQueue() {
  const db = await openOfflineDB()
  const tx = db.transaction('queue', 'readwrite')
  const store = tx.objectStore('queue')
  const all = await idbGetAll(store)

  for (const item of all) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })
      if (res.ok) {
        store.delete(item.id)
      }
    } catch {
      // Keep in queue, retry next sync
    }
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gymrpg-offline', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function offlineJson(body) {
  return new Response(JSON.stringify(body), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  })
}
