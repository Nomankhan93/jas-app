import { useEffect, useMemo, useState } from 'react'
import {
  clearJasPwaCache,
  getPwaCacheResetUrl,
  hasPwaCacheResetParam,
} from '../../lib/pwa-cache-reset'

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

function shouldForceShowReset() {
  if (typeof window === 'undefined') return false

  const url = new URL(window.location.href)
  return url.searchParams.has('show-cache-reset') || url.searchParams.has('debug-pwa')
}

export function AppUpdateReset() {
  const [visible, setVisible] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const resetUrl = useMemo(() => getPwaCacheResetUrl(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (hasPwaCacheResetParam()) {
      void clearJasPwaCache({ reload: true, reason: 'query-param-reset' })
      return
    }

    const shouldShow = isStandaloneDisplay() || shouldForceShowReset()
    if (!shouldShow) return

    const timer = window.setTimeout(() => setVisible(true), 4500)
    return () => window.clearTimeout(timer)
  }, [])

  async function handleResetClick() {
    setIsResetting(true)
    await clearJasPwaCache({ reload: true, reason: 'manual-reset' })
  }

  if (!visible) return null

  return (
    <aside className="jas-app-reset" role="status" aria-live="polite">
      <style>{styles}</style>
      <div className="jas-app-reset__content">
        <p className="jas-app-reset__eyebrow">App update</p>
        <p className="jas-app-reset__text">
          Loading stuck or old version? Reset app cache and reload latest files.
        </p>
      </div>
      <div className="jas-app-reset__actions">
        <button
          type="button"
          className="jas-app-reset__button jas-app-reset__button--primary"
          onClick={handleResetClick}
          disabled={isResetting}
        >
          {isResetting ? 'Resetting…' : 'Reset cache'}
        </button>
        <a className="jas-app-reset__button jas-app-reset__button--ghost" href={resetUrl}>
          Hard reset link
        </a>
        <button
          type="button"
          className="jas-app-reset__close"
          onClick={() => setVisible(false)}
          aria-label="Hide app reset helper"
        >
          ×
        </button>
      </div>
    </aside>
  )
}

const styles = `
  .jas-app-reset {
    position: fixed;
    left: max(0.9rem, env(safe-area-inset-left));
    bottom: max(0.9rem, env(safe-area-inset-bottom));
    z-index: 9998;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.8rem;
    width: min(34rem, calc(100vw - 1.8rem));
    border: 1px solid rgba(176, 138, 62, 0.32);
    border-radius: 1.1rem;
    background: rgba(255, 253, 249, 0.97);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
    padding: 0.8rem;
    color: #0f172a;
    backdrop-filter: blur(16px);
  }

  .jas-app-reset__content {
    min-width: 0;
  }

  .jas-app-reset__eyebrow {
    margin: 0;
    color: #1b5e3b;
    font-size: 0.64rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .jas-app-reset__text {
    margin: 0.2rem 0 0;
    color: #526078;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .jas-app-reset__actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .jas-app-reset__button,
  .jas-app-reset__close {
    border-radius: 0.8rem;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.76rem;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .jas-app-reset__button {
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.75rem;
  }

  .jas-app-reset__button:disabled {
    cursor: progress;
    opacity: 0.7;
  }

  .jas-app-reset__button--primary {
    background: #1b5e3b;
    color: #ffffff;
  }

  .jas-app-reset__button--ghost {
    background: #ffffff;
    border-color: #e5e7eb;
    color: #334155;
  }

  .jas-app-reset__close {
    width: 2.1rem;
    height: 2.1rem;
    background: #fff7ed;
    color: #9a3412;
    font-size: 1.1rem;
  }

  @media (max-width: 640px) {
    .jas-app-reset {
      grid-template-columns: 1fr;
      right: max(0.9rem, env(safe-area-inset-right));
      width: auto;
    }

    .jas-app-reset__actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }
  }
`
