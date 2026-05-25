// src/routes/admin.tsx
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

type MemberStatus = 'pending' | 'approved' | 'rejected'
type StatusFilter = 'all' | MemberStatus

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
  | { ok: true }
  | { ok: false; redirectTo: '/login' | '/dashboard' }

const MEMBER_PHOTO_BUCKET = 'member-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
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

async function ensureAdminAccess(): Promise<AdminAccessResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, redirectTo: '/login' }
  }

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleError || !role) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  return { ok: true }
}

async function createSignedPhotoUrls(
  members: Member[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    members.map(async (member) => {
      if (!member.photo_url) {
        return null
      }

      const { data, error } = await supabase.storage
        .from(MEMBER_PHOTO_BUCKET)
        .createSignedUrl(member.photo_url, SIGNED_URL_TTL_SECONDS)

      if (error || !data?.signedUrl) {
        return null
      }

      return [member.id, data.signedUrl] as const
    }),
  )

  return Object.fromEntries(
    entries.filter(Boolean) as Array<readonly [string, string]>,
  )
}

function AdminPage() {
  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isMemberDetailPage = pathname.startsWith('/admin/members/')

  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

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

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return members.filter((member) => {
      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter

      const matchesSearch =
        query.length === 0 || buildMemberSearchText(member).includes(query)

      return matchesStatus && matchesSearch
    })
  }, [members, search, statusFilter])

  const loadAdmin = useCallback(
    async (cancelledRef?: { current: boolean }) => {
      setLoading(true)
      setError('')

      try {
        const access = await ensureAdminAccess()

        if (!access.ok) {
          if (!cancelledRef?.current) {
            navigate({ to: access.redirectTo })
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

        if (membersError) {
          throw membersError
        }

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
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (isMemberDetailPage) {
      return
    }

    const cancelledRef = { current: false }

    void loadAdmin(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [isMemberDetailPage, loadAdmin])

  if (isMemberDetailPage) {
    return <Outlet />
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:p-6">
          Loading admin panel...
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Membership Admin Panel
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review membership applications, approve eligible members, and
                  open the same digital membership card that approved members
                  see in their dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadAdmin()}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Refresh Members
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
            <StatCard
              label="Total Members"
              value={stats.total}
              tone="slate"
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <StatCard
              label="Pending Review"
              value={stats.pending}
              tone="amber"
              active={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              tone="emerald"
              active={statusFilter === 'approved'}
              onClick={() => setStatusFilter('approved')}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              tone="red"
              active={statusFilter === 'rejected'}
              onClick={() => setStatusFilter('rejected')}
            />
            <StatCard
              label="Cards Issued"
              value={stats.cards}
              tone="gold"
              active={false}
              onClick={() => setStatusFilter('approved')}
            />
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Member Applications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredMembers.length} of {members.length} members.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,420px)_220px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input min-h-11 text-base md:text-sm"
                placeholder="Search name, CNIC, mobile, district, taluka..."
                aria-label="Search members"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="input min-h-11 text-base md:text-sm"
                aria-label="Filter members by status"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <MemberPhoto
                    src={photoUrls[member.id]}
                    alt={member.full_name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                    fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-400 ring-1 ring-slate-200"
                    fallbackText="No photo"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="min-w-0 text-base font-bold leading-tight text-slate-950">
                        {member.full_name}
                      </h2>
                      <StatusBadge status={member.status} />
                    </div>

                    <p className="mt-1 break-all text-xs font-medium text-slate-500">
                      CNIC: {member.cnic}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Submitted: {formatDate(member.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {member.district}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.taluka || 'No taluka'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Member No
                    </p>
                    <p className="mt-1 break-all font-semibold text-slate-950">
                      {member.member_no ?? 'Not issued'}
                    </p>
                    <p className="text-xs text-slate-500">{member.mobile}</p>
                  </div>
                </div>

                <CardAccess member={member} layout="mobile" />

                <div className="mt-4 grid gap-2">
                  <Link
                    to="/admin/members/$id"
                    params={{ id: member.id }}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    View Application
                  </Link>
                </div>
              </article>
            ))}

            {filteredMembers.length === 0 ? (
              <EmptyState
                title="No members found"
                message="Try changing the search text or status filter."
              />
            ) : null}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
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
                        fallbackClassName="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200"
                        fallbackText="N/A"
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
                      <div className="font-medium">{member.cnic}</div>
                      <div className="text-xs text-slate-500">
                        {member.mobile}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-semibold">{member.district}</div>
                      <div className="text-xs text-slate-500">
                        {member.taluka || 'No taluka'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {member.member_no ? (
                        <span className="font-semibold">
                          {member.member_no}
                        </span>
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
                        <Link
                          to="/admin/members/$id"
                          params={{ id: member.id }}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-semibold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                          style={{ color: '#ffffff' }}
                        >
                          View Application
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6">
                      <EmptyState
                        title="No members found"
                        message="Try changing the search text or status filter."
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

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  tone: 'slate' | 'amber' | 'emerald' | 'red' | 'gold'
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
      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          active ? 'text-white/75' : 'opacity-70'
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
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
              ? 'inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-black !text-slate-950 no-underline shadow-sm transition hover:bg-amber-300 hover:!text-slate-950'
              : 'inline-flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-bold !text-amber-900 no-underline shadow-sm transition hover:bg-amber-100 hover:!text-amber-950'
          }
          style={layout === 'mobile' ? { color: '#020617' } : undefined}
        >
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
  fallbackText: string
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
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const styles: Record<MemberStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  )
}