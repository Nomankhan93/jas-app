import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PublicPageItem } from '../../config/navigation'
import { useI18n } from '../../lib/i18n'

export function MoreDropdown({
  label,
  groupTitle,
  items,
  open,
  active,
  onToggle,
  onClose,
  isActive,
}: {
  label: string
  groupTitle: string
  items: PublicPageItem[]
  open: boolean
  active: boolean
  onToggle: () => void
  onClose: () => void
  isActive: (path: string) => boolean
}) {
  const { direction } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`nav-link animate-fade-up delay-5 gap-1 ${active ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          onClick={onClose}
          dir={direction}
          className={`absolute right-0 top-full z-[60] mt-4 w-[min(420px,calc(100vw-1rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)] ${textAlignClass}`}
        >
          <DropdownGroup title={groupTitle}>
            <div className="grid gap-1 sm:grid-cols-2">
              {items.map((item) => (
                <PublicPageDropdownItem key={item.to} item={item} active={isActive(item.to)} />
              ))}
            </div>
          </DropdownGroup>
        </div>
      ) : null}
    </div>
  )
}

function DropdownGroup({ title, children }: { title: string; children: ReactNode }) {
  const { direction } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  return (
    <section className="rounded-2xl bg-slate-50/70 p-2 ring-1 ring-slate-100">
      <p className={`px-2 pb-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500 ${textAlignClass}`}>
        {title}
      </p>
      {children}
    </section>
  )
}

function PublicPageDropdownItem({ item, active }: { item: PublicPageItem; active: boolean }) {
  const { direction } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  return (
    <Link
      to={item.to}
      className={`group flex items-start gap-3 rounded-2xl p-3 no-underline transition ${textAlignClass} ${active ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50 hover:text-amber-900'}`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 group-hover:bg-white">
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{item.label}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">
          {item.description}
        </span>
      </span>
    </Link>
  )
}
