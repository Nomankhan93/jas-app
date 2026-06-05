// src/routes/__root.tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Header } from '../components/layout/Header'
import { NotFoundPage } from '../components/layout/NotFoundPage'
import { PwaBootstrap } from '../components/layout/PwaBootstrap'
import { I18nProvider } from '../lib/i18n'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  notFoundComponent: RootNotFoundPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Jatt Alliance Sindh | Member & Programs Portal' },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh membership registration, admin approval, QR verification, digital ID card and member-verified education, health, welfare and employment support platform.',
      },
      { name: 'theme-color', content: '#0b2a1d' },
      { name: 'application-name', content: 'JAS' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'JAS' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'msapplication-TileColor', content: '#0b2a1d' },
      { name: 'format-detection', content: 'telephone=no' },
      {
        property: 'og:title',
        content: 'Jatt Alliance Sindh Member & Programs Portal',
      },
      {
        property: 'og:description',
        content:
          'Register, verify and access Jatt Alliance Sindh digital membership, education, health, welfare and employment support programs.',
      },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isPublicVerifyPage = pathname.startsWith('/verify/')
  const isCardPreviewPage =
    pathname === '/card' ||
    pathname.includes('/admin/members/') ||
    pathname.endsWith('/card')

  return (
    <RootDocument>
      <I18nProvider>
        <div className="min-h-screen bg-[linear-gradient(180deg,#fbf9f4_0%,#f6f2e9_55%,#f8f5ef_100%)] text-stone-950">
          <div
            className="animate-fade-in pointer-events-none fixed inset-x-0 top-0 z-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(196,145,44,0.14),transparent_40%),radial-gradient(circle_at_top_right,rgba(11,42,29,0.10),transparent_35%)]"
            aria-hidden="true"
          />

          <PwaBootstrap />
          {!isPublicVerifyPage ? <Header compact={isCardPreviewPage} /> : null}

          <div className="animate-fade-up relative z-10">
            <Outlet />
          </div>
        </div>
      </I18nProvider>
    </RootDocument>
  )
}

function RootNotFoundPage() {
  return (
    <RootDocument>
      <I18nProvider>
        <NotFoundPage />
      </I18nProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-emerald-900 focus:shadow-lg"
        >
          Skip to main content
        </a>

        <div id="main-content">{children}</div>

        <Scripts />
      </body>
    </html>
  )
}
