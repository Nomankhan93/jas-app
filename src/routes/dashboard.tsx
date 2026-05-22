import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  IdCard,
  LogOut,
  Pencil,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'
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
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string

  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
}

type StatusStep = {
  key: string
  label: string
  sub: (member: Member) => string
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'submitted',
    label: 'Form submitted',
    sub: (member) => formatDate(member.created_at),
  },
  {
    key: 'review',
    label: 'Admin review',
    sub: (member) => {
      if (member.status === 'approved') return 'Completed'
      if (member.status === 'rejected') return 'Rejected'
      return 'In progress'
    },
  },
  {
    key: 'approval',
    label: 'Approval & ID issue',
    sub: (member) => {
      if (member.status === 'approved') {
        return member.approved_at
          ? `Approved ${formatDate(member.approved_at)}`
          : 'Approved'
      }

      if (member.status === 'rejected') return 'Not approved'

      return 'Awaiting approval'
    },
  },
  {
    key: 'card',
    label: 'Digital card ready',
    sub: (member) => {
      if (member.status === 'approved' && member.member_no) {
        return 'Ready to download'
      }

      if (member.status === 'rejected') return 'Unavailable'

      return 'After approval'
    },
  },
]

function getActiveStep(status: Member['status']) {
  if (status === 'pending') return 1
  if (status === 'approved') return 3
  if (status === 'rejected') return 1

  return 0
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
    setPhotoSignedUrl(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate({ to: '/login' })
      return
    }

    const { data: rawData, error } = await supabase
      .from('members')
      .select(
        [
          'id',
          'user_id',
          'member_no',
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
          'approved_at',
          'created_at',
          'updated_at',
          'address',
          'date_of_birth',
          'gender',
          'education',
          'blood_group',
          'emergency_contact_name',
          'emergency_contact_relation',
          'emergency_contact_mobile',
          'declaration_accepted',
        ].join(', '),
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const data = rawData as unknown as Member | null

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
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            <p className="text-sm">Loading dashboard…</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700">
              <ShieldCheck
                size={18}
                className="text-white"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Jatt Alliance Sindh
              </p>
              <h1 className="text-lg font-semibold leading-tight text-slate-900">
                Member Dashboard
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </header>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        ) : null}

        {!member ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText
                size={28}
                className="text-slate-400"
                aria-hidden="true"
              />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Complete your membership registration
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Your account is created but your JAS membership form has not been
              submitted yet.
            </p>

            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              <Pencil size={14} aria-hidden="true" />
              Fill Membership Form
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Membership profile
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Your submitted membership information.
                  </p>
                </div>

                <StatusBadge status={member.status} />
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="relative shrink-0">
                    {photoSignedUrl ? (
                      <img
                        src={photoSignedUrl}
                        alt={member.full_name}
                        className="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
                        <User
                          size={36}
                          className="text-slate-300"
                          aria-hidden="true"
                        />
                      </div>
                    )}

                    {member.status === 'approved' ? (
                      <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-white">
                        <Check
                          size={11}
                          className="text-white"
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
                    <InfoItem label="Full name" value={member.full_name} />
                    <InfoItem label="Father name" value={member.father_name} />
                    <InfoItem label="CNIC" value={member.cnic} mono />
                    <InfoItem label="Mobile" value={member.mobile} mono />
                    <InfoItem label="District" value={member.district} />
                    <InfoItem label="Taluka" value={member.taluka} />
                    <InfoItem label="Profession" value={member.profession} />
                    <InfoItem label="Caste branch" value={member.caste_branch} />
                  </div>
                </div>

                <ProfileSection title="Additional profile details">
                  <InfoItem
                    label="Date of birth"
                    value={formatDate(member.date_of_birth)}
                  />
                  <InfoItem label="Gender" value={member.gender} />
                  <InfoItem label="Education" value={member.education} />
                  <InfoItem label="Blood group" value={member.blood_group} />
                </ProfileSection>

                <ProfileSection title="Residential address">
                  <InfoItem
                    label="Complete address"
                    value={member.address}
                    className="sm:col-span-2"
                  />
                </ProfileSection>

                <ProfileSection title="Emergency contact">
                  <InfoItem
                    label="Contact name"
                    value={member.emergency_contact_name}
                  />
                  <InfoItem
                    label="Relation"
                    value={member.emergency_contact_relation}
                  />
                  <InfoItem
                    label="Contact mobile"
                    value={member.emergency_contact_mobile}
                    mono
                  />
                  <InfoItem
                    label="Declaration"
                    value={
                      member.declaration_accepted ? 'Accepted' : 'Not accepted'
                    }
                  />
                </ProfileSection>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Member no.
                    </p>

                    {member.member_no ? (
                      <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900">
                        {member.member_no}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm italic text-slate-400">
                        Not issued yet
                      </p>
                    )}
                  </div>

                  <IdCard
                    size={28}
                    className="text-slate-300"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {member.status === 'pending' ? (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit pending form
                    </Link>
                  ) : null}

                  {member.status === 'approved' ? (
                    <Link
                      to="/card"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <CreditCard size={14} aria-hidden="true" />
                      View digital card
                    </Link>
                  ) : null}

                  {member.status === 'rejected' ? (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      Resubmit application
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Application progress
                </p>

                <ol className="space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const activeIndex = getActiveStep(member.status)
                    const isDone = index < activeIndex
                    const isActive = index === activeIndex
                    const isLast = index === STATUS_STEPS.length - 1

                    return (
                      <li key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={[
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                              isDone ? 'bg-emerald-600' : '',
                              isActive
                                ? 'bg-amber-400 ring-4 ring-amber-100'
                                : '',
                              !isDone && !isActive
                                ? 'border border-slate-200 bg-slate-100'
                                : '',
                            ].join(' ')}
                          >
                            {isDone ? (
                              <Check
                                size={10}
                                className="text-white"
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>

                          {!isLast ? (
                            <div
                              className={[
                                'my-1 w-px flex-1',
                                isDone ? 'bg-emerald-200' : 'bg-slate-100',
                              ].join(' ')}
                            />
                          ) : null}
                        </div>

                        <div className="pb-4">
                          <p
                            className={[
                              'text-sm font-medium',
                              isActive || isDone
                                ? 'text-slate-900'
                                : 'text-slate-400',
                            ].join(' ')}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-400">
                            {step.sub(member)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>

              <StatusMessage member={member} />
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function ProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </p>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  mono = false,
  className = '',
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={[
          'mt-0.5 text-sm text-slate-900',
          mono ? 'font-mono' : '',
        ].join(' ')}
      >
        {value || <span className="italic text-slate-400">Not provided</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: Member['status'] }) {
  const config = {
    pending: {
      Icon: Clock,
      text: 'Pending',
      cls: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    approved: {
      Icon: BadgeCheck,
      text: 'Approved',
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    rejected: {
      Icon: XCircle,
      text: 'Rejected',
      cls: 'bg-red-50 text-red-700 ring-red-200',
    },
  }

  const { Icon, text, cls } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      <Icon size={12} aria-hidden="true" />
      {text}
    </span>
  )
}

function StatusMessage({ member }: { member: Member }) {
  if (member.status === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Hourglass size={15} className="text-amber-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-amber-800">Under review</p>
        </div>

        <p className="text-xs leading-relaxed text-amber-700">
          Your application is being reviewed. Admin approval is required before
          your digital card is issued.
        </p>
      </div>
    )
  }

  if (member.status === 'approved') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <CheckCircle2
            size={15}
            className="text-emerald-600"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-emerald-800">
            Verified member
          </p>
        </div>

        <p className="text-xs leading-relaxed text-emerald-700">
          Approved on {formatDate(member.approved_at)}
        </p>
      </div>
    )
  }

  if (member.status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <XCircle size={15} className="text-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-800">
            Application rejected
          </p>
        </div>

        <p className="text-xs leading-relaxed text-red-700">
          {member.rejection_reason ||
            'No reason was provided. Please update and resubmit your application.'}
        </p>
      </div>
    )
  }

  return null
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}