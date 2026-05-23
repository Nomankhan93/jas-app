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
  ]
    .join(' ')
    .toLowerCase()
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
            'id, full_name, cnic, mobile, district, taluka, photo_url, status, member_no, created_at',
          )
          .order('created_at', { ascending: false })

        if (membersError) {
          throw membersError
        }

        const safeMembers = (data ?? []) as Member[]
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
        <div className="page-wrap rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          Loading admin panel...
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-emerald-700">
            Jatt Alliance Sindh
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review membership applications and manage member approval.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input min-h-11 text-base md:max-w-md md:text-sm"
              placeholder="Search name, CNIC, mobile, district, taluka, member no..."
              aria-label="Search members"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="input min-h-11 text-base md:max-w-xs md:text-sm"
              aria-label="Filter members by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    fallbackClassName="h-14 w-14 shrink-0 rounded-xl bg-slate-100"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="min-w-0 text-base font-semibold leading-tight text-slate-900">
                        {member.full_name}
                      </h2>
                      <StatusBadge status={member.status} />
                    </div>
                    <p className="mt-1 break-all text-xs font-medium text-slate-500">
                      {member.cnic}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      District
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {member.district}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.taluka || 'No taluka'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Member No
                    </p>
                    <p className="mt-1 break-all font-medium text-slate-900">
                      {member.member_no ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(member.created_at)}
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin/members/$id"
                  params={{ id: member.id }}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white no-underline hover:bg-slate-800"
                >
                  View application
                </Link>
              </article>
            ))}

            {filteredMembers.length === 0 ? (
              <EmptyState message="No members found." />
            ) : null}
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3">Photo</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">CNIC</th>
                  <th className="py-3">District</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Member No</th>
                  <th className="py-3">Submitted</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-3">
                      <MemberPhoto
                        src={photoUrls[member.id]}
                        alt={member.full_name}
                        className="h-12 w-12 rounded-xl object-cover"
                        fallbackClassName="h-12 w-12 rounded-xl bg-slate-100"
                      />
                    </td>

                    <td className="py-3 font-medium text-slate-900">
                      {member.full_name}
                    </td>

                    <td className="py-3 text-slate-700">{member.cnic}</td>

                    <td className="py-3 text-slate-700">
                      <div className="font-medium">{member.district}</div>
                      <div className="text-xs text-slate-500">
                        {member.taluka || 'No taluka'}
                      </div>
                    </td>

                    <td className="py-3">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="py-3 text-slate-700">
                      {member.member_no ?? '—'}
                    </td>

                    <td className="py-3 text-slate-700">
                      {formatDate(member.created_at)}
                    </td>

                    <td className="py-3">
                      <Link
                        to="/admin/members/$id"
                        params={{ id: member.id }}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white no-underline hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <EmptyState message="No members found." />
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

function MemberPhoto({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src?: string
  alt: string
  className: string
  fallbackClassName: string
}) {
  if (!src) {
    return <div className={fallbackClassName} />
  }

  return <img src={src} alt={alt} className={className} />
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
      {message}
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  )
}