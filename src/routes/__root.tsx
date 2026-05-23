// src/routes/__root.tsx
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
import { ChevronRight, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Jatt Alliance Sindh' },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh membership registration and digital ID card platform.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <div className="min-h-screen bg-[linear-gradient(180deg,#fbf9f4_0%,#f6f2e9_55%,#f8f5ef_100%)] text-stone-950">
        <div className="animate-fade-in pointer-events-none fixed inset-x-0 top-0 z-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(196,145,44,0.14),transparent_40%),radial-gradient(circle_at_top_right,rgba(11,42,29,0.10),transparent_35%)]" />
        <Header />
        <div className="animate-fade-up relative z-10">
          <Outlet />
        </div>
      </div>
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
    <header className="site-header">
      <div className="page-wrap flex items-center gap-3 py-3">
        <div className="animate-fade-up min-w-0 flex-1 sm:flex-none">
          <Link
            to="/"
            className="brand-pill lift-hover pressable min-w-0 rounded-[1.35rem] px-3 py-2.5 sm:px-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <ShieldCheck size={18} className="text-[#d8a949]" />
            </span>

            <span className="min-w-0">
              <span className="block truncate font-[Cormorant_Garamond,serif] text-xl font-bold tracking-tight text-white sm:text-2xl">
                Jatt Alliance Sindh
              </span>
              <span className="mt-0.5 block truncate text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-white/60">
                Member Platform
              </span>
            </span>

            <span className="hidden shrink-0 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white/90 sm:inline-flex">
              JAS
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              label={item.label}
              active={isActive(item.to)}
              delayClass={getDelayClass(index)}
            />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {authLoading ? null : isLoggedIn ? (
            <>
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="primary-btn animate-fade-up pressable lift-hover"
              >
                {isAdmin ? 'Admin Panel' : 'Dashboard'}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="secondary-btn animate-fade-up pressable lift-hover"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="secondary-btn animate-fade-up pressable lift-hover">
                Login
              </Link>

              <Link
                to="/signup"
                className="animate-fade-up inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-7 py-3 text-sm font-black text-[#102719] shadow-[0_14px_32px_rgba(196,145,44,0.28)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.985]"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="secondary-btn animate-fade-up pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl px-0 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[var(--line)] bg-[#fbf8f2] px-3 pb-4 pt-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:hidden">
          <div className="soft-panel animate-slide-down page-wrap max-w-7xl rounded-[1.5rem] bg-white/90 p-2 backdrop-blur">
            <nav className="grid gap-1">
              {navItems.map((item, index) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`animate-fade-up ${getDelayClass(index)} inline-flex items-center justify-between rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                    isActive(item.to)
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-emerald-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </nav>

            {!authLoading ? (
              <div className="mt-3 border-t border-[var(--line)] pt-3">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="secondary-btn pressable w-full"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Logout
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" className="secondary-btn pressable px-4">
                      Login
                    </Link>
                    <Link to="/signup" className="primary-btn pressable px-4">
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}

function NavLink({
  to,
  label,
  active,
  delayClass,
}: {
  to: string
  label: string
  active: boolean
  delayClass: string
}) {
  return (
    <Link
      to={to}
      className={`nav-link animate-fade-up ${delayClass} ${active ? 'is-active' : ''}`}
    >
      {label}
    </Link>
  )
}

function getDelayClass(index: number) {
  const delays = ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5']
  return delays[index] ?? 'delay-5'
}