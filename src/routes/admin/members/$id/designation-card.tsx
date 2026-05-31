import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  fetchDesignationCardsForAdminMember,
  type DesignationCardRecord,
} from '../../../../lib/committees-public'
import { DesignationCard } from '../../../designation-card'

export const Route = createFileRoute('/admin/members/$id/designation-card')({
  component: AdminMemberDesignationCardPage,
})

function AdminMemberDesignationCardPage() {
  const { id } = Route.useParams()
  const [cards, setCards] = useState<DesignationCardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCards() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchDesignationCardsForAdminMember(id)
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
  }, [id])

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-12">
      <div className="page-wrap space-y-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/admin/members/$id" params={{ id }} className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 no-underline">
            <ArrowLeft size={16} />
            Back to Member Application
          </Link>

          <button type="button" onClick={() => window.print()} className="secondary-btn no-underline">
            <Printer size={16} />
            Print
          </button>
        </div>

        <section className="rounded-[2rem] bg-[linear-gradient(135deg,#fffdf8,#f7f1e6_54%,#edf4ee)] p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
          <p className="section-eyebrow mb-3">Admin Preview</p>
          <h1 className="text-[clamp(2.1rem,5vw,4rem)] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
            Member Designation Card
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            This admin preview shows active committee designation cards assigned to the selected member.
          </p>
        </section>

        {loading ? (
          <StateCard message="Loading designation card..." />
        ) : error ? (
          <StateCard message={error} tone="error" />
        ) : cards.length === 0 ? (
          <StateCard message="This member does not have an active committee designation." />
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

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`flex items-start gap-3 rounded-[1.5rem] p-5 text-sm font-bold ring-1 ${tone === 'error' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-white text-slate-600 ring-slate-200'}`}>
      {tone === 'error' ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /> : null}
      <span>{message}</span>
    </div>
  )
}
