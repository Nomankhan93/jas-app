import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Jatt Alliance Sindh - Membership Platform',
      },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh digital membership platform with member registration, admin approval, digital cards, and QR verification.',
      },
      {
        name: 'theme-color',
        content: '#047857',
      },
      {
        name: 'application-name',
        content: 'Jatt Alliance Sindh - JAS',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'JAS',
      },
    ],
    links: [
      { rel: 'stylesheet', href: styles },

      // Favicon / app icons
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon-16.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-32.png' },
      { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icon-48.png' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/manifest.json' },

      // Fonts
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <RootDocument>
      <SiteHeader />
      <Outlet />
      <SiteFooter />

      {import.meta.env.DEV ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
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
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="page-wrap flex min-h-20 items-center justify-between gap-4">
        <Link to="/" className="brand-pill">
          <span className="brand-dot" />
          <span className="brand-text">JATT ALLIANCE SINDH - JAS</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/signup">Signup</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/login"
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline"
          >
            Login
          </Link>

          <Link
            to="/dashboard"
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white no-underline"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  to,
  children,
}: {
  to: '/' | '/signup' | '/login' | '/dashboard' | '/register' | '/admin'
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="nav-link"
      activeProps={{ className: 'nav-link is-active' }}
    >
      {children}
    </Link>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer mt-16 py-8">
      <div className="page-wrap text-sm text-[var(--sea-ink-soft)]">
        © {new Date().getFullYear()} Jatt Alliance Sindh. All rights reserved.
      </div>
    </footer>
  )
}

function NotFoundPage() {
  return (
    <main className="px-4 py-12">
      <div className="page-wrap rounded-[1.75rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--lagoon)]">
          Jatt Alliance Sindh
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white no-underline"
        >
          Go Home
        </Link>
      </div>
    </main>
  )
}