import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Award, Printer, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { OfficeBearerCardPackage } from '../components/cards/OfficeBearerDesignationCard'
import {
  fetchMyDesignationCards,
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
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load office bearer card.',
          )
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
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="relative bg-[linear-gradient(135deg,#031c18,#073827_45%,#102133)] p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 24px 24px,#f6d56f 2px,transparent 2px)', backgroundSize: '44px 44px' }} />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#f6d56f]/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#f6d56f]">
                  <Award className="h-4 w-4" />
                  Official Authority Card
                </p>
                <h1 className="mt-4 text-[clamp(2.3rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.06em]">
                  Office Bearer
                  <span className="block text-[#f6d56f]">Designation Card</span>
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/72">
                  Premium digital authority card for active JAS committee office bearers. This card is separate from the standard membership card and remains valid only while the designation is active.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white px-5 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-[#f6d56f]">
                  <Printer size={16} />
                  Print
                </button>
                <Link to="/committees" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#f6d56f] px-5 text-sm font-black text-emerald-950 no-underline shadow-sm transition hover:bg-amber-300">
                  Public Committees
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <StateCard message="Loading office bearer card..." />
        ) : error ? (
          <StateCard message={error} tone="error" />
        ) : cards.length === 0 ? (
          <EmptyDesignationState />
        ) : (
          <section className="space-y-8">
            {cards.map((card) => (
              <OfficeBearerCardPackage key={card.id} card={card} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function EmptyDesignationState() {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-10">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#06130f,#0f5138)] text-[#f6d56f] shadow-sm ring-1 ring-emerald-900/10">
        <UserRound size={32} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">No active office bearer designation found</h2>
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
