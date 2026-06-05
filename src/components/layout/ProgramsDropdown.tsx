import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import type { ProgramItem } from '../../config/navigation'
import { useI18n } from '../../lib/i18n'

export function ProgramsDropdown({
  label,
  items,
  open,
  active,
  onToggle,
  onClose,
  isActive,
}: {
  label: string
  items: ProgramItem[]
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
        className={`nav-link animate-fade-up delay-2 gap-1 ${active ? 'is-active' : ''}`}
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
          className={`absolute left-0 top-full z-[60] mt-4 w-[min(320px,calc(100vw-1rem))] rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] ${textAlignClass}`}
        >
          {items.map((item) => (
            <ProgramDropdownItem key={item.to} item={item} active={isActive(item.to)} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ProgramDropdownItem({ item, active }: { item: ProgramItem; active: boolean }) {
  const { direction } = useI18n()
  const textAlignClass = direction === 'rtl' ? 'text-right' : 'text-left'

  return (
    <Link
      to={item.to}
      className={`group flex items-start gap-3 rounded-2xl p-3 no-underline transition ${textAlignClass} ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'}`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-white">
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
