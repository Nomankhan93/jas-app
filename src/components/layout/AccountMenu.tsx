import { Link } from '@tanstack/react-router'
import { LogOut, UserPlus } from 'lucide-react'
import type { NavItem } from '../../config/navigation'
import { useI18n } from '../../lib/i18n'

export function AccountMenuButton({
  accountInitial,
  accountOpen,
  isLoggedIn,
  mobile = false,
  onToggle,
  unreadCount = 0,
}: {
  accountInitial: string
  accountOpen: boolean
  isLoggedIn: boolean
  mobile?: boolean
  onToggle: () => void
  unreadCount?: number
}) {
  const { t } = useI18n()

  const displayUnreadCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`animate-fade-up relative flex items-center justify-center rounded-full bg-emerald-900 text-sm font-black text-white shadow-sm ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-emerald-800 ${mobile ? 'site-account-trigger-mobile h-10 w-10 text-xs' : 'h-12 w-12'}`}
      aria-label={t('account.open')}
      aria-expanded={accountOpen}
      aria-haspopup="menu"
    >
      {isLoggedIn ? accountInitial : <UserPlus size={18} aria-hidden="true" />}

      {isLoggedIn && unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1.5 py-0.5 text-[0.625rem] font-black leading-none text-white shadow-sm">
          {displayUnreadCount}
        </span>
      ) : null}
    </button>
  )
}

export function AccountMenuPanel({
  accountOpen,
  accountItems,
  isLoggedIn,
  logoutLoading,
  mobile = false,
  onLogout,
  isActive,
}: {
  accountOpen: boolean
  accountItems: NavItem[]
  isLoggedIn: boolean
  logoutLoading: boolean
  mobile?: boolean
  onClose: () => void
  onLogout: () => void
  isActive: (path: string) => boolean
}) {
  const { direction, t } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  if (!accountOpen) return null

  return (
    <div
      dir={direction}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      className={`${mobile ? 'site-account-menu-mobile site-dropdown-scroll absolute right-0 top-full z-[80] mt-3 w-[min(17.75rem,calc(100vw-1rem))]' : 'site-dropdown-scroll absolute right-0 top-full z-[70] mt-3 w-72'} ${textAlignClass} rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}
    >
      {accountItems.map((item) => (
        <CompactDropdownItem key={`${item.to}-${item.label}`} item={item} active={isActive(item.to)} />
      ))}

      {isLoggedIn ? (
        <button
          type="button"
          onClick={onLogout}
          disabled={logoutLoading}
          className="site-account-logout mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} aria-hidden="true" />
          {logoutLoading ? t('auth.loggingOut') : t('auth.logout')}
        </button>
      ) : null}
    </div>
  )
}

function CompactDropdownItem({ item, active }: { item: NavItem; active: boolean }) {
  const { direction } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  const displayBadgeCount = item.badgeCount && item.badgeCount > 99 ? '99+' : item.badgeCount

  return (
    <Link
      to={item.to}
      className={`site-account-menu-item group flex items-center gap-3 rounded-2xl p-3 no-underline transition ${textAlignClass} ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-white hover:text-emerald-900'}`}
    >
      <span className="site-account-menu-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm ring-1 ring-slate-100">
        {item.icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="site-account-menu-label min-w-0 break-words text-sm font-black leading-tight">{item.label}</span>
        {item.badgeCount && item.badgeCount > 0 ? (
          <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-600 px-2 py-1 text-[0.7rem] font-black leading-none text-white shadow-sm">
            {displayBadgeCount}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
