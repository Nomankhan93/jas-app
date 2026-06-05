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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  GraduationCap,
  HeartPulse,
  HandHeart,
  Landmark,
  CalendarDays,
  IdCard,
  Images,
  LogOut,
  Network,
  ScrollText,
  ShieldCheck,
  Trophy,
  UserPlus,
} from 'lucide-react'
import {
  I18nProvider,
  LanguageSwitcher,
  useI18n,
  type TranslationKey,
} from '../lib/i18n'
import { supabase } from '../lib/supabase/client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
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

type NavItem = {
  to: string
  label: string
  icon: ReactNode
}

type ProgramItem = NavItem & { description: string }
type PublicPageItem = NavItem & { description: string }
type HeaderMenuKey = 'programs' | 'more' | 'account' | null

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

const publicPageItems: PublicPageItem[] = [
  {
    to: '/about',
    label: 'About JAS',
    icon: <ShieldCheck size={16} />,
    description: 'Introduction, purpose and community platform overview',
  },
  {
    to: '/vision-mission',
    label: 'Vision & Mission',
    icon: <Landmark size={16} />,
    description: 'JAS vision, mission and service direction',
  },
  {
    to: '/manifesto',
    label: 'Manifesto / Manshoor',
    icon: <ScrollText size={16} />,
    description: 'Core manifesto points and public commitment',
  },
  {
    to: '/constitution',
    label: 'Constitution',
    icon: <BookOpenText size={16} />,
    description: 'Rules, structure and constitutional framework',
  },
  {
    to: '/cwc',
    label: 'Central Working Committee',
    icon: <FileText size={16} />,
    description: 'Central cabinet and top-level governing body',
  },
  {
    to: '/committees',
    label: 'Committees',
    icon: <Network size={16} />,
    description: 'Central, divisional, district and taluka committee office bearers',
  },
  {
    to: '/gallery',
    label: 'Gallery',
    icon: <Images size={16} />,
    description: 'Program photos, meetings and community activity',
  },
  {
    to: '/events',
    label: 'Events',
    icon: <CalendarDays size={16} />,
    description: 'Upcoming events, meetings and public activities',
  },
  {
    to: '/contact',
    label: 'Contact',
    icon: <HandHeart size={16} />,
    description: 'Contact, WhatsApp and coordination details',
  },
]

const programItems: ProgramItem[] = [
  {
    to: '/programs/education',
    label: 'Education Support',
    icon: <GraduationCap size={16} />,
    description: 'Scholarships, fee support and skills training',
  },
  {
    to: '/programs/health',
    label: 'Health Assistance',
    icon: <HeartPulse size={16} />,
    description: 'Medical help and emergency treatment cases',
  },
  {
    to: '/programs/welfare',
    label: 'Welfare Cases',
    icon: <HandHeart size={16} />,
    description: 'Financial, ration, orphan and emergency support',
  },
  {
    to: '/programs/employment',
    label: 'Employment Program',
    icon: <BriefcaseBusiness size={16} />,
    description: 'CV database, skills and placement support',
  },
]

const publicPageTranslationKeys: Record<string, string> = {
  '/about': 'about',
  '/vision-mission': 'visionMission',
  '/manifesto': 'manifesto',
  '/constitution': 'constitution',
  '/cwc': 'cwc',
  '/committees': 'committees',
  '/gallery': 'gallery',
  '/events': 'events',
  '/contact': 'contact',
}

const programTranslationKeys: Record<string, string> = {
  '/programs/education': 'education',
  '/programs/health': 'health',
  '/programs/welfare': 'welfare',
  '/programs/employment': 'employment',
}

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


function NotFoundPage() {
  return (
    <RootDocument>
      <I18nProvider>
        <NotFoundPageContent />
      </I18nProvider>
    </RootDocument>
  )
}

function NotFoundPageContent() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf9f4_0%,#f6f2e9_55%,#f8f5ef_100%)] text-stone-950">
      <Header compact />

      <main className="relative z-10 px-3 py-10 sm:px-4 sm:py-16">
        <section className="page-wrap overflow-hidden rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
            <ShieldCheck size={30} />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            {t('notFound.eyebrow')}
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {t('notFound.title')}
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {t('notFound.description')}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="primary-btn no-underline">
              {t('notFound.home')}
            </Link>

            <Link to="/dashboard" className="secondary-btn no-underline">
              {t('notFound.dashboard')}
            </Link>

            <Link to="/contact" className="secondary-btn no-underline">
              {t('notFound.contact')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}


function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('JAS service worker registration failed:', error)
      })
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker, { once: true })

    return () => {
      window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}

function Header({ compact }: { compact: boolean }) {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [authLoading, setAuthLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')
  const [openMenu, setOpenMenu] = useState<HeaderMenuKey>(null)
  const headerRef = useRef<HTMLElement | null>(null)

  const programsOpen = openMenu === 'programs'
  const moreOpen = openMenu === 'more'
  const accountOpen = openMenu === 'account'

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
    async (user?: { id: string; email?: string | null } | null) => {
      const userId = user?.id ?? null

      setIsLoggedIn(Boolean(userId))
      setAccountEmail(user?.email ?? '')

      if (userId) setIsAdmin(await checkAdmin(userId))
      else setIsAdmin(false)

      setAuthLoading(false)
    },
    [checkAdmin],
  )

  useEffect(() => {
    setOpenMenu(null)
  }, [pathname])

  useEffect(() => {
    if (!openMenu) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target

      if (target instanceof Node && headerRef.current?.contains(target)) {
        return
      }

      setOpenMenu(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenu])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        console.error('Session load failed:', error.message)
        setIsLoggedIn(false)
        setIsAdmin(false)
        setAccountEmail('')
        setAuthLoading(false)
        return
      }
      await syncAuthState(data.session?.user ?? null)
    }

    void loadSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      void syncAuthState(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncAuthState])

  const localizedPublicPageItems = useMemo(() => {
    return publicPageItems.map((item) => {
      const key = publicPageTranslationKeys[item.to]

      if (!key) return item

      return {
        ...item,
        label: t(`public.${key}.label` as TranslationKey),
        description: t(`public.${key}.description` as TranslationKey),
      }
    })
  }, [language, t])

  const localizedProgramItems = useMemo(() => {
    return programItems.map((item) => {
      const key = programTranslationKeys[item.to]

      if (!key) return item

      return {
        ...item,
        label: t(`program.${key}.label` as TranslationKey),
        description: t(`program.${key}.description` as TranslationKey),
      }
    })
  }, [language, t])

  const moreActive = localizedPublicPageItems.some((item) => isActive(item.to))
  const programsActive = pathname.startsWith('/programs/')
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'
  const dashboardLabel = isAdmin ? t('nav.adminPanel') : t('nav.dashboard')
  const accountInitial = (
    accountEmail.split('@')[0]?.trim().charAt(0) ||
    (isAdmin ? 'A' : 'U')
  ).toUpperCase()

  const accountItems = useMemo(() => {
    if (authLoading) return []

    if (!isLoggedIn) {
      return [
        { to: '/login', label: t('auth.login'), icon: <UserPlus size={16} /> },
        { to: '/signup', label: t('auth.joinNow'), icon: <IdCard size={16} /> },
      ] satisfies NavItem[]
    }

    return [
      { to: dashboardPath, label: dashboardLabel, icon: <ShieldCheck size={16} /> },
      { to: '/card', label: t('nav.digitalCard'), icon: <IdCard size={16} /> },
      { to: '/designation-card', label: t('nav.officeBearerCard'), icon: <ShieldCheck size={16} /> },
      { to: '/notifications', label: t('nav.updates'), icon: <Bell size={16} /> },
      { to: '/donors', label: t('nav.donors'), icon: <Trophy size={16} /> },
      { to: '/register', label: t('nav.register'), icon: <UserPlus size={16} /> },
    ] satisfies NavItem[]
  }, [accountEmail, authLoading, dashboardLabel, dashboardPath, isLoggedIn, t])

  function toggleMenu(menu: Exclude<HeaderMenuKey, null>) {
    setOpenMenu((current) => (current === menu ? null : menu))
  }

  function closeMenus() {
    setOpenMenu(null)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
      setLogoutLoading(false)
      return
    }
    setOpenMenu(null)
    setIsLoggedIn(false)
    setIsAdmin(false)
    setAccountEmail('')
    setLogoutLoading(false)
    await navigate({ to: '/login', replace: true })
  }

  function isActive(path: string) {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  function AccountMenuPanel({ mobile = false }: { mobile?: boolean }) {
    if (!accountOpen) return null

    return (
      <div
        onClick={closeMenus}
        className={`${mobile ? 'absolute right-0 top-full z-[80] mt-3 w-[min(18rem,calc(100vw-1.5rem))]' : 'absolute right-0 top-full z-[70] mt-3 w-72'} rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}
      >
        {accountItems.map((item) => (
          <CompactDropdownItem key={item.to} item={item} active={isActive(item.to)} />
        ))}

        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" />
            {logoutLoading ? t('auth.loggingOut') : t('auth.logout')}
          </button>
        ) : null}
      </div>
    )
  }

  function AccountMenuButton({ mobile = false }: { mobile?: boolean }) {
    return (
      <button
        type="button"
        onClick={() => toggleMenu('account')}
        className={`animate-fade-up flex items-center justify-center rounded-full bg-emerald-900 text-sm font-black text-white shadow-sm ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-emerald-800 ${mobile ? 'h-11 w-11' : 'h-12 w-12'}`}
        aria-label={t('account.open')}
        aria-expanded={accountOpen}
        aria-haspopup="menu"
      >
        {isLoggedIn ? accountInitial : <UserPlus size={18} aria-hidden="true" />}
      </button>
    )
  }

  return (
    <header ref={headerRef} dir="ltr" className={`site-header ${compact ? 'shadow-[0_10px_30px_rgba(15,23,42,0.06)]' : ''}`}>
      <div className="site-header-inner page-wrap flex items-center gap-3 py-3">
        <div className="site-brand-wrap animate-fade-up min-w-0 flex-1 sm:flex-none">
          <Link to="/" className="site-brand-link brand-pill lift-hover pressable min-w-0 rounded-[1.35rem] px-3 py-2.5 sm:px-4" aria-label="Jatt Alliance Sindh home">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><ShieldCheck size={18} className="text-[#d8a949]" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate font-[Manrope,Inter,sans-serif] text-xl font-extrabold tracking-tight text-white sm:text-2xl">{t('brand.name')}</span><span className="mt-0.5 block truncate text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-white/60">{t('brand.platform')}</span></span>
            <span className="hidden shrink-0 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white/90 sm:inline-flex">JAS</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-4 xl:gap-5 lg:flex" aria-label="Main navigation">
          <NavLink to="/" label={t('nav.home')} active={isActive('/')} delayClass="delay-1" />

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu('programs')}
              className={`nav-link animate-fade-up delay-2 gap-1 ${programsActive ? 'is-active' : ''}`}
              aria-expanded={programsOpen}
              aria-haspopup="menu"
            >
              {t('nav.programs')}
              <ChevronDown size={14} className={`transition ${programsOpen ? 'rotate-180' : ''}`} />
            </button>
            {programsOpen ? (
              <div onClick={closeMenus} className="absolute left-0 top-full z-[60] mt-4 w-[320px] rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                {localizedProgramItems.map((item) => <ProgramDropdownItem key={item.to} item={item} active={isActive(item.to)} />)}
              </div>
            ) : null}
          </div>

          <NavLink to="/donate" label={t('nav.donate')} active={isActive('/donate')} delayClass="delay-3" />
          <NavLink to="/news" label={t('nav.news')} active={isActive('/news')} delayClass="delay-4" />

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu('more')}
              className={`nav-link animate-fade-up delay-5 gap-1 ${moreActive ? 'is-active' : ''}`}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              {t('nav.more')}
              <ChevronDown size={14} className={`transition ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen ? (
              <div onClick={closeMenus} className="absolute right-0 top-full z-[60] mt-4 w-[420px] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <DropdownGroup title={t('nav.organization')}>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {localizedPublicPageItems.map((item) => <PublicPageDropdownItem key={item.to} item={item} active={isActive(item.to)} />)}
                  </div>
                </DropdownGroup>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:gap-3 lg:flex">
          <LanguageSwitcher />

          {authLoading ? (
            <div className="h-11 w-28 animate-pulse rounded-[var(--r-lg)] bg-white/25" />
          ) : isLoggedIn ? (
            <>
              <Link to={dashboardPath} className="primary-btn animate-fade-up pressable lift-hover">
                {dashboardLabel}
              </Link>

              <div className="relative">
                <AccountMenuButton />
                <AccountMenuPanel />
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="secondary-btn animate-fade-up pressable lift-hover">{t('auth.login')}</Link>
              <Link to="/signup" className="animate-fade-up inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-7 py-3 text-sm font-black text-[#102719] shadow-[0_14px_32px_rgba(196,145,44,0.28)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.985]">{t('auth.joinNow')}</Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />

          {authLoading ? (
            <div className="h-11 w-11 animate-pulse rounded-full bg-emerald-900/25" />
          ) : (
            <div className="relative">
              <AccountMenuButton mobile />
              <AccountMenuPanel mobile />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropdownGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-50/70 p-2 ring-1 ring-slate-100">
      <p className="px-2 pb-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      {children}
    </section>
  )
}

function CompactDropdownItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={`group flex items-center gap-3 rounded-2xl p-3 no-underline transition ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-white hover:text-emerald-900'}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm ring-1 ring-slate-100">
        {item.icon}
      </span>
      <span className="min-w-0 text-sm font-black leading-tight">{item.label}</span>
    </Link>
  )
}

function PublicPageDropdownItem({ item, active }: { item: PublicPageItem; active: boolean }) {
  return <Link to={item.to} className={`group flex items-start gap-3 rounded-2xl p-3 no-underline transition ${active ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50 hover:text-amber-900'}`}><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 group-hover:bg-white">{item.icon}</span><span className="min-w-0"><span className="block text-sm font-black">{item.label}</span><span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span></span></Link>
}

function ProgramDropdownItem({ item, active }: { item: ProgramItem; active: boolean }) {
  return <Link to={item.to} className={`group flex items-start gap-3 rounded-2xl p-3 no-underline transition ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'}`}><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-white">{item.icon}</span><span className="min-w-0"><span className="block text-sm font-black">{item.label}</span><span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span></span></Link>
}

function NavLink({ to, label, active, delayClass }: { to: string; label: string; active: boolean; delayClass: string }) {
  return <Link to={to} className={`nav-link animate-fade-up ${delayClass} ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>{label}</Link>
}

