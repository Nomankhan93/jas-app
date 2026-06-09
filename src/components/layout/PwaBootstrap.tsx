import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  platforms?: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

const DEV_SW_RELOAD_FLAG = 'jas-pwa-dev-sw-unregistered'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

async function unregisterDevServiceWorkers() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    if (registrations.length === 0) {
      sessionStorage.removeItem(DEV_SW_RELOAD_FLAG)
      return
    }

    await Promise.all(registrations.map((registration) => registration.unregister()))

    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
    }

    const alreadyReloaded = sessionStorage.getItem(DEV_SW_RELOAD_FLAG) === '1'

    if (navigator.serviceWorker.controller && !alreadyReloaded) {
      sessionStorage.setItem(DEV_SW_RELOAD_FLAG, '1')
      window.location.reload()
    }
  } catch (error) {
    console.warn('JAS dev service worker cleanup failed:', error)
  }
}

export function PwaBootstrap() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dismissedUpdate, setDismissedUpdate] = useState(false)
  const [dismissedInstall, setDismissedInstall] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()

      if (isStandaloneDisplay()) return

      setInstallPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
      setDismissedInstall(false)
    }

    const handleAppInstalled = () => {
      setCanInstall(false)
      setInstallPrompt(null)
      setDismissedInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    if (import.meta.env.DEV) {
      void unregisterDevServiceWorkers()
      return
    }

    let activeRegistration: ServiceWorkerRegistration | null = null
    let refreshTriggered = false

    const showUpdatePrompt = (worker: ServiceWorker) => {
      setWaitingWorker(worker)
      setUpdateAvailable(true)
      setDismissedUpdate(false)
    }

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      activeRegistration = registration

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdatePrompt(registration.waiting)
      }

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            showUpdatePrompt(installingWorker)
          }
        })
      })
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(watchRegistration)
        .catch((error) => {
          console.warn('JAS service worker registration failed:', error)
        })
    }

    const handleControllerChange = () => {
      if (refreshTriggered) return

      refreshTriggered = true
      window.location.reload()
    }

    const checkForUpdates = () => {
      if (!activeRegistration || document.hidden) return

      activeRegistration.update().catch((error) => {
        console.warn('JAS service worker update check failed:', error)
      })
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    )
    document.addEventListener('visibilitychange', checkForUpdates)
    window.addEventListener('online', checkForUpdates)

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true })
    }

    const updateInterval = window.setInterval(checkForUpdates, 30 * 60 * 1000)

    return () => {
      window.removeEventListener('load', registerServiceWorker)
      window.removeEventListener('online', checkForUpdates)
      document.removeEventListener('visibilitychange', checkForUpdates)
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      )
      window.clearInterval(updateInterval)
    }
  }, [])

  async function handleInstallClick() {
    if (!installPrompt) return

    setIsInstalling(true)

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice.outcome === 'accepted') {
        setCanInstall(false)
        setInstallPrompt(null)
        setDismissedInstall(false)
      }
    } finally {
      setIsInstalling(false)
    }
  }

  function handleUpdateClick() {
    setIsRefreshing(true)

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      window.setTimeout(() => window.location.reload(), 1500)
      return
    }

    window.location.reload()
  }

  const shouldShowUpdate = updateAvailable && !dismissedUpdate
  const shouldShowInstall =
    !shouldShowUpdate &&
    !dismissedInstall &&
    !isStandaloneDisplay() &&
    canInstall &&
    Boolean(installPrompt)

  if (!shouldShowUpdate && !shouldShowInstall) return null

  return (
    <div className="pwa-toast-stack" role="status" aria-live="polite">
      <style>{pwaStyles}</style>

      {shouldShowUpdate ? (
        <section className="pwa-toast pwa-toast--update">
          <div className="pwa-toast__icon" aria-hidden="true">
            ↻
          </div>
          <div className="pwa-toast__body">
            <p className="pwa-toast__eyebrow">JAS app update</p>
            <h2 className="pwa-toast__title">New version available</h2>
            <p className="pwa-toast__text">
              Refresh now to load the latest JAS member portal updates.
            </p>
          </div>
          <div className="pwa-toast__actions">
            <button
              type="button"
              className="pwa-toast__button pwa-toast__button--primary"
              onClick={handleUpdateClick}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="pwa-toast__button pwa-toast__button--ghost"
              onClick={() => setDismissedUpdate(true)}
            >
              Later
            </button>
          </div>
        </section>
      ) : null}

      {shouldShowInstall ? (
        <section className="pwa-toast pwa-toast--install">
          <div className="pwa-toast__icon" aria-hidden="true">
            ⬇
          </div>
          <div className="pwa-toast__body">
            <p className="pwa-toast__eyebrow">Install JAS App</p>
            <h2 className="pwa-toast__title">Install JAS App</h2>
            <p className="pwa-toast__text">
              Install the JAS member portal for faster access to membership,
              digital cards, updates and admin tools.
            </p>
          </div>
          <div className="pwa-toast__actions">
            <button
              type="button"
              className="pwa-toast__button pwa-toast__button--primary"
              onClick={handleInstallClick}
              disabled={isInstalling}
            >
              {isInstalling ? 'Opening…' : 'Install JAS App'}
            </button>
            <button
              type="button"
              className="pwa-toast__button pwa-toast__button--ghost"
              onClick={() => setDismissedInstall(true)}
            >
              Not now
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

const pwaStyles = `
  .pwa-toast-stack {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(1rem, env(safe-area-inset-bottom));
    z-index: 9999;
    width: min(27rem, calc(100vw - 2rem));
    pointer-events: none;
  }

  .pwa-toast {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.85rem;
    border: 1px solid rgba(27, 94, 59, 0.18);
    border-radius: 1.25rem;
    background: rgba(255, 253, 249, 0.96);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
    padding: 1rem;
    color: #101827;
    pointer-events: auto;
    backdrop-filter: blur(18px);
  }

  .pwa-toast--update {
    border-color: rgba(176, 138, 62, 0.32);
  }

  .pwa-toast__icon {
    display: grid;
    width: 2.45rem;
    height: 2.45rem;
    place-items: center;
    border-radius: 999px;
    background: #0b2a1d;
    color: #fff8e6;
    font-size: 1.15rem;
    font-weight: 900;
  }

  .pwa-toast__body {
    min-width: 0;
  }

  .pwa-toast__eyebrow {
    margin: 0 0 0.18rem;
    color: #1b5e3b;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .pwa-toast__title {
    margin: 0;
    color: #0f172a;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.25;
  }

  .pwa-toast__text {
    margin: 0.3rem 0 0;
    color: #526078;
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1.45;
  }

  .pwa-toast__actions {
    display: flex;
    grid-column: 1 / -1;
    gap: 0.55rem;
    justify-content: flex-end;
  }

  .pwa-toast__button {
    min-height: 2.35rem;
    border-radius: 0.85rem;
    border: 1px solid transparent;
    padding: 0.45rem 0.9rem;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }

  .pwa-toast__button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .pwa-toast__button:disabled {
    cursor: progress;
    opacity: 0.68;
  }

  .pwa-toast__button--primary {
    background: #1b5e3b;
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(27, 94, 59, 0.18);
  }

  .pwa-toast__button--ghost {
    background: #ffffff;
    border-color: #e5e7eb;
    color: #334155;
  }

  @media (max-width: 640px) {
    .pwa-toast-stack {
      left: 1rem;
      right: 1rem;
      bottom: max(0.75rem, env(safe-area-inset-bottom));
      width: auto;
    }

    .pwa-toast {
      border-radius: 1rem;
    }
  }
`
