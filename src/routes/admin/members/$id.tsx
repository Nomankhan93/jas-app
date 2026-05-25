// src/routes/admin/members/$id.tsx
import {
  Outlet,
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveMemberAction,
  rejectMemberAction,
} from '../../../lib/admin/actions'
import { supabase } from '../../../lib/supabase/client'

export const Route = createFileRoute('/admin/members/$id')({
  component: AdminMemberDetailPage,
})

type MemberStatus = 'pending' | 'approved' | 'rejected'

type Member = {
  id: string
  user_id: string
  member_no: string | null
  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string | null
  status: MemberStatus
  rejection_reason: string | null
  reviewed_at: string | null
  approved_at: string | null
  created_at: string
}

type AdminAccessResult =
  | { ok: true }
  | { ok: false; redirectTo: '/login' | '/dashboard' }

const MEMBER_PHOTO_BUCKET = 'member-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60
const MIN_REJECTION_REASON_LENGTH = 3

const MEMBER_SELECT_COLUMNS = [
  'id',
  'user_id',
  'member_no',
  'address',
  'date_of_birth',
  'gender',
  'education',
  'blood_group',
  'emergency_contact_name',
  'emergency_contact_relation',
  'emergency_contact_mobile',
  'declaration_accepted',
  'full_name',
  'father_name',
  'cnic',
  'mobile',
  'district',
  'taluka',
  'profession',
  'caste_branch',
  'photo_url',
  'status',
  'rejection_reason',
  'reviewed_at',
  'approved_at',
  'created_at',
].join(', ')

function AdminMemberDetailPage() {
  const { id } = Route.useParams()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isCardRoute = normalizedPathname === `/admin/members/${id}/card`

  if (isCardRoute) {
    return <Outlet />
  }

  return <AdminMemberApplicationPage id={id} />
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return withTime ? date.toLocaleString() : date.toLocaleDateString()
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

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Unable to get access token.')
  }

  return session.access_token
}

async function createSignedPhotoUrl(photoPath: string | null) {
  if (!photoPath) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}

async function fetchMemberById(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as Member | null
}

function AdminMemberApplicationPage({ id }: { id: string }) {
  const navigate = useNavigate()

  const [member, setMember] = useState<Member | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const trimmedRejectionReason = useMemo(
    () => rejectionReason.trim(),
    [rejectionReason],
  )

  const canViewCard = member?.status === 'approved' && Boolean(member.member_no)

  const loadMember = useCallback(
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

        const safeMember = await fetchMemberById(id)

        if (!safeMember) {
          throw new Error('Member not found.')
        }

        const signedPhotoUrl = await createSignedPhotoUrl(safeMember.photo_url)

        if (cancelledRef?.current) {
          return
        }

        setMember(safeMember)
        setPhotoUrl(signedPhotoUrl)
      } catch (err) {
        if (!cancelledRef?.current) {
          setError(err instanceof Error ? err.message : 'Failed to load member.')
          setMember(null)
          setPhotoUrl(null)
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
        }
      }
    },
    [id, navigate],
  )

  useEffect(() => {
    const cancelledRef = { current: false }

    void loadMember(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [loadMember])

  async function handleApprove() {
    if (!member) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const accessToken = await getAccessToken()

      await approveMemberAction({
        data: {
          memberId: member.id,
          accessToken,
        },
      })

      await loadMember()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve member.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!member || trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const accessToken = await getAccessToken()

      await rejectMemberAction({
        data: {
          memberId: member.id,
          rejectionReason: trimmedRejectionReason,
          accessToken,
        },
      })

      setRejectionReason('')
      await loadMember()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject member.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          Loading member...
        </div>
      </main>
    )
  }

  if (!member) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap space-y-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <Link
            to="/admin"
            className="text-sm font-medium text-emerald-700 no-underline"
          >
            ← Back to Admin
          </Link>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Member not found
            </h1>
            {error ? (
              <p className="mt-2 text-sm text-red-700">{error}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                This member record could not be loaded.
              </p>
            )}
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
            <Link
              to="/admin"
              className="text-sm font-semibold text-emerald-700 no-underline hover:text-emerald-800"
            >
              ← Back to Admin
            </Link>

            <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Member Application
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {member.full_name}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  CNIC: {member.cnic} · District: {member.district}
                  {member.taluka ? ` · Taluka: ${member.taluka}` : ''}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Member No:{' '}
                  <span className="font-bold text-slate-900">
                    {member.member_no || 'Not issued yet'}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <StatusBadge status={member.status} />

                {canViewCard ? (
                  <Link
                    to="/admin/members/$id/card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    View Member Card
                  </Link>
                ) : (
                  <p className="max-w-xs text-left text-xs leading-5 text-slate-500 lg:text-right">
                    Digital card will be available after approval and membership
                    number issuance.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <SummaryItem label="Status" value={member.status} />
            <SummaryItem
              label="Member No"
              value={member.member_no || 'Not issued'}
            />
            <SummaryItem
              label="Submitted"
              value={formatDate(member.created_at, true) || 'Not provided'}
            />
            <SummaryItem
              label="Approved At"
              value={formatDate(member.approved_at, true) || 'Not approved'}
            />
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-3">
          <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={member.full_name}
                className="aspect-square w-full rounded-2xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                No photo
              </div>
            )}

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Quick Contact
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950">
                {member.mobile}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {member.district}
                {member.taluka ? `, ${member.taluka}` : ''}
              </p>
            </div>
          </aside>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Member Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Personal and membership information submitted by the member.
                </p>
              </div>

              {canViewCard ? (
                <Link
                  to="/admin/members/$id/card"
                  params={{ id: member.id }}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  style={{ color: '#ffffff' }}
                >
                  Open Card
                </Link>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoItem label="Full Name" value={member.full_name} />
              <InfoItem label="Father Name" value={member.father_name} />
              <InfoItem label="CNIC" value={member.cnic} />
              <InfoItem label="Mobile" value={member.mobile} />
              <InfoItem label="District" value={member.district} />
              <InfoItem label="Taluka" value={member.taluka} />
              <InfoItem label="Address" value={member.address} />
              <InfoItem
                label="Date of Birth"
                value={formatDate(member.date_of_birth)}
              />
              <InfoItem label="Gender" value={member.gender} />
              <InfoItem label="Education" value={member.education} />
              <InfoItem label="Blood Group" value={member.blood_group} />
              <InfoItem
                label="Emergency Contact Name"
                value={member.emergency_contact_name}
              />
              <InfoItem
                label="Emergency Contact Relation"
                value={member.emergency_contact_relation}
              />
              <InfoItem
                label="Emergency Contact Mobile"
                value={member.emergency_contact_mobile}
              />
              <InfoItem
                label="Declaration Accepted"
                value={member.declaration_accepted ? 'Yes' : 'No'}
              />
              <InfoItem label="Profession" value={member.profession} />
              <InfoItem label="Caste Branch" value={member.caste_branch} />
              <InfoItem label="Member No" value={member.member_no} />
              <InfoItem
                label="Submitted"
                value={formatDate(member.created_at, true)}
              />
              <InfoItem
                label="Approved At"
                value={formatDate(member.approved_at, true)}
              />
              <InfoItem
                label="Reviewed At"
                value={formatDate(member.reviewed_at, true)}
              />
            </div>

            {member.rejection_reason ? (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
                <p className="font-bold">Rejection Reason</p>
                <p className="mt-1 leading-6">{member.rejection_reason}</p>
              </div>
            ) : null}
          </section>
        </section>

        {member.status === 'pending' ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Review Application
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Approve this member to issue a membership number and enable the
              digital membership card.
            </p>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'Processing...' : 'Approve Member'}
              </button>
            </div>

            <div className="mt-6 max-w-xl">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Rejection Reason
                </span>

                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="input min-h-28 text-base sm:text-sm"
                  placeholder="Write reason before rejecting..."
                />
              </label>

              <button
                type="button"
                onClick={handleReject}
                disabled={
                  actionLoading ||
                  trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH
                }
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {actionLoading ? 'Processing...' : 'Reject Member'}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-bold capitalize text-slate-950">
        {value}
      </p>
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || 'Not provided'}
      </p>
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