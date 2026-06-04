// src/routes/admin/members/$id.tsx
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Hourglass,
  IdCard,
  ImageOff,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import {
  approveMemberAction,
  rejectMemberAction,
} from '../../../lib/admin/actions'
import { supabase } from '../../../lib/supabase/client'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_MANUAL_PAYMENT_DETAILS,
  MEMBERSHIP_PAYMENT_QR_IMAGE_PATH,
  MEMBERSHIP_RECEIPT_BUCKET,
  type MembershipPayment,
  type MembershipPaymentStatus,
  formatMembershipMoney,
  getMembershipFeeSubtext,
  getMembershipPaymentQrHelpText,
  getMembershipPaymentDisplayStatus,
  getMembershipPaymentStatusClass,
  getMembershipPaymentStatusLabel,
} from '../../../lib/membership-fee'

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
const MIN_REJECTION_REASON_LENGTH = 10
const MEMBERSHIP_REVIEW_ROLES: Array<
  'admin' | 'super_admin' | 'membership_admin'
> = ['admin', 'super_admin', 'membership_admin']

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
  const isNestedMemberRoute =
    normalizedPathname === `/admin/members/${id}/card` ||
    normalizedPathname === `/admin/members/${id}/designation-card`

  if (isNestedMemberRoute) {
    return <Outlet />
  }

  return <AdminMemberApplicationPage id={id} />
}

function AdminMemberApplicationPage({ id }: { id: string }) {
  const navigate = useNavigate()

  const [member, setMember] = useState<Member | null>(null)
  const [membershipPayment, setMembershipPayment] = useState<MembershipPayment | null>(null)
  const [paymentAdminNote, setPaymentAdminNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentActionLoading, setPaymentActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const trimmedRejectionReason = useMemo(
    () => rejectionReason.trim(),
    [rejectionReason],
  )

  const canViewCard = member?.status === 'approved' && Boolean(member.member_no)
  const reasonTooShort =
    trimmedRejectionReason.length > 0 &&
    trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH

  const loadMember = useCallback(
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

        const safeMember = await fetchMemberById(id)

        if (!safeMember) {
          throw new Error('Member not found.')
        }

        const safeMembershipPayment = await fetchMembershipPaymentByMemberId(
          safeMember.id,
        )

        const [signedPhotoUrl, signedReceiptUrl] = await Promise.all([
          createSignedPhotoUrl(safeMember.photo_url),
          createSignedReceiptUrl(safeMembershipPayment?.receipt_path),
        ])

        if (cancelledRef?.current) return

        setMember(safeMember)
        setMembershipPayment(safeMembershipPayment)
        setPaymentAdminNote(safeMembershipPayment?.admin_note ?? '')
        setPhotoUrl(signedPhotoUrl)
        setReceiptUrl(signedReceiptUrl)
      } catch (err) {
        if (!cancelledRef?.current) {
          setError(err instanceof Error ? err.message : 'Failed to load member.')
          setMember(null)
          setMembershipPayment(null)
          setPaymentAdminNote('')
          setPhotoUrl(null)
          setReceiptUrl(null)
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
          setRefreshing(false)
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
    if (!member || actionLoading) return

    const confirmed = window.confirm(
      `Approve ${member.full_name}? This will issue/activate membership and enable the digital card when member number is available.`,
    )

    if (!confirmed) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const accessToken = await getAccessToken()

      await approveMemberAction({
        data: {
          memberId: member.id,
          accessToken,
        },
      })

      setSuccess('Member approved successfully.')
      await loadMember(undefined, { silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve member.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (
      !member ||
      actionLoading ||
      trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH
    ) {
      return
    }

    const confirmed = window.confirm(
      `Reject ${member.full_name}? The member will need to update and resubmit the application.`,
    )

    if (!confirmed) return

    setActionLoading(true)
    setError('')
    setSuccess('')

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
      setSuccess('Application rejected with reason.')
      await loadMember(undefined, { silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject member.')
    } finally {
      setActionLoading(false)
    }
  }


  async function handlePaymentStatusUpdate(status: MembershipPaymentStatus) {
    if (!member || paymentActionLoading) return

    const confirmed = window.confirm(
      `Update membership fee status to ${getMembershipPaymentStatusLabel(status)}?`,
    )

    if (!confirmed) return

    setPaymentActionLoading(true)
    setError('')
    setSuccess('')

    const taxAmount = Number(membershipPayment?.tax_amount ?? 0)
    const baseAmount = Number(membershipPayment?.base_amount ?? MEMBERSHIP_BASE_FEE)

    try {
      const { error: paymentError } = await supabase
        .from('membership_payments')
        .upsert(
          {
            member_id: member.id,
            user_id: member.user_id,
            base_amount: baseAmount,
            tax_amount: taxAmount,
            total_amount: baseAmount + taxAmount,
            currency: membershipPayment?.currency ?? 'PKR',
            status,
            payment_method: membershipPayment?.payment_method ?? 'bank',
            gateway_provider: membershipPayment?.gateway_provider ?? 'manual_mobilink_microfinance_bank',
            gateway_reference: membershipPayment?.gateway_reference ?? null,
            receipt_path: membershipPayment?.receipt_path ?? null,
            receipt_file_name: membershipPayment?.receipt_file_name ?? null,
            receipt_mime_type: membershipPayment?.receipt_mime_type ?? null,
            receipt_size_bytes: membershipPayment?.receipt_size_bytes ?? null,
            receipt_uploaded_at: membershipPayment?.receipt_uploaded_at ?? null,
            admin_note: paymentAdminNote.trim() || null,
            paid_at:
              status === 'paid'
                ? new Date().toISOString()
                : status === 'pending'
                  ? null
                  : membershipPayment?.paid_at ?? null,
          },
          { onConflict: 'member_id' },
        )

      if (paymentError) throw paymentError

      setSuccess(`Membership fee marked as ${getMembershipPaymentStatusLabel(status)}.`)
      await loadMember(undefined, { silent: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update membership fee status.',
      )
    } finally {
      setPaymentActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading member application...
          </div>
        </div>
      </main>
    )
  }

  if (!member) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <BackToAdmin />

          <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <h1 className="text-xl font-black text-red-900">
                  Member not found
                </h1>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  {error || 'This member record could not be loaded.'}
                </p>
              </div>
            </div>
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
            <BackToAdmin />

            <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Member Application
                </p>

                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {member.full_name}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  CNIC:{' '}
                  <span className="font-bold text-slate-800">
                    {formatCnic(member.cnic)}
                  </span>{' '}
                  · District:{' '}
                  <span className="font-bold text-slate-800">
                    {member.district}
                    {member.taluka ? ` / ${member.taluka}` : ''}
                  </span>
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

                <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto">
                  <button
                    type="button"
                    onClick={() => void loadMember(undefined, { silent: true })}
                    disabled={refreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </button>

                  {canViewCard ? (
                    <>
                      <Link
                        to="/admin/members/$id/card"
                        params={{ id: member.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        style={{ color: '#ffffff' }}
                      >
                        <CreditCard className="h-4 w-4" />
                        View Card
                      </Link>

                      <Link
                        to="/admin/members/$id/designation-card"
                        params={{ id: member.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:from-emerald-900 hover:to-slate-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                        style={{ color: '#ffffff' }}
                      >
                        <BadgeCheck className="h-4 w-4 text-amber-300" />
                        Office Bearer Card
                      </Link>
                    </>
                  ) : null}
                </div>

                {!canViewCard ? (
                  <p className="max-w-xs text-left text-xs leading-5 text-slate-500 lg:text-right">
                    Digital card will be available after approval and membership
                    number issuance.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
            <SummaryItem
              label="Status"
              value={getStatusLabel(member.status)}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <SummaryItem
              label="Fee Status"
              value={getMembershipPaymentStatusLabel(
                getMembershipPaymentDisplayStatus(membershipPayment),
              )}
              icon={<CreditCard className="h-4 w-4" />}
            />
            <SummaryItem
              label="Member No"
              value={member.member_no || 'Not issued'}
              icon={<IdCard className="h-4 w-4" />}
            />
            <SummaryItem
              label="Submitted"
              value={formatDate(member.created_at, true) || 'Not provided'}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <SummaryItem
              label="Reviewed"
              value={
                formatDate(member.reviewed_at || member.approved_at, true) ||
                'Not reviewed'
              }
              icon={<Clock className="h-4 w-4" />}
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

        <MembershipFeeAdminPanel
          payment={membershipPayment}
          receiptUrl={receiptUrl}
          adminNote={paymentAdminNote}
          onAdminNoteChange={setPaymentAdminNote}
          onStatusUpdate={handlePaymentStatusUpdate}
          loading={paymentActionLoading}
        />

        <StatusPanel member={member} />

        <section className="grid gap-6 md:grid-cols-3">
          <aside className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <MemberPhoto src={photoUrl} alt={member.full_name} />

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Quick Contact
              </p>
              <p className="mt-2 break-all text-sm font-black text-slate-950">
                {formatMobile(member.mobile)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {member.district}
                {member.taluka ? `, ${member.taluka}` : ''}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="leading-6">
                  Admin verification view shows full CNIC and contact details
                  for review purposes.
                </p>
              </div>
            </div>
          </aside>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Member Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Personal and membership information submitted by the member.
                </p>
              </div>

              {canViewCard ? (
                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                  <Link
                    to="/admin/members/$id/card"
                    params={{ id: member.id }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    <CreditCard className="h-4 w-4" />
                    Open Card
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    Office Card
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-5">
              <DetailGroup title="Identity">
                <InfoItem label="Full Name" value={member.full_name} />
                <InfoItem label="Father Name" value={member.father_name} />
                <InfoItem label="CNIC" value={formatCnic(member.cnic)} />
                <InfoItem label="Mobile" value={formatMobile(member.mobile)} />
              </DetailGroup>

              <DetailGroup title="Location">
                <InfoItem label="District" value={member.district} />
                <InfoItem label="Taluka" value={member.taluka} />
                <InfoItem label="Address" value={member.address} wide />
              </DetailGroup>

              <DetailGroup title="Profile">
                <InfoItem
                  label="Date of Birth"
                  value={formatDate(member.date_of_birth)}
                />
                <InfoItem label="Gender" value={member.gender} />
                <InfoItem label="Education" value={member.education} />
                <InfoItem label="Blood Group" value={member.blood_group} />
                <InfoItem label="Profession" value={member.profession} />
                <InfoItem label="Caste Branch" value={member.caste_branch} />
              </DetailGroup>

              <DetailGroup title="Emergency Contact">
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
                  value={formatMobile(member.emergency_contact_mobile)}
                />
                <InfoItem
                  label="Declaration Accepted"
                  value={member.declaration_accepted ? 'Yes' : 'No'}
                />
              </DetailGroup>

              <DetailGroup title="Review Record">
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
              </DetailGroup>
            </div>

            {member.rejection_reason ? (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">Rejection Reason</p>
                    <p className="mt-1 leading-6">{member.rejection_reason}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </section>

        {member.status === 'pending' ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Review Application
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Approve this member if details are correct. Reject only with a
                  clear reason so the member can update and resubmit.
                </p>
              </div>

              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {actionLoading ? 'Processing...' : 'Approve Member'}
              </button>
            </div>

            <div className="mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-red-900">
                  Rejection Reason
                </span>

                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:text-sm"
                  placeholder="Example: CNIC format/photo/address is unclear. Please update and resubmit."
                />
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`text-xs font-medium ${
                    reasonTooShort ? 'text-red-700' : 'text-slate-500'
                  }`}
                >
                  Minimum {MIN_REJECTION_REASON_LENGTH} characters required.
                  Current: {trimmedRejectionReason.length}
                </p>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={
                    actionLoading ||
                    trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {actionLoading ? 'Processing...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Review Completed
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This application is currently marked as{' '}
                  <strong>{getStatusLabel(member.status)}</strong>.
                </p>
              </div>

              {canViewCard ? (
                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                  <Link
                    to="/admin/members/$id/card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <CreditCard className="h-4 w-4" />
                    View Card
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    Office Card
                  </Link>
                </div>
              ) : (
                <Link
                  to="/admin"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin List
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function BackToAdmin() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 no-underline hover:text-emerald-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Admin
    </Link>
  )
}

function MemberPhoto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
        <div className="text-center">
          <ImageOff className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2">No photo</p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${alt} profile photo`}
      className="aspect-square w-full rounded-2xl object-cover ring-1 ring-slate-200"
    />
  )
}


function MembershipFeeAdminPanel({
  payment,
  receiptUrl,
  adminNote,
  onAdminNoteChange,
  onStatusUpdate,
  loading,
}: {
  payment: MembershipPayment | null
  receiptUrl: string | null
  adminNote: string
  onAdminNoteChange: (value: string) => void
  onStatusUpdate: (status: MembershipPaymentStatus) => void
  loading: boolean
}) {
  const status = getMembershipPaymentDisplayStatus(payment)

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-200/80 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Membership Fee
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Application fee status
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Membership fee is separate from voluntary donations. Applicant must upload a manual bank payment receipt before submission.
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${getMembershipPaymentStatusClass(
            status,
          )}`}
        >
          {getMembershipPaymentStatusLabel(status)}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoItem
            label="Base Fee"
            value={formatMembershipMoney(payment?.base_amount ?? MEMBERSHIP_BASE_FEE)}
          />
          <InfoItem
            label="Tax/Charges"
            value={payment ? formatMembershipMoney(payment.tax_amount) : 'Rs. 0'}
          />
          <InfoItem
            label="Total"
            value={formatMembershipMoney(payment?.total_amount ?? MEMBERSHIP_BASE_FEE)}
          />
          <InfoItem label="Method" value={payment?.payment_method ?? 'bank'} />
          <InfoItem label="Payment Account" value={`${MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName} · ${MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber}`} />
          <InfoItem label="Account Title" value={MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountTitle} />
          <InfoItem label="IBAN" value={MEMBERSHIP_MANUAL_PAYMENT_DETAILS.iban} />
          <InfoItem label="Till ID" value={MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId} />
          <InfoItem label="Receipt File" value={payment?.receipt_file_name || (payment?.receipt_path ? 'Uploaded' : 'Not uploaded')} />
          <InfoItem label="Receipt Uploaded" value={formatDate(payment?.receipt_uploaded_at, true)} />
          <InfoItem label="Paid At" value={formatDate(payment?.paid_at, true)} />
          <InfoItem label="Updated At" value={formatDate(payment?.updated_at, true)} />
          <InfoItem label="Charges Note" value={getMembershipFeeSubtext()} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
          <img
            src={MEMBERSHIP_PAYMENT_QR_IMAGE_PATH}
            alt="Membership fee payment QR code"
            className="mx-auto w-full max-w-[240px] rounded-xl object-contain"
            loading="lazy"
          />
          <p className="mt-3 text-xs font-bold leading-5 text-slate-800">
            {getMembershipPaymentQrHelpText()}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Payment Receipt
        </p>
        {receiptUrl ? (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-black !text-white no-underline transition hover:bg-slate-800 hover:!text-white"
            style={{ color: '#ffffff' }}
          >
            Open Receipt
          </a>
        ) : (
          <p className="mt-2 text-sm font-semibold text-red-700">
            No receipt uploaded. Application should not be accepted without manual verification.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-800">
            Admin Note
          </span>
          <textarea
            value={adminNote}
            onChange={(event) => onAdminNoteChange(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 sm:text-sm"
            placeholder="Optional note for manual payment, waiver, or pending follow-up."
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
          <button
            type="button"
            onClick={() => onStatusUpdate('paid')}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Paid
          </button>
          <button
            type="button"
            onClick={() => onStatusUpdate('waived')}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Waive
          </button>
          <button
            type="button"
            onClick={() => onStatusUpdate('pending')}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Pending
          </button>
        </div>
      </div>
    </section>
  )
}

function StatusPanel({ member }: { member: Member }) {
  const config: Record<
    MemberStatus,
    {
      title: string
      text: string
      className: string
      icon: ReactNode
    }
  > = {
    pending: {
      title: 'Pending admin review',
      text: 'Please verify CNIC, mobile, address, district/taluka, photo quality, and declaration before approval.',
      className: 'bg-amber-50 text-amber-900 ring-amber-100',
      icon: <Hourglass className="h-5 w-5 text-amber-700" />,
    },
    approved: {
      title: 'Application approved',
      text: member.member_no
        ? `Membership number ${member.member_no} is issued. The digital card is available.`
        : 'Application is approved, but member number is not available yet.',
      className: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
      icon: <BadgeCheck className="h-5 w-5 text-emerald-700" />,
    },
    rejected: {
      title: 'Application rejected',
      text:
        member.rejection_reason ||
        'Application was rejected. No rejection reason is available.',
      className: 'bg-red-50 text-red-900 ring-red-100',
      icon: <XCircle className="h-5 w-5 text-red-700" />,
    },
  }

  const item = config[member.status]

  return (
    <section className={`rounded-3xl p-5 ring-1 ${item.className}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">{item.icon}</div>
        <div>
          <h2 className="text-base font-black">{item.title}</h2>
          <p className="mt-1 text-sm leading-6">{item.text}</p>
        </div>
      </div>
    </section>
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
          <p className="mt-1 break-all text-sm font-black text-slate-950">
            {value}
          </p>
        </div>

        <span className="text-emerald-700">{icon}</span>
      </div>
    </div>
  )
}

function DetailGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
        <FileCheck2 className="h-4 w-4 text-emerald-700" />
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string | null | undefined
  wide?: boolean
}) {
  return (
    <div
      className={`rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 ${
        wide ? 'md:col-span-2' : ''
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || <span className="font-medium text-slate-400">Not provided</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const config: Record<
    MemberStatus,
    {
      icon: ReactNode
      className: string
      text: string
    }
  > = {
    pending: {
      icon: <Hourglass className="h-3.5 w-3.5" />,
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
    .select('id, role')
    .eq('user_id', user.id)
    .in('role', MEMBERSHIP_REVIEW_ROLES)
    .limit(1)

  if (roleError || !roles?.length) {
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
  if (!photoPath) return null

  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null

  return data.signedUrl
}

async function createSignedReceiptUrl(receiptPath: string | null | undefined) {
  if (!receiptPath) return null

  const { data, error } = await supabase.storage
    .from(MEMBERSHIP_RECEIPT_BUCKET)
    .createSignedUrl(receiptPath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null

  return data.signedUrl
}


async function fetchMembershipPaymentByMemberId(memberId: string) {
  const { data, error } = await supabase
    .from('membership_payments')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
    .returns<MembershipPayment | null>()

  if (error) {
    console.warn('Membership payment status could not be loaded:', error.message)
    return null
  }

  return data
}

async function fetchMemberById(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error

  return data as Member | null
}

function getStatusLabel(status: MemberStatus) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return withTime
    ? date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function formatCnic(value: string | null | undefined) {
  if (!value) return 'N/A'

  const digits = value.replace(/\D/g, '')

  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
  }

  return value
}

function formatMobile(value: string | null | undefined) {
  if (!value) return 'N/A'

  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return digits
  }

  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`
  }

  return value
}