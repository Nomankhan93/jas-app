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
}: {
  accountInitial: string
  accountOpen: boolean
  isLoggedIn: boolean
  mobile?: boolean
  onToggle: () => void
}) {
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`animate-fade-up flex items-center justify-center rounded-full bg-emerald-900 text-sm font-black text-white shadow-sm ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-emerald-800 ${mobile ? 'site-account-trigger-mobile h-10 w-10 text-xs' : 'h-12 w-12'}`}
      aria-label={t('account.open')}
      aria-expanded={accountOpen}
      aria-haspopup="menu"
    >
      {isLoggedIn ? accountInitial : <UserPlus size={18} aria-hidden="true" />}
    </button>
  )
}

export function AccountMenuPanel({
  accountOpen,
  accountItems,
  isLoggedIn,
  logoutLoading,
  mobile = false,
  onClose,
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
      onClick={onClose}
      className={`${mobile ? 'site-account-menu-mobile absolute right-0 top-full z-[80] mt-3 w-[min(17.75rem,calc(100vw-1rem))]' : 'absolute right-0 top-full z-[70] mt-3 w-72'} ${textAlignClass} rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}
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

  return (
    <Link
      to={item.to}
      className={`site-account-menu-item group flex items-center gap-3 rounded-2xl p-3 no-underline transition ${textAlignClass} ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-white hover:text-emerald-900'}`}
    >
      <span className="site-account-menu-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm ring-1 ring-slate-100">
        {item.icon}
      </span>
      <span className="site-account-menu-label min-w-0 break-words text-sm font-black leading-tight">{item.label}</span>
    </Link>
  )
}
