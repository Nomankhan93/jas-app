// src/routes/verify/$memberNo.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  IdCard,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'
import { verifyMemberAction } from '../../lib/verify/actions'

export const Route = createFileRoute('/verify/$memberNo')({
  component: VerifyMemberPage,
})

type MemberStatus = 'pending' | 'approved' | 'rejected'

type VerifyResult = {
  found: boolean
  verified: boolean
  member: {
    id: string
    member_no: string | null
    full_name: string
    district: string
    taluka: string | null
    status: MemberStatus
    approved_at: string | null
  } | null
  photoSignedUrl: string | null
}

function VerifyMemberPage() {
  const { memberNo } = Route.useParams()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadVerification = useCallback(
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
      setSuccess('')

      try {
        const data = await verifyMemberAction({
          data: {
            memberNo,
          },
        })

        if (!cancelledRef?.current) {
          setResult(data)
        }
      } catch (err) {
        if (!cancelledRef?.current) {
          setResult(null)
          setError(
            err instanceof Error ? err.message : 'Failed to verify membership.',
          )
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [memberNo],
  )

  useEffect(() => {
    const cancelledRef = { current: false }

    void loadVerification(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [loadVerification])

  async function copyVerificationLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setSuccess('Verification link copied.')
      setError('')
    } catch {
      setError('Could not copy verification link.')
    }
  }

  async function copyMemberNo() {
    try {
      await navigator.clipboard.writeText(memberNo)
      setSuccess('Member number copied.')
      setError('')
    } catch {
      setError('Could not copy member number.')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Verifying membership...
          </div>
        </div>
      </main>
    )
  }

  const verified = Boolean(result?.verified && result.member)
  const notFound = !result?.found
  const notVerified = Boolean(result?.found && !result.verified)

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-5 sm:space-y-6">
        <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 text-center sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
              Jatt Alliance Sindh
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Membership Verification
            </h1>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Public QR verification page for JAS digital membership cards.
              Always confirm that the status below is approved and verified.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadVerification(undefined, { silent: true })}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh Status
              </button>

              <button
                type="button"
                onClick={copyVerificationLink}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <SummaryItem
              label="Searched Member No"
              value={memberNo}
              icon={<IdCard className="h-4 w-4" />}
            />
            <SummaryItem
              label="Record Status"
              value={
                verified
                  ? 'Verified'
                  : notFound
                    ? 'Not found'
                    : getStatusLabel(result?.member?.status)
              }
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <SummaryItem
              label="Verification Result"
              value={
                verified
                  ? 'Approved member'
                  : notFound
                    ? 'No record'
                    : 'Not approved'
              }
              icon={<BadgeCheck className="h-4 w-4" />}
            />
          </div>
        </header>

        {error ? (
          <AlertBox tone="error" icon={<AlertCircle className="h-5 w-5" />}>
            {error}
          </AlertBox>
        ) : null}

        {success ? (
          <AlertBox tone="success" icon={<CheckCircle2 className="h-5 w-5" />}>
            {success}
          </AlertBox>
        ) : null}

        {notFound ? (
          <VerificationState
            tone="danger"
            icon={<XCircle className="h-10 w-10" />}
            title="Member Not Found"
            message="No JAS member record was found for this membership number. Please check the number printed on the card or scan the QR code again."
          >
            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-100">
              <Info label="Searched Member No" value={memberNo} />
            </div>
          </VerificationState>
        ) : verified && result?.member ? (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 p-6 text-center text-white sm:p-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
                <CheckCircle2 className="h-11 w-11" />
              </div>

              <h2 className="mt-5 text-2xl font-black sm:text-4xl">
                Verified Member
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-50">
                This membership is active and verified by Jatt Alliance Sindh.
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex flex-col items-center gap-6 text-center">
                {result.photoSignedUrl ? (
                  <img
                    src={result.photoSignedUrl}
                    alt={`${result.member.full_name} profile photo`}
                    className="h-36 w-36 rounded-3xl object-cover shadow-sm ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                    <User className="h-12 w-12" />
                  </div>
                )}

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Verified Name
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                    {result.member.full_name}
                  </h3>
                </div>

                <div className="grid w-full max-w-3xl gap-4 rounded-3xl bg-slate-50 p-5 text-left ring-1 ring-slate-100 md:grid-cols-2">
                  <Info
                    label="Member No"
                    value={result.member.member_no ?? 'N/A'}
                  />
                  <Info label="Status" value="Approved / Verified" />
                  <Info label="District" value={result.member.district} />
                  <Info
                    label="Taluka"
                    value={result.member.taluka || 'Not provided'}
                  />
                  <Info
                    label="Approved At"
                    value={formatDate(result.member.approved_at)}
                  />
                  <Info label="Verified By" value="Jatt Alliance Sindh" />
                </div>

                <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={copyMemberNo}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Member No
                  </button>

                  <Link
                    to="/"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <Home className="h-4 w-4" />
                    Go to JAS Home
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : notVerified ? (
          <VerificationState
            tone="warning"
            icon={<ShieldAlert className="h-10 w-10" />}
            title="Not a Verified Member"
            message="This record exists, but the membership is not currently approved. Do not accept this card as active membership proof."
          >
            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-100">
              <Info label="Member No" value={memberNo} />
              <Info
                label="Current Status"
                value={getStatusLabel(result?.member?.status)}
              />
            </div>
          </VerificationState>
        ) : (
          <VerificationState
            tone="danger"
            icon={<XCircle className="h-10 w-10" />}
            title="Verification Failed"
            message="The membership record could not be verified at this time."
          />
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[48px_1fr_auto] md:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ExternalLink className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-950">
                Verification guidance
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                A valid JAS card must show an approved status on this page. If
                the page says not found, pending, or rejected, the card should
                not be treated as verified.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 no-underline shadow-sm transition hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              JAS Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function VerificationState({
  tone,
  icon,
  title,
  message,
  children,
}: {
  tone: 'danger' | 'warning'
  icon: ReactNode
  title: string
  message: string
  children?: ReactNode
}) {
  const config = {
    danger: {
      wrapper: 'from-red-50 via-white to-red-50',
      icon: 'bg-red-50 text-red-700 ring-red-100',
      title: 'text-red-900',
    },
    warning: {
      wrapper: 'from-amber-50 via-white to-amber-50',
      icon: 'bg-amber-50 text-amber-700 ring-amber-100',
      title: 'text-amber-900',
    },
  }[tone]

  return (
    <section
      className={`rounded-3xl bg-gradient-to-br ${config.wrapper} p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-8`}
    >
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-1 ${config.icon}`}
      >
        {icon}
      </div>

      <h2 className={`mt-5 text-xl font-black sm:text-3xl ${config.title}`}>
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {message}
      </p>

      {children}
    </section>
  )
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-black text-slate-950">
            {value}
          </p>
        </div>

        <span className="text-emerald-700">{icon}</span>
      </div>
    </div>
  )
}

function AlertBox({
  tone,
  icon,
  children,
}: {
  tone: 'error' | 'success'
  icon: ReactNode
  children: ReactNode
}) {
  const classes =
    tone === 'error'
      ? 'bg-red-50 text-red-700 ring-red-100'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-100'

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-medium ring-1 ${classes}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-950">
        {value || 'N/A'}
      </p>
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusLabel(status: MemberStatus | undefined) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'pending':
      return 'Pending'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Unknown'
  }
}