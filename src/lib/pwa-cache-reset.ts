export type ClearPwaCacheOptions = {
  reload?: boolean
  includeStorage?: boolean
  reason?: string
}

const JAS_CACHE_PREFIX = 'jas-pwa'
const RESET_MARKER_PARAM = 'pwa-cache-cleared'
const RESET_QUERY_PARAMS = [
  'clear-pwa-cache',
  'clearCache',
  'reset-pwa-cache',
  'resetApp',
]

function isBrowser() {
  return typeof window !== 'undefined'
}

function isSameOriginServiceWorker(registration: ServiceWorkerRegistration) {
  if (!isBrowser()) return false

  const scope = registration.scope || ''
  return scope.startsWith(window.location.origin)
}

function buildCleanReloadUrl() {
  const url = new URL(window.location.href)

  for (const param of RESET_QUERY_PARAMS) {
    url.searchParams.delete(param)
  }

  url.searchParams.set(RESET_MARKER_PARAM, Date.now().toString())
  return url.toString()
}

export function hasPwaCacheResetParam() {
  if (!isBrowser()) return false

  const url = new URL(window.location.href)
  return RESET_QUERY_PARAMS.some((param) => url.searchParams.has(param))
}

export async function deleteJasCacheStorage() {
  if (!isBrowser() || !('caches' in window)) return

  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(JAS_CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  )
}

export async function unregisterJasServiceWorkers() {
  if (!isBrowser() || !('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter(isSameOriginServiceWorker)
      .map((registration) => registration.unregister()),
  )
}

export async function clearJasPwaCache(options: ClearPwaCacheOptions = {}) {
  if (!isBrowser()) return

  try {
    await deleteJasCacheStorage()
    await unregisterJasServiceWorkers()

    if (options.includeStorage) {
      localStorage.removeItem('jas-app-language')
      sessionStorage.clear()
    }
  } catch (error) {
    console.warn('JAS PWA cache reset failed:', error)
  } finally {
    if (options.reload !== false) {
      window.location.replace(buildCleanReloadUrl())
    }
  }
}

export function getPwaCacheResetUrl() {
  if (!isBrowser()) return '/?clear-pwa-cache=1'

  const url = new URL(window.location.href)
  url.searchParams.set('clear-pwa-cache', '1')
  return url.toString()
}
