import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, CalendarDays, IdCard, MapPin, Printer, ShieldCheck, UserRound } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import {
  fetchMyDesignationCards,
  formatTenure,
  getCommitteeLocation,
  getCommitteeTypeLabel,
  getInitials,
  type DesignationCardRecord,
} from '../lib/committees-public'

export const Route = createFileRoute('/designation-card')({
  component: DesignationCardPage,
})

function DesignationCardPage() {
  const [cards, setCards] = useState<DesignationCardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCards() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchMyDesignationCards()
        if (!cancelled) setCards(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load designation card.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCards()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-12">
      <div className="page-wrap space-y-7">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,#fffdf8,#f7f1e6_54%,#edf4ee)] p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-eyebrow mb-3">Official Designation</p>
              <h1 className="text-[clamp(2.2rem,5vw,4.4rem)] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
                My Designation Card
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Digital designation card for active JAS committee office bearers. Membership card remains separate from designation card.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.print()} className="secondary-btn no-underline">
                <Printer size={16} />
                Print
              </button>
              <Link to="/committees" className="primary-btn no-underline">
                Public Committees
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <StateCard message="Loading designation card..." />
        ) : error ? (
          <StateCard message={error} tone="error" />
        ) : cards.length === 0 ? (
          <EmptyDesignationState />
        ) : (
          <section className="grid gap-7 xl:grid-cols-2">
            {cards.map((card) => (
              <DesignationCard key={card.id} card={card} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export function DesignationCard({ card }: { card: DesignationCardRecord }) {
  const committee = card.committee
  const location = committee ? getCommitteeLocation(committee) : [card.taluka_snapshot, card.district_snapshot].filter(Boolean).join(', ') || 'Sindh'

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)] ring-1 ring-slate-200 print:shadow-none">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#052e22,#0b3a28,#113f30)] p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px,#f2d48f 2px,transparent 2px)', backgroundSize: '34px 34px' }} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a949]/60 bg-white/10 text-[#f2d48f]">
              <ShieldCheck size={30} />
            </div>
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#f2d48f]">Jatt Alliance Sindh</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Official Designation Card</h2>
              <p className="mt-1 text-sm font-semibold text-white/70">Committee office bearer record</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-[#f2d48f] px-3 py-1 text-xs font-black uppercase text-emerald-950">
            <BadgeCheck size={13} /> Active
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[150px_1fr]">
        <div className="space-y-3">
          {card.photoSignedUrl ? (
            <img src={card.photoSignedUrl} alt={card.member.full_name} className="h-36 w-36 rounded-[1.4rem] object-cover ring-4 ring-white shadow-lg" />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-[1.4rem] bg-emerald-950 text-3xl font-black text-[#f2d48f] shadow-lg ring-4 ring-white">
              {getInitials(card.member.full_name)}
            </div>
          )}

          <div className="rounded-2xl bg-amber-50 p-3 text-center ring-1 ring-amber-100">
            <p className="text-[0.65rem] font-black uppercase tracking-wide text-amber-800">Member ID</p>
            <p className="mt-1 text-sm font-black text-slate-950">{card.member.member_no || card.member_no_snapshot || 'Not issued'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{card.designation_title}</p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950">{card.member.full_name || card.full_name_snapshot}</h3>
          {(card.member.father_name || card.father_name_snapshot) ? (
            <p className="mt-1 text-sm font-bold text-slate-500">Father: {card.member.father_name || card.father_name_snapshot}</p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoBox icon={<ShieldCheck size={16} />} label="Committee" value={committee?.name || 'Committee record'} />
            <InfoBox icon={<IdCard size={16} />} label="Committee Type" value={committee ? getCommitteeTypeLabel(committee.committee_type) : 'JAS Committee'} />
            <InfoBox icon={<MapPin size={16} />} label="Location" value={location} />
            <InfoBox icon={<CalendarDays size={16} />} label="Tenure" value={formatTenure(card.tenure_start || committee?.tenure_start, card.tenure_end || committee?.tenure_end)} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-xs font-semibold leading-6 text-slate-500">
          This card verifies an active designation assignment in the JAS committee system. It does not replace the standard digital membership card.
        </p>
      </div>
    </article>
  )
}

function InfoBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-center gap-2 text-emerald-700">{icon}<span className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">{label}</span></div>
      <p className="mt-2 text-sm font-black leading-6 text-slate-950">{value}</p>
    </div>
  )
}

function EmptyDesignationState() {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
        <UserRound size={30} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">No active designation found</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
        Your membership account does not currently have an active committee designation. If you were appointed, ask the admin to assign your committee role.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/card" className="primary-btn no-underline">Open Membership Card</Link>
        <Link to="/committees" className="secondary-btn no-underline">View Public Committees</Link>
      </div>
    </section>
  )
}

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`rounded-[1.5rem] p-5 text-sm font-bold ring-1 ${tone === 'error' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-white text-slate-600 ring-slate-200'}`}>
      {message}
    </div>
  )
}
