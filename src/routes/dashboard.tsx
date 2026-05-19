import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
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
  approved_at: string | null
  created_at: string
  updated_at: string
}

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate({ to: '/login' })
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMember(data)

    if (data?.photo_url) {
      const { data: signed } = await supabase.storage
        .from('member-photos')
        .createSignedUrl(data.photo_url, 60 * 60)

      setPhotoSignedUrl(signed?.signedUrl ?? null)
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Jatt Alliance Sindh
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Member Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track your membership application and digital ID card.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!member ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Complete your membership registration
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your account is created, but your JAS membership form has not been
              submitted yet.
            </p>

            <Link
              to="/register"
              className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Fill Membership Form
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Membership Profile
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Your submitted membership information.
                    </p>
                  </div>

                  <StatusBadge status={member.status} />
                </div>

                <div className="mt-6 flex flex-col gap-6 md:flex-row">
                  <div className="shrink-0">
                    {photoSignedUrl ? (
                      <img
                        src={photoSignedUrl}
                        alt={member.full_name}
                        className="h-32 w-32 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <InfoItem label="Full Name" value={member.full_name} />
                    <InfoItem label="Father Name" value={member.father_name} />
                    <InfoItem label="CNIC" value={member.cnic} />
                    <InfoItem label="Mobile" value={member.mobile} />
                    <InfoItem label="District" value={member.district} />
                    <InfoItem label="Profession" value={member.profession} />
                    <InfoItem label="Caste Branch" value={member.caste_branch} />
                    <InfoItem
                      label="Member No"
                      value={member.member_no ?? 'Not issued yet'}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {member.status === 'pending' ? (
                    <Link
                      to="/register"
                      className="rounded-lg border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Edit Pending Form
                    </Link>
                  ) : null}

                  {member.status === 'approved' ? (
                    <Link
                      to="/card"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      View Digital Card
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Current Status
                </h2>

                <div className="mt-4">
                  <StatusBadge status={member.status} />
                </div>

                {member.status === 'pending' ? (
                  <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Your application is under review. Admin approval is required
                    before your digital card is issued.
                  </p>
                ) : null}

                {member.status === 'approved' ? (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-medium">Verified member</p>
                    <p className="mt-1">
                      Approved on{' '}
                      {member.approved_at
                        ? new Date(member.approved_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                ) : null}

                {member.status === 'rejected' ? (
                  <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-medium">Application rejected</p>
                    <p className="mt-1">
                      {member.rejection_reason || 'No reason provided.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
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