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
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Jatt Alliance Sindh — Membership Platform' },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh digital membership platform with member registration, admin approval, digital cards, and QR verification.',
      },
      { name: 'theme-color', content: '#1A4D2E' },
      { name: 'application-name', content: 'Jatt Alliance Sindh — JAS' },
      { name: 'apple-mobile-web-app-title', content: 'JAS' },
    ],
    links: [
      { rel: 'stylesheet', href: styles },

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

      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

type PublicRoute = '/' | '/signup' | '/login' | '/dashboard' | '/register'

const primaryNav: Array<{ to: PublicRoute; label: string }> = [
  { to: '/', label: 'Home' },
  { to: '/signup', label: 'Sign Up' },
  { to: '/login', label: 'Login' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/register', label: 'Register' },
]

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
    <header className="site-header">
      <div className="page-wrap">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4">
          <Link to="/" className="brand-pill">
            <span className="brand-dot" />
            <span className="text-[0.75rem] font-extrabold uppercase tracking-[0.06em]">
              Jatt Alliance Sindh
            </span>
            <span className="ml-1 rounded bg-white/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em]">
              JAS
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {primaryNav.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl border border-[var(--line-mid)] bg-white px-4 py-2 text-[0.82rem] font-bold text-[var(--ink)] transition hover:bg-[var(--paper)]"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="inline-flex items-center rounded-xl bg-[linear-gradient(135deg,var(--forest),var(--forest-mid))] px-4 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_14px_var(--forest-glow)] transition hover:-translate-y-0.5"
            >
              Join Now
            </Link>
          </div>
        </div>

        <nav
          className="flex gap-4 overflow-x-auto border-t border-[var(--line)] py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function NavLink({
  to,
  children,
}: {
  to: PublicRoute
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="nav-link whitespace-nowrap"
      activeProps={{ className: 'nav-link is-active whitespace-nowrap' }}
    >
      {children}
    </Link>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer mt-20 pb-10 pt-12">
      <div className="page-wrap">
        <div className="mb-10 grid gap-10 md:grid-cols-3">
          <div>
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--forest)] shadow-[0_0_0_3px_var(--forest-glow)]" />
              <span className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[var(--forest)]">
                Jatt Alliance Sindh
              </span>
            </div>

            <p className="m-0 max-w-64 text-[0.85rem] leading-7 text-[var(--ink-soft)]">
              A non-political, non-profit welfare organization serving the Jatt
              community across Sindh through unity, service, education, and
              verified membership.
            </p>
          </div>

          <div>
            <FooterHeading>Platform</FooterHeading>
            <FooterLinks
              links={[
                { to: '/signup', label: 'Become a Member' },
                { to: '/register', label: 'Membership Form' },
                { to: '/dashboard', label: 'My Dashboard' },
                { to: '/login', label: 'Login' },
              ]}
            />
          </div>

          <div>
            <FooterHeading>Organization</FooterHeading>
            <div className="flex flex-col gap-2">
              {[
                'Non-Political',
                'Non-Profit',
                'Non-Sectarian',
                'Welfare Focused',
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-[0.85rem] text-[var(--ink-soft)]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 h-px bg-[var(--line)]" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[0.8rem] text-[var(--ink-muted)]">
            © {new Date().getFullYear()} Jatt Alliance Sindh. All rights
            reserved.
          </p>

          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-light)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-light)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 mt-0 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-[var(--gold)]">
      {children}
    </h3>
  )
}

function FooterLinks({
  links,
}: {
  links: Array<{ to: PublicRoute; label: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className="text-[0.85rem] font-medium text-[var(--ink-soft)] transition hover:text-[var(--forest)]"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

function NotFoundPage() {
  return (
    <main className="px-4 py-12">
      <div className="page-wrap">
        <div className="soft-panel max-w-xl px-10 py-12">
          <div className="ajrak-rule mb-6" />

          <p className="section-eyebrow">Jatt Alliance Sindh</p>

          <h1 className="my-3 font-[var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)]">
            Page not found
          </h1>

          <p className="mb-8 leading-7 text-[var(--ink-soft)]">
            The page you are looking for does not exist or has been moved.
          </p>

          <Link to="/" className="primary-btn">
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  )
}