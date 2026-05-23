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
import { LogOut } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-3 rounded-full bg-emerald-900 px-4 py-2 text-white shadow-lg shadow-emerald-950/10 transition-transform hover:scale-[1.01]"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>

          <span className="text-sm font-bold uppercase tracking-wide !text-white">
            Jatt Alliance Sindh
          </span>

          <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-widest !text-white">
            JAS
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink
            to="/"
            label="Home"
            active={isActive('/')}
            baseClass={navBase}
            activeClass={navActive}
            inactiveClass={navInactive}
          />

          {!authLoading && !isLoggedIn ? (
            <>
              <NavLink
                to="/signup"
                label="Signup"
                active={isActive('/signup')}
                baseClass={navBase}
                activeClass={navActive}
                inactiveClass={navInactive}
              />

              <NavLink
                to="/login"
                label="Login"
                active={isActive('/login')}
                baseClass={navBase}
                activeClass={navActive}
                inactiveClass={navInactive}
              />
            </>
          ) : null}

          {!authLoading && isLoggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                label="Dashboard"
                active={isActive('/dashboard')}
                baseClass={navBase}
                activeClass={navActive}
                inactiveClass={navInactive}
              />

              <NavLink
                to="/register"
                label="Register"
                active={isActive('/register')}
                baseClass={navBase}
                activeClass={navActive}
                inactiveClass={navInactive}
              />

              {isAdmin ? (
                <NavLink
                  to="/admin"
                  label="Admin"
                  active={isActive('/admin')}
                  baseClass={navBase}
                  activeClass={navActive}
                  inactiveClass={navInactive}
                />
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {authLoading ? null : isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="hidden rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold !text-white transition-colors hover:bg-emerald-900 sm:inline-flex"
                >
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="hidden rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold !text-white transition-colors hover:bg-emerald-900 sm:inline-flex"
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
      </div>
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