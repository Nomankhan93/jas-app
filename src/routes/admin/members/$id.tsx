import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
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

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) {
    return null
  }

  return withTime
    ? new Date(value).toLocaleString()
    : new Date(value).toLocaleDateString()
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

function AdminMemberDetailPage() {
  const { id } = Route.useParams()
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

  const loadMember = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const access = await ensureAdminAccess()

      if (!access.ok) {
        navigate({ to: access.redirectTo })
        return
      }

      const { data, error: memberError } = await supabase
        .from('members')
        .select(
          'id, user_id, member_no, address, date_of_birth, gender, education, blood_group, emergency_contact_name, emergency_contact_relation, emergency_contact_mobile, declaration_accepted, full_name, father_name, cnic, mobile, district, taluka, profession, caste_branch, photo_url, status, rejection_reason, reviewed_at, approved_at, created_at',
        )
        .eq('id', id)
        .single()

      if (memberError) {
        throw memberError
      }

      const safeMember = data as Member
      const signedPhotoUrl = await createSignedPhotoUrl(safeMember.photo_url)

      setMember(safeMember)
      setPhotoUrl(signedPhotoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member.')
      setMember(null)
      setPhotoUrl(null)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const access = await ensureAdminAccess()

        if (!access.ok) {
          if (!cancelled) {
            navigate({ to: access.redirectTo })
          }
          return
        }

        const { data, error: memberError } = await supabase
          .from('members')
          .select(
            'id, user_id, member_no, address, date_of_birth, gender, education, blood_group, emergency_contact_name, emergency_contact_relation, emergency_contact_mobile, declaration_accepted, full_name, father_name, cnic, mobile, district, taluka, profession, caste_branch, photo_url, status, rejection_reason, reviewed_at, approved_at, created_at',
          )
          .eq('id', id)
          .single()

        if (memberError) {
          throw memberError
        }

        const safeMember = data as Member
        const signedPhotoUrl = await createSignedPhotoUrl(safeMember.photo_url)

        if (cancelled) {
          return
        }

        setMember(safeMember)
        setPhotoUrl(signedPhotoUrl)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load member.')
          setMember(null)
          setPhotoUrl(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [id, navigate])

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
        <div className="page-wrap rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          Member not found.
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <Link
            to="/admin"
            className="text-sm font-medium text-emerald-700 no-underline"
          >
            ← Back to Admin
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {member.full_name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                CNIC: {member.cnic} · District: {member.district}
                {member.taluka ? ` · Taluka: ${member.taluka}` : ''}
              </p>
            </div>

            <StatusBadge status={member.status} />
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={member.full_name}
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                No photo
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Member Details
            </h2>

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
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                <p className="font-medium">Rejection Reason</p>
                <p className="mt-1">{member.rejection_reason}</p>
              </div>
            ) : null}
          </div>
        </section>

        {member.status === 'pending' ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Review Application
            </h2>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="h-11 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {actionLoading ? 'Processing...' : 'Approve Member'}
              </button>
            </div>

            <div className="mt-6 max-w-xl">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
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
                className="mt-3 h-11 w-full rounded-lg bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60 sm:w-auto"
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

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  )
}