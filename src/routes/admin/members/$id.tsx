import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { approveMemberAction, rejectMemberAction } from '../../../lib/admin/actions'
import { supabase } from '../../../lib/supabase/client'

export const Route = createFileRoute('/admin/members/$id')({
  component: AdminMemberDetailPage,
})

type Member = {
  id: string
  user_id: string
  member_no: string | null
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  profession: string | null
  caste_branch: string | null
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  approved_at: string | null
  created_at: string
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

  useEffect(() => {
    loadMember()
  }, [id])

  async function loadMember() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate({ to: '/login' })
      return
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!role) {
      navigate({ to: '/dashboard' })
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMember(data)

    if (data.photo_url) {
      const { data: signed } = await supabase.storage
        .from('member-photos')
        .createSignedUrl(data.photo_url, 60 * 60)

      setPhotoUrl(signed?.signedUrl ?? null)
    }

    setLoading(false)
  }

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  async function handleApprove() {
    if (!member) return

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
    }

    setActionLoading(false)
  }

  async function handleReject() {
    if (!member) return

    setActionLoading(true)
    setError('')

    try {
      const accessToken = await getAccessToken()

      await rejectMemberAction({
        data: {
          memberId: member.id,
          rejectionReason,
          accessToken,
        },
      })

      setRejectionReason('')
      await loadMember()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject member.')
    }

    setActionLoading(false)
  }

  if (loading) {
    return (
      <main className="px-4 py-10">
        <div className="page-wrap rounded-2xl bg-white p-6 shadow-sm">
          Loading member...
        </div>
      </main>
    )
  }

  if (!member) {
    return (
      <main className="px-4 py-10">
        <div className="page-wrap rounded-2xl bg-white p-6 shadow-sm">
          Member not found.
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-10">
      <div className="page-wrap space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
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
          <div className="rounded-2xl bg-white p-6 shadow-sm">
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
              <InfoItem label="Profession" value={member.profession} />
              <InfoItem label="Caste Branch" value={member.caste_branch} />
              <InfoItem label="Member No" value={member.member_no} />
              <InfoItem
                label="Submitted"
                value={new Date(member.created_at).toLocaleString()}
              />
              <InfoItem
                label="Approved At"
                value={
                  member.approved_at
                    ? new Date(member.approved_at).toLocaleString()
                    : null
                }
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
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Review Application
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
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
                  className="input min-h-28"
                  placeholder="Write reason before rejecting..."
                />
              </label>

              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || rejectionReason.trim().length < 3}
                className="mt-3 rounded-lg bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                Reject Member
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

function StatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected'
}) {
  const styles = {
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
