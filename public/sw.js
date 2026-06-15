const CACHE_PREFIX = 'jas-pwa'
const CACHE_VERSION = 'v5-cache-clear-fix'
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`
const CORE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
]

const ASSET_EXTENSIONS = /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i

async function deleteOldJasCaches() {
  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  )
}

async function deleteAllJasCaches() {
  const keys = await caches.keys()
  await Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)),
  )
}

async function precacheCoreAssets() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(
    CORE_ASSETS.map((asset) => new Request(asset, { cache: 'reload' })),
  )
}

async function putInCache(request, response) {
  if (!response || !response.ok) return

  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response.clone())
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request)
    await putInCache(request, response)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl)
      if (fallback) return fallback
    }

    throw new Error('No network response or cached fallback available.')
  }
}

async function cacheFirstWithBackgroundRefresh(request, event) {
  const cached = await caches.match(request)

  const networkFetch = fetch(request)
    .then(async (response) => {
      await putInCache(request, response)
      return response
    })
    .catch(() => null)

  if (cached) {
    event.waitUntil(networkFetch)
    return cached
  }

  const response = await networkFetch
  if (response) return response

  throw new Error('No network response or cached asset available.')
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheCoreAssets()
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    deleteOldJasCaches().then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  if (event.data?.type === 'CLEAR_JAS_CACHE') {
    event.waitUntil(
      deleteAllJasCaches().then(() => {
        if (event.source) {
          event.source.postMessage({ type: 'JAS_CACHE_CLEARED' })
        }
      }),
    )
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/offline.html'))
    return
  }

  const isManifest = url.pathname === '/manifest.json'
  const isOfflinePage = url.pathname === '/offline.html'
  const isMutablePublicAsset = url.pathname.startsWith('/jas/') || isManifest || isOfflinePage
  const isStaticBuildAsset = url.pathname.startsWith('/assets/') || ASSET_EXTENSIONS.test(url.pathname)

  if (isMutablePublicAsset) {
    event.respondWith(networkFirst(request))
    return
  }

  if (isStaticBuildAsset) {
    event.respondWith(cacheFirstWithBackgroundRefresh(request, event))
  }
})

self.addEventListener('push', (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = {
        title: 'JAS Update',
        body: event.data.text(),
      }
    }
  }

  const title = payload.title || 'JAS Update'
  const options = {
    body:
      payload.body ||
      payload.message ||
      'You have a new update in the JAS member portal.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || payload.notification_id || 'jas-update',
    data: {
      url: payload.url || payload.action_url || '/notifications',
      notification_id: payload.notification_id || null,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(
    event.notification.data?.url || '/notifications',
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url === targetUrl) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    }),
  )
})
