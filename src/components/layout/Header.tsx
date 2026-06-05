import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getAdminAccountItems,
  getLoggedOutAccountItems,
  getMemberAccountItems,
  programItems,
  programTranslationKeys,
  publicPageItems,
  publicPageTranslationKeys,
  type HeaderMenuKey,
} from '../../config/navigation'
import { useAuthRole } from '../../hooks/useAuthRole'
import {
  LanguageSwitcher,
  useI18n,
  type TranslationKey,
} from '../../lib/i18n'
import { AccountMenuButton, AccountMenuPanel } from './AccountMenu'
import { MoreDropdown } from './MoreDropdown'
import { NavLink } from './NavLink'
import { ProgramsDropdown } from './ProgramsDropdown'

export function Header({ compact }: { compact: boolean }) {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [openMenu, setOpenMenu] = useState<HeaderMenuKey>(null)
  const headerRef = useRef<HTMLElement | null>(null)

  const {
    authLoading,
    logoutLoading,
    isLoggedIn,
    isAdmin,
    accountInitial,
    logout,
  } = useAuthRole()

  const programsOpen = openMenu === 'programs'
  const moreOpen = openMenu === 'more'
  const accountOpen = openMenu === 'account'

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

  const dashboardPath = isAdmin ? '/admin' : '/dashboard'
  const dashboardLabel = isAdmin ? t('nav.adminPanel') : t('nav.dashboard')
  const programsActive = pathname.startsWith('/programs/')
  const moreActive = localizedPublicPageItems.some((item) => isActive(item.to))
  const brandCompactName = language === 'en' ? 'Jatt Alliance' : t('brand.name')

  const accountItems = useMemo(() => {
    if (authLoading) return []

    if (!isLoggedIn) {
      return getLoggedOutAccountItems({
        login: t('auth.login'),
        joinNow: t('auth.joinNow'),
        register: t('nav.register'),
      })
    }

    const memberItems = getMemberAccountItems({
      dashboard: dashboardLabel,
      digitalCard: t('nav.digitalCard'),
      officeBearerCard: t('nav.officeBearerCard'),
      updates: t('nav.updates'),
      donors: t('nav.donors'),
      register: t('nav.register'),
    })

    if (!isAdmin) return memberItems

    const memberOnlyItems = memberItems.filter((item) => item.to !== '/admin')

    return [
      ...getAdminAccountItems({
        adminPanel: t('nav.adminPanel'),
        members: 'Members',
        programs: t('nav.programs'),
        donations: 'Donations',
        reports: 'Reports',
      }),
      ...memberOnlyItems,
    ]
  }, [authLoading, dashboardLabel, isAdmin, isLoggedIn, t])

  function toggleMenu(menu: Exclude<HeaderMenuKey, null>) {
    setOpenMenu((current) => (current === menu ? null : menu))
  }

  function closeMenus() {
    setOpenMenu(null)
  }

  async function handleLogout() {
    const loggedOut = await logout()

    if (!loggedOut) return

    setOpenMenu(null)
    await navigate({ to: '/login', replace: true })
  }

  function isActive(path: string) {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <header
      ref={headerRef}
      dir="ltr"
      className={`site-header ${compact ? 'shadow-[0_10px_30px_rgba(15,23,42,0.06)]' : ''}`}
    >
      <div className="site-header-inner page-wrap flex items-center gap-3 py-3">
        <div className="site-brand-wrap animate-fade-up min-w-0 flex-1 sm:flex-none">
          <Link
            to="/"
            className="site-brand-link brand-pill lift-hover pressable min-w-0 rounded-[1.35rem] px-3 py-2.5 sm:px-4"
            aria-label="Jatt Alliance Sindh home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <ShieldCheck size={18} className="text-[#d8a949]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="hidden truncate font-[Manrope,Inter,sans-serif] text-xl font-extrabold tracking-tight text-white sm:block sm:text-2xl">
                {t('brand.name')}
              </span>
              <span className="block truncate font-[Manrope,Inter,sans-serif] text-lg font-extrabold tracking-tight text-white sm:hidden">
                {brandCompactName}
              </span>
              <span className="mt-0.5 block truncate text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-white/60">
                {t('brand.platform')}
              </span>
            </span>
            <span className="hidden shrink-0 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white/90 sm:inline-flex">
              JAS
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-4 xl:gap-5 lg:flex" aria-label="Main navigation">
          <NavLink to="/" label={t('nav.home')} active={isActive('/')} delayClass="delay-1" />

          <ProgramsDropdown
            label={t('nav.programs')}
            items={localizedProgramItems}
            open={programsOpen}
            active={programsActive}
            onToggle={() => toggleMenu('programs')}
            onClose={closeMenus}
            isActive={isActive}
          />

          <NavLink to="/donate" label={t('nav.donate')} active={isActive('/donate')} delayClass="delay-3" />
          <NavLink to="/news" label={t('nav.news')} active={isActive('/news')} delayClass="delay-4" />

          <MoreDropdown
            label={t('nav.more')}
            groupTitle={t('nav.organization')}
            items={localizedPublicPageItems}
            open={moreOpen}
            active={moreActive}
            onToggle={() => toggleMenu('more')}
            onClose={closeMenus}
            isActive={isActive}
          />
        </nav>

        <div className="site-header-desktop-actions ml-auto hidden items-center gap-2 xl:gap-3 lg:flex">
          <LanguageSwitcher />

          {authLoading ? (
            <div className="h-11 w-28 animate-pulse rounded-[var(--r-lg)] bg-white/25" />
          ) : isLoggedIn ? (
            <>
              <Link to={dashboardPath} className="primary-btn animate-fade-up pressable lift-hover">
                {dashboardLabel}
              </Link>

              <div className="relative">
                <AccountMenuButton
                  accountInitial={accountInitial}
                  accountOpen={accountOpen}
                  isLoggedIn={isLoggedIn}
                  onToggle={() => toggleMenu('account')}
                />
                <AccountMenuPanel
                  accountOpen={accountOpen}
                  accountItems={accountItems}
                  isLoggedIn={isLoggedIn}
                  logoutLoading={logoutLoading}
                  onClose={closeMenus}
                  onLogout={() => void handleLogout()}
                  isActive={isActive}
                />
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="secondary-btn animate-fade-up pressable lift-hover">
                {t('auth.login')}
              </Link>
              <Link
                to="/signup"
                className="animate-fade-up inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-7 py-3 text-sm font-black text-[#102719] shadow-[0_14px_32px_rgba(196,145,44,0.28)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.985]"
              >
                {t('auth.joinNow')}
              </Link>
            </>
          )}
        </div>

        <div className="site-header-mobile-actions ml-auto flex items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />

          {authLoading ? (
            <div className="h-11 w-11 animate-pulse rounded-full bg-emerald-900/25" />
          ) : (
            <div className="relative">
              <AccountMenuButton
                accountInitial={accountInitial}
                accountOpen={accountOpen}
                isLoggedIn={isLoggedIn}
                mobile
                onToggle={() => toggleMenu('account')}
              />
              <AccountMenuPanel
                accountOpen={accountOpen}
                accountItems={accountItems}
                isLoggedIn={isLoggedIn}
                logoutLoading={logoutLoading}
                mobile
                onClose={closeMenus}
                onLogout={() => void handleLogout()}
                isActive={isActive}
              />
            </div>
          )}
        </div>
      </div>

      <div className="site-mobile-main-nav-wrap lg:hidden">
        <nav className="site-mobile-main-nav page-wrap" aria-label="Mobile main navigation">
          <NavLink to="/" label={t('nav.home')} active={isActive('/')} delayClass="delay-1" />

          <ProgramsDropdown
            label={t('nav.programs')}
            items={localizedProgramItems}
            open={programsOpen}
            active={programsActive}
            onToggle={() => toggleMenu('programs')}
            onClose={closeMenus}
            isActive={isActive}
          />

          <NavLink to="/donate" label={t('nav.donate')} active={isActive('/donate')} delayClass="delay-3" />
          <NavLink to="/news" label={t('nav.news')} active={isActive('/news')} delayClass="delay-4" />

          <MoreDropdown
            label={t('nav.more')}
            groupTitle={t('nav.organization')}
            items={localizedPublicPageItems}
            open={moreOpen}
            active={moreActive}
            onToggle={() => toggleMenu('more')}
            onClose={closeMenus}
            isActive={isActive}
          />
        </nav>
      </div>
    </header>
  )
}
