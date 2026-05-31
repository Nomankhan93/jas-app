import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, MapPin, Network, Search, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchPublicCommittees,
  formatTenure,
  getCommitteeLocation,
  getCommitteeStatusClass,
  getCommitteeStatusLabel,
  getCommitteeTypeLabel,
  type PublicCommitteeRecord,
} from '../lib/committees-public'

export const Route = createFileRoute('/committees')({
  component: PublicCommitteesPage,
})

type CommitteeFilter = 'all' | 'central' | 'district' | 'taluka'

function PublicCommitteesPage() {
  const [committees, setCommittees] = useState<PublicCommitteeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CommitteeFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadCommittees() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchPublicCommittees()
        if (!cancelled) setCommittees(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load committees.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCommittees()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCommittees = useMemo(() => {
    const query = search.trim().toLowerCase()

    return committees.filter((committee) => {
      const matchesType = filter === 'all' || committee.committee_type === filter
      const matchesSearch =
        query.length === 0 ||
        [
          committee.name,
          committee.district ?? '',
          committee.taluka ?? '',
          committee.notes ?? '',
          getCommitteeTypeLabel(committee.committee_type),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesType && matchesSearch
    })
  }, [committees, filter, search])

  const stats = useMemo(() => {
    return committees.reduce(
      (acc, committee) => {
        acc.total += 1
        acc[committee.committee_type] += 1
        acc.members += committee.member_count ?? 0
        return acc
      },
      { total: 0, central: 0, district: 0, taluka: 0, members: 0 },
    )
  }, [committees])

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-12">
      <div className="page-wrap space-y-7">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#fffdf8,#f7f1e6_54%,#edf4ee)] p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <p className="section-eyebrow mb-3">Organization Structure</p>
              <h1 className="max-w-4xl text-[clamp(2.4rem,5.4vw,5rem)] font-black leading-[0.96] tracking-[-0.06em] text-slate-950">
                Public Committees
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                Publicly displayed Central, District and Taluka committees of Jatt Alliance Sindh with official office bearers and tenure details.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/signup" className="primary-btn no-underline">
                  Become a Member
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="secondary-btn no-underline">
                  Contact JAS
                </Link>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-emerald-900/10 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Network size={25} />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-950">Central → District → Taluka</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Only committees marked for public display are shown here. Internal or draft committee records remain restricted to administrators.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Public Committees" value={stats.total} />
          <StatCard label="Central" value={stats.central} />
          <StatCard label="District" value={stats.district} />
          <StatCard label="Taluka" value={stats.taluka} />
          <StatCard label="Office Bearers" value={stats.members} />
        </section>

        <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Search committee, district, taluka..."
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as CommitteeFilter)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All committees</option>
              <option value="central">Central</option>
              <option value="district">District</option>
              <option value="taluka">Taluka</option>
            </select>
          </div>
        </section>

        {loading ? (
          <StateCard message="Loading public committees..." />
        ) : error ? (
          <StateCard message={error} tone="error" />
        ) : filteredCommittees.length === 0 ? (
          <StateCard message="No public committees found." />
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCommittees.map((committee) => (
              <CommitteeCard key={committee.id} committee={committee} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function CommitteeCard({ committee }: { committee: PublicCommitteeRecord }) {
  return (
    <article className="flex min-h-[320px] flex-col rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <ShieldCheck size={23} />
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${getCommitteeStatusClass(committee.status)}`}>
          {getCommitteeStatusLabel(committee.status)}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          {getCommitteeTypeLabel(committee.committee_type)}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{committee.name}</h2>

        <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
          <p className="flex items-center gap-2"><MapPin size={15} className="text-emerald-700" /> {getCommitteeLocation(committee)}</p>
          <p className="flex items-center gap-2"><CalendarDays size={15} className="text-emerald-700" /> {formatTenure(committee.tenure_start, committee.tenure_end)}</p>
          <p className="flex items-center gap-2"><Users size={15} className="text-emerald-700" /> {committee.member_count ?? 0} office bearer{(committee.member_count ?? 0) === 1 ? '' : 's'}</p>
        </div>
      </div>

      <Link
        to="/committees/$id"
        params={{ id: committee.id }}
        className="jas-dark-action-link mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black no-underline"
      >
        View Committee
        <ArrowRight size={16} />
      </Link>
    </article>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`rounded-[1.5rem] p-5 text-sm font-bold ring-1 ${tone === 'error' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-white text-slate-600 ring-slate-200'}`}>
      {message}
    </div>
  )
}
