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
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronRight,
  GraduationCap,
  HeartPulse,
  HandHeart,
  Home,
  IdCard,
  LogOut,
  Menu,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Jatt Alliance Sindh | Member & Programs Portal' },
      {
        name: 'description',
        content:
          'Jatt Alliance Sindh membership registration, admin approval, QR verification, digital ID card and member-verified education, health and welfare support platform.',
      },
      { name: 'theme-color', content: '#0b2a1d' },
      {
        property: 'og:title',
        content: 'Jatt Alliance Sindh Member & Programs Portal',
      },
      {
        property: 'og:description',
        content:
          'Register, verify and access Jatt Alliance Sindh digital membership, education, health and welfare support programs.',
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

type NavItem = {
  to: string
  label: string
  icon: ReactNode
}

const adminRoleNames = [
  'admin',
  'super_admin',
  'membership_admin',
  'education_admin',
  'health_admin',
  'employment_admin',
  'ration_admin',
  'welfare_admin',
  'finance_admin',
] as const

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
      <div className="min-h-screen bg-[linear-gradient(180deg,#fbf9f4_0%,#f6f2e9_55%,#f8f5ef_100%)] text-stone-950">
        <div
          className="animate-fade-in pointer-events-none fixed inset-x-0 top-0 z-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(196,145,44,0.14),transparent_40%),radial-gradient(circle_at_top_right,rgba(11,42,29,0.10),transparent_35%)]"
          aria-hidden="true"
        />

        {!isPublicVerifyPage ? <Header compact={isCardPreviewPage} /> : null}

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

function Header({ compact }: { compact: boolean }) {
  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const [authLoading, setAuthLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const checkAdmin = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', adminRoleNames)
      .limit(1)

    if (error) {
      console.error('Admin role check failed:', error.message)
      return false
    }

    return Boolean(data?.length)
  }, [])

  const syncAuthState = useCallback(
    async (userId?: string | null) => {
      setIsLoggedIn(Boolean(userId))

      if (userId) {
        const admin = await checkAdmin(userId)
        setIsAdmin(admin)
      } else {
        setIsAdmin(false)
      }

      setAuthLoading(false)
    },
    [checkAdmin],
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Session load failed:', error.message)
        setIsLoggedIn(false)
        setIsAdmin(false)
        setAuthLoading(false)
        return
      }

      const userId = data.session?.user?.id ?? null

      if (userId) {
        setIsLoggedIn(true)
        const admin = await checkAdmin(userId)

        if (!mounted) return

        setIsAdmin(admin)
      } else {
        setIsLoggedIn(false)
        setIsAdmin(false)
      }

      setAuthLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      void syncAuthState(session?.user?.id ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkAdmin, syncAuthState])

  const navItems = useMemo(() => {
    const items: NavItem[] = [
      {
        to: '/',
        label: 'Home',
        icon: <Home size={16} />,
      },
      {
        to: '/programs/education',
        label: 'Education',
        icon: <GraduationCap size={16} />,
      },
      {
        to: '/programs/health',
        label: 'Health',
        icon: <HeartPulse size={16} />,
      },
      {
        to: '/programs/welfare',
        label: 'Welfare',
        icon: <HandHeart size={16} />,
      },
    ]

    if (authLoading) return items

    if (!isLoggedIn) {
      items.push({
        to: '/signup',
        label: 'Membership',
        icon: <IdCard size={16} />,
      })

      return items
    }

    items.push(
      {
        to: '/register',
        label: 'Register',
        icon: <UserPlus size={16} />,
      },
      {
        to: '/card',
        label: 'Card',
        icon: <IdCard size={16} />,
      },
    )

    if (isAdmin) {
      items.push({
        to: '/admin',
        label: 'Admin',
        icon: <ShieldCheck size={16} />,
      })
    }

    return items
  }, [authLoading, isAdmin, isLoggedIn])

  async function handleLogout() {
    setLogoutLoading(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error.message)
      setLogoutLoading(false)
      return
    }

    setMobileOpen(false)
    setIsLoggedIn(false)
    setIsAdmin(false)
    setLogoutLoading(false)

    await navigate({ to: '/login', replace: true })
  }

  function isActive(path: string) {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <header
      className={`site-header ${compact ? 'shadow-[0_10px_30px_rgba(15,23,42,0.06)]' : ''}`}
    >
      <div className="page-wrap flex items-center gap-3 py-3">
        <div className="animate-fade-up min-w-0 flex-1 sm:flex-none">
          <Link
            to="/"
            className="brand-pill lift-hover pressable min-w-0 rounded-[1.35rem] px-3 py-2.5 sm:px-4"
            aria-label="Jatt Alliance Sindh home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <ShieldCheck
                size={18}
                className="text-[#d8a949]"
                aria-hidden="true"
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate font-[Manrope,Inter,sans-serif] text-xl font-extrabold tracking-tight text-white sm:text-2xl">
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

        <nav className="hidden items-center gap-4 lg:gap-5 md:flex" aria-label="Main navigation">
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
          {authLoading ? (
            <div className="h-11 w-28 animate-pulse rounded-[var(--r-lg)] bg-white/25" />
          ) : isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="primary-btn animate-fade-up pressable lift-hover"
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="primary-btn animate-fade-up pressable lift-hover"
                >
                  Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="secondary-btn animate-fade-up pressable lift-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut size={16} aria-hidden="true" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="secondary-btn animate-fade-up pressable lift-hover"
              >
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
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-[var(--line)] bg-[#fbf8f2] px-3 pb-4 pt-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:hidden"
        >
          <div className="soft-panel animate-slide-down page-wrap max-w-7xl rounded-[1.5rem] bg-white/90 p-2 backdrop-blur">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {navItems.map((item, index) => (
                <MobileNavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item.to)}
                  delayClass={getDelayClass(index)}
                />
              ))}
            </nav>

            {!authLoading ? (
              <div className="mt-3 border-t border-[var(--line)] pt-3">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="secondary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {logoutLoading ? 'Logging out...' : 'Logout'}
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
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({
  to,
  label,
  icon,
  active,
  delayClass,
}: {
  to: string
  label: string
  icon: ReactNode
  active: boolean
  delayClass: string
}) {
  return (
    <Link
      to={to}
      className={`animate-fade-up ${delayClass} inline-flex items-center justify-between rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
        active
          ? 'bg-emerald-50 text-emerald-900'
          : 'text-stone-700 hover:bg-stone-50 hover:text-emerald-900'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight size={16} />
    </Link>
  )
}

function getDelayClass(index: number) {
  const delays = ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5']
  return delays[index] ?? 'delay-5'
}