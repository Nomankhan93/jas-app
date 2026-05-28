// src/routes/admin.tsx
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Download,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  IdCard,
  ImageOff,
  ListChecks,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const adminRoleNames = [
  'admin',
  'super_admin',
  'membership_admin',
  'education_admin',
  'health_admin',
  'employment_admin',
  'ration_admin',
  'welfare_admin',
] as const

type AdminRoleName = (typeof adminRoleNames)[number]

type MemberStatus = 'pending' | 'approved' | 'rejected'
type StatusFilter = 'all' | MemberStatus
type DateFilter = 'all' | 'today' | '7d' | '30d'
type SortBy = 'newest' | 'oldest' | 'name' | 'district'

type Member = {
  id: string
  full_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  photo_url: string | null
  status: MemberStatus
  member_no: string | null
  created_at: string
}

type AdminAccessResult =
  | { ok: true; roles: AdminRoleName[] }
  | { ok: false; redirectTo: '/login' | '/dashboard' }

const MEMBER_PHOTO_BUCKET = 'member-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

function AdminPage() {
  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  const isNestedAdminPage = normalizedPathname !== '/admin'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [talukaFilter, setTalukaFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [search, setSearch] = useState('')
  const [showSensitive, setShowSensitive] = useState(false)
  const [error, setError] = useState('')

  const loadAdmin = useCallback(
    async (
      cancelledRef?: { current: boolean },
      options?: { silent?: boolean },
    ) => {
      const silent = options?.silent ?? false

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const access = await ensureAdminAccess()

        if (!access.ok) {
          if (!cancelledRef?.current) {
            await navigate({ to: access.redirectTo })
          }

          return
        }

        if (!canManageMembersFromRoles(access.roles)) {
          if (!cancelledRef?.current) {
            if (access.roles.includes('education_admin')) {
              await navigate({ to: '/admin/programs/education' })
            } else {
              await navigate({ to: '/dashboard' })
            }
          }

          return
        }

        const { data, error: membersError } = await supabase
          .from('members')
          .select(
            [
              'id',
              'full_name',
              'cnic',
              'mobile',
              'district',
              'taluka',
              'photo_url',
              'status',
              'member_no',
              'created_at',
            ].join(', '),
          )
          .order('created_at', { ascending: false })
          .returns<Member[]>()

        if (membersError) throw membersError

        const safeMembers = data ?? []
        const signedUrls = await createSignedPhotoUrls(safeMembers)

        if (!cancelledRef?.current) {
          setMembers(safeMembers)
          setPhotoUrls(signedUrls)
        }
      } catch (err) {
        if (!cancelledRef?.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to load admin members.',
          )
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (isNestedAdminPage) return

    const cancelledRef = { current: false }

    void loadAdmin(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [isNestedAdminPage, loadAdmin])

  const stats = useMemo(() => {
    return members.reduce(
      (acc, member) => {
        acc.total += 1
        acc[member.status] += 1

        if (canOpenMemberCard(member)) {
          acc.cards += 1
        }

        return acc
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cards: 0,
      },
    )
  }, [members])

  const districtOptions = useMemo(() => {
    return uniqueSorted(members.map((member) => member.district).filter(Boolean))
  }, [members])

  const talukaOptions = useMemo(() => {
    const source =
      districtFilter === 'all'
        ? members
        : members.filter((member) => member.district === districtFilter)

    return uniqueSorted(
      source.map((member) => member.taluka ?? '').filter(Boolean),
    )
  }, [districtFilter, members])

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = members.filter((member) => {
      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter

      const matchesDistrict =
        districtFilter === 'all' || member.district === districtFilter

      const matchesTaluka =
        talukaFilter === 'all' || member.taluka === talukaFilter

      const matchesDate = matchesDateFilter(member.created_at, dateFilter)

      const matchesSearch =
        query.length === 0 || buildMemberSearchText(member).includes(query)

      return (
        matchesStatus &&
        matchesDistrict &&
        matchesTaluka &&
        matchesDate &&
        matchesSearch
      )
    })

    return sortMembers(result, sortBy)
  }, [
    dateFilter,
    districtFilter,
    members,
    search,
    sortBy,
    statusFilter,
    talukaFilter,
  ])

  const hasActiveFilters =
    statusFilter !== 'all' ||
    districtFilter !== 'all' ||
    talukaFilter !== 'all' ||
    dateFilter !== 'all' ||
    search.trim().length > 0

  function resetFilters() {
    setStatusFilter('all')
    setDistrictFilter('all')
    setTalukaFilter('all')
    setDateFilter('all')
    setSortBy('newest')
    setSearch('')
  }

  function handleDistrictFilter(value: string) {
    setDistrictFilter(value)
    setTalukaFilter('all')
  }

  function exportCsv() {
    const csv = buildCsv(filteredMembers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `jas-members-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (isNestedAdminPage) {
    return <Outlet />
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
            Loading admin panel...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Jatt Alliance Sindh
            </p>

            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Membership Admin Panel
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review membership applications, filter by district or taluka,
                  export records, and open the same digital membership card that
                  approved members see.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                <Link
                  to="/admin/programs/education"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  Education Admin
                </Link>

                <button
                  type="button"
                  onClick={() => setShowSensitive((value) => !value)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  {showSensitive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showSensitive ? 'Hide CNIC' : 'Show CNIC'}
                </button>

                <button
                  type="button"
                  onClick={() => void loadAdmin(undefined, { silent: true })}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
            <StatCard
              label="Total Members"
              value={stats.total}
              tone="slate"
              icon={<Users className="h-5 w-5" />}
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <StatCard
              label="Pending Review"
              value={stats.pending}
              tone="amber"
              icon={<ListChecks className="h-5 w-5" />}
              active={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              tone="emerald"
              icon={<UserCheck className="h-5 w-5" />}
              active={statusFilter === 'approved'}
              onClick={() => setStatusFilter('approved')}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              tone="red"
              icon={<XCircle className="h-5 w-5" />}
              active={statusFilter === 'rejected'}
              onClick={() => setStatusFilter('rejected')}
            />
            <StatCard
              label="Cards Issued"
              value={stats.cards}
              tone="gold"
              icon={<IdCard className="h-5 w-5" />}
              active={false}
              onClick={() => setStatusFilter('approved')}
            />
          </div>
        </header>

        <AdminProgramShortcuts />

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                <Filter className="h-3.5 w-3.5" />
                Admin filters
              </div>

              <h2 className="mt-3 text-lg font-black text-slate-950">
                Member Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredMembers.length} of {members.length} members.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredMembers.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_160px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
                placeholder="Search name, CNIC, mobile, district..."
                aria-label="Search members"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
              aria-label="Filter members by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={districtFilter}
              onChange={(event) => handleDistrictFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
              aria-label="Filter members by district"
            >
              <option value="all">All districts</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            <select
              value={talukaFilter}
              onChange={(event) => setTalukaFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
              aria-label="Filter members by taluka"
            >
              <option value="all">All talukas</option>
              {talukaOptions.map((taluka) => (
                <option key={taluka} value={taluka}>
                  {taluka}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
              aria-label="Filter members by registration date"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">
              CNIC and mobile numbers are masked by default. Use “Show CNIC” only
              when needed for verification.
            </p>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              aria-label="Sort members"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="name">Sort: Name A-Z</option>
              <option value="district">Sort: District A-Z</option>
            </select>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {filteredMembers.map((member) => (
              <MobileMemberCard
                key={member.id}
                member={member}
                photoUrl={photoUrls[member.id]}
                showSensitive={showSensitive}
              />
            ))}

            {filteredMembers.length === 0 ? (
              <EmptyState
                title="No members found"
                message="Try changing the search text or filters."
              />
            ) : null}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">CNIC / Mobile</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Member No</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Digital Card</th>
                  <th className="px-4 py-3 text-right">Application</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="bg-white transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <MemberPhoto
                        src={photoUrls[member.id]}
                        alt={member.full_name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                        fallbackClassName="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                        fallbackText={<ImageOff className="h-4 w-4" />}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-950">
                        {member.full_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {member.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-semibold">
                        {showSensitive ? member.cnic : maskCnic(member.cnic)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {showSensitive ? member.mobile : maskMobile(member.mobile)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                        {member.district}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.taluka || 'No taluka'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {member.member_no ? (
                        <span className="font-bold">{member.member_no}</span>
                      ) : (
                        <span className="text-slate-400">Not issued</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(member.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <CardAccess member={member} layout="desktop" />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <ViewApplicationLink memberId={member.id} />
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6">
                      <EmptyState
                        title="No members found"
                        message="Try changing the search text or filters."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function AdminProgramShortcuts() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <h2 className="text-xl font-black text-slate-950">
          Membership Applications
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review member registrations, approve/reject applications and access
          QR-based digital membership cards.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800">
          Current Page
          <CheckMini />
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <BookOpenCheck className="h-5 w-5" />
        </div>

        <h2 className="text-xl font-black text-slate-950">
          Education Applications
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review scholarship, fee support, books, uniform, hostel, transport and
          skills training applications.
        </p>

        <Link
          to="/admin/programs/education"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black !text-white no-underline transition hover:bg-emerald-900 hover:!text-white"
        >
          Open Education Admin
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function CheckMini() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5" />
    </span>
  )
}

function MobileMemberCard({
  member,
  photoUrl,
  showSensitive,
}: {
  member: Member
  photoUrl?: string
  showSensitive: boolean
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <MemberPhoto
          src={photoUrl}
          alt={member.full_name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
          fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200"
          fallbackText={<ImageOff className="h-4 w-4" />}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="min-w-0 text-base font-black leading-tight text-slate-950">
              {member.full_name}
            </h2>

            <StatusBadge status={member.status} />
          </div>

          <p className="mt-1 break-all text-xs font-medium text-slate-500">
            CNIC: {showSensitive ? member.cnic : maskCnic(member.cnic)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Submitted: {formatDate(member.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-xs font-bold uppercase text-slate-500">Location</p>
          <p className="mt-1 font-bold text-slate-950">{member.district}</p>
          <p className="text-xs text-slate-500">{member.taluka || 'No taluka'}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-xs font-bold uppercase text-slate-500">Member No</p>
          <p className="mt-1 break-all font-bold text-slate-950">
            {member.member_no ?? 'Not issued'}
          </p>
          <p className="text-xs text-slate-500">
            {showSensitive ? member.mobile : maskMobile(member.mobile)}
          </p>
        </div>
      </div>

      <CardAccess member={member} layout="mobile" />

      <div className="mt-4">
        <ViewApplicationLink memberId={member.id} fullWidth />
      </div>
    </article>
  )
}

function StatCard({
  label,
  value,
  tone,
  icon,
  active,
  onClick,
}: {
  label: string
  value: number
  tone: 'slate' | 'amber' | 'emerald' | 'red' | 'gold'
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  const toneStyles: Record<
    'slate' | 'amber' | 'emerald' | 'red' | 'gold',
    string
  > = {
    slate: active
      ? 'border-slate-300 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50',
    amber: active
      ? 'border-amber-300 bg-amber-500 text-white'
      : 'border-amber-100 bg-amber-50 text-amber-900 hover:bg-amber-100',
    emerald: active
      ? 'border-emerald-300 bg-emerald-600 text-white'
      : 'border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
    red: active
      ? 'border-red-300 bg-red-600 text-white'
      : 'border-red-100 bg-red-50 text-red-900 hover:bg-red-100',
    gold: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-950 hover:from-amber-100 hover:to-yellow-100',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left shadow-sm transition ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              active ? 'text-white/75' : 'opacity-70'
            }`}
          >
            {label}
          </p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>

        <span className={active ? 'text-white/80' : 'opacity-75'}>{icon}</span>
      </div>
    </button>
  )
}

function CardAccess({
  member,
  layout,
}: {
  member: Member
  layout: 'mobile' | 'desktop'
}) {
  const isReady = canOpenMemberCard(member)

  if (isReady) {
    return (
      <div
        className={
          layout === 'mobile'
            ? 'mt-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-3 shadow-sm'
            : 'min-w-[190px]'
        }
      >
        {layout === 'mobile' ? (
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              Digital Member Card
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Same card design as member dashboard.
            </p>
          </div>
        ) : null}

        <Link
          to="/admin/members/$id/card"
          params={{ id: member.id }}
          className={
            layout === 'mobile'
              ? 'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black !text-slate-950 no-underline shadow-sm transition hover:bg-amber-300 hover:!text-slate-950'
              : 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-bold !text-amber-900 no-underline shadow-sm transition hover:bg-amber-100 hover:!text-amber-950'
          }
          style={layout === 'mobile' ? { color: '#020617' } : undefined}
        >
          <IdCard className="h-4 w-4" />
          Open Same Member Card
        </Link>
      </div>
    )
  }

  const message =
    member.status !== 'approved'
      ? 'Card available after approval'
      : 'Member no not issued yet'

  return (
    <div
      className={
        layout === 'mobile'
          ? 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'
          : 'min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'
      }
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Digital Card
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{message}</p>
    </div>
  )
}

function ViewApplicationLink({
  memberId,
  fullWidth = false,
}: {
  memberId: string
  fullWidth?: boolean
}) {
  return (
    <Link
      to="/admin/members/$id"
      params={{ id: memberId }}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white ${
        fullWidth ? 'w-full' : ''
      }`}
      style={{ color: '#ffffff' }}
    >
      <ShieldCheck className="h-4 w-4" />
      View Application
    </Link>
  )
}

function MemberPhoto({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackText,
}: {
  src?: string
  alt: string
  className: string
  fallbackClassName: string
  fallbackText: React.ReactNode
}) {
  if (!src) {
    return <div className={fallbackClassName}>{fallbackText}</div>
  }

  return <img src={src} alt={alt} className={className} />
}

function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-100">
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const config: Record<
    MemberStatus,
    {
      icon: React.ReactNode
      className: string
      text: string
    }
  > = {
    pending: {
      icon: <ListChecks className="h-3.5 w-3.5" />,
      className: 'bg-amber-50 text-amber-700 ring-amber-200',
      text: 'Pending',
    },
    approved: {
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      text: 'Approved',
    },
    rejected: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'bg-red-50 text-red-700 ring-red-200',
      text: 'Rejected',
    },
  }

  const item = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${item.className}`}
    >
      {item.icon}
      {item.text}
    </span>
  )
}

async function ensureAdminAccess(): Promise<AdminAccessResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, redirectTo: '/login' }
  }

  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', adminRoleNames)

  if (roleError || !roles?.length) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  const safeRoles = roles
    .map((item) => item.role)
    .filter((role): role is AdminRoleName =>
      adminRoleNames.includes(role as AdminRoleName),
    )

  if (!safeRoles.length) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  return { ok: true, roles: safeRoles }
}

function canManageMembersFromRoles(roles: readonly AdminRoleName[]) {
  return (
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('membership_admin')
  )
}

async function createSignedPhotoUrls(
  members: Member[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    members.map(async (member) => {
      if (!member.photo_url) return null

      const { data, error } = await supabase.storage
        .from(MEMBER_PHOTO_BUCKET)
        .createSignedUrl(member.photo_url, SIGNED_URL_TTL_SECONDS)

      if (error || !data?.signedUrl) return null

      return [member.id, data.signedUrl] as const
    }),
  )

  return Object.fromEntries(
    entries.filter(Boolean) as Array<readonly [string, string]>,
  )
}

function buildMemberSearchText(member: Member) {
  return [
    member.full_name,
    member.cnic,
    member.mobile,
    member.district,
    member.taluka ?? '',
    member.member_no ?? '',
    member.status,
  ]
    .join(' ')
    .toLowerCase()
}

function canOpenMemberCard(member: Member) {
  return member.status === 'approved' && Boolean(member.member_no)
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function sortMembers(members: Member[], sortBy: SortBy) {
  const copy = [...members]

  switch (sortBy) {
    case 'oldest':
      return copy.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    case 'name':
      return copy.sort((a, b) => a.full_name.localeCompare(b.full_name))
    case 'district':
      return copy.sort((a, b) => {
        const district = a.district.localeCompare(b.district)
        if (district !== 0) return district
        return a.full_name.localeCompare(b.full_name)
      })
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }
}

function matchesDateFilter(value: string, filter: DateFilter) {
  if (filter === 'all') return true

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()

  if (filter === 'today') {
    return date.toDateString() === now.toDateString()
  }

  const days = filter === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - days)

  return date >= cutoff
}

function buildCsv(members: Member[]) {
  const rows = [
    [
      'Full Name',
      'CNIC',
      'Mobile',
      'District',
      'Taluka',
      'Status',
      'Member No',
      'Submitted',
    ],
    ...members.map((member) => [
      member.full_name,
      member.cnic,
      member.mobile,
      member.district,
      member.taluka ?? '',
      member.status,
      member.member_no ?? '',
      formatDate(member.created_at),
    ]),
  ]

  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

function csvCell(value: string) {
  const safe = value.replace(/"/g, '""')
  return `"${safe}"`
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function maskCnic(value: string | null | undefined) {
  if (!value) return 'N/A'

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 13) return '*****-*******-*'

  return `${digits.slice(0, 5)}-*****${digits.slice(10, 12)}-${digits.slice(12)}`
}

function maskMobile(value: string | null | undefined) {
  if (!value) return 'N/A'

  const clean = value.replace(/[^\d+]/g, '')

  if (clean.startsWith('+92') && clean.length >= 13) {
    return `${clean.slice(0, 6)}*****${clean.slice(-2)}`
  }

  if (clean.startsWith('03') && clean.length >= 11) {
    return `${clean.slice(0, 4)}*****${clean.slice(-2)}`
  }

  return '***********'
}