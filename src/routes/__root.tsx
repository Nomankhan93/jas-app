import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Jatt Alliance Sindh',
      },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh membership registration and digital ID card platform.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Header />
      <Outlet />
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

function Header() {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const [authLoading, setAuthLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      const session = data.session

      setIsLoggedIn(Boolean(session))

      if (session?.user?.id) {
        const admin = await checkAdmin(session.user.id)

        if (!mounted) return

        setIsAdmin(admin)
      } else {
        setIsAdmin(false)
      }

      setAuthLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      async function syncAuthState() {
        setIsLoggedIn(Boolean(session))

        if (session?.user?.id) {
          const admin = await checkAdmin(session.user.id)
          setIsAdmin(admin)
        } else {
          setIsAdmin(false)
        }

        setAuthLoading(false)
      }

      void syncAuthState()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (error) {
      console.error('Admin role check failed:', error.message)
      return false
    }

    return Boolean(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMobileOpen(false)
    setIsLoggedIn(false)
    setIsAdmin(false)
    await navigate({ to: '/login', replace: true })
  }

  function isActive(path: string) {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const navBase =
    'relative px-1 py-2 text-sm font-semibold transition-colors hover:text-emerald-800'
  const navActive = 'text-emerald-800'
  const navInactive = 'text-stone-700'

  const navItems: Array<{ to: string; label: string }> = [{ to: '/', label: 'Home' }]

  if (!authLoading && !isLoggedIn) {
    navItems.push({ to: '/signup', label: 'Signup' }, { to: '/login', label: 'Login' })
  }

  if (!authLoading && isLoggedIn) {
    navItems.push(
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/register', label: 'Register' },
    )

    if (isAdmin) {
      navItems.push({ to: '/admin', label: 'Admin' })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6 md:gap-6 md:py-5 lg:px-8">
        <Link
          to="/"
          className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-full bg-emerald-900 px-3 py-2 text-white shadow-lg shadow-emerald-950/10 transition-transform hover:scale-[1.01] sm:flex-none sm:gap-3 sm:px-4"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>

          <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide !text-white sm:text-sm">
            Jatt Alliance Sindh
          </span>

          <span className="shrink-0 rounded-md bg-white/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-widest !text-white sm:px-2.5 sm:text-xs">
            JAS
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              label={item.label}
              active={isActive(item.to)}
              baseClass={navBase}
              activeClass={navActive}
              inactiveClass={navInactive}
            />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {authLoading ? null : isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold !text-white transition-colors hover:bg-emerald-900"
                >
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold !text-white transition-colors hover:bg-emerald-900"
                >
                  Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition-colors hover:bg-stone-50"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition-colors hover:bg-stone-50"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-emerald-900"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-900 shadow-sm md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-stone-200 bg-stone-50 px-3 py-3 shadow-lg md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-xl px-4 py-3 text-sm font-semibold no-underline transition-colors ${
                  isActive(item.to)
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-stone-700 hover:bg-white hover:text-emerald-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {!authLoading ? (
            <div className="mx-auto mt-3 grid max-w-7xl gap-2 border-t border-stone-200 pt-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-900 shadow-sm"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-900 shadow-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold !text-white shadow-sm"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}

function NavLink({
  to,
  label,
  active,
  baseClass,
  activeClass,
  inactiveClass,
}: {
  to: string
  label: string
  active: boolean
  baseClass: string
  activeClass: string
  inactiveClass: string
}) {
  return (
    <Link
      to={to}
      className={[
        baseClass,
        active ? activeClass : inactiveClass,
        active
          ? 'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-emerald-700'
          : '',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}