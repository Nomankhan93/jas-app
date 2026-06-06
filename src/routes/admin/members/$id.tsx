// src/routes/admin/members/$id.tsx
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { AdminShell } from '../../../components/admin/AdminShell'
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
import { useAdminMemberDetailCopy } from '../../../lib/admin-member-detail-i18n'

// Membership fee helpers
// NOTE: These imports restore manual membership payment support on the admin
// member detail page. See docs/MEMBERSHIP_MANUAL_PAYMENT_PHASE2.md for
// more information about what data should be shown here.
import type {
  MembershipPayment,
  MembershipPaymentStatus,
} from '../../../lib/membership-fee'
import {
  formatMembershipMoney,
  getMembershipPaymentStatusLabel,
  MEMBERSHIP_MANUAL_PAYMENT_DETAILS,
  MEMBERSHIP_RECEIPT_BUCKET,
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
  const { copy, textDir, textAlignClass } = useAdminMemberDetailCopy()

  const [member, setMember] = useState<Member | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // membership payment state
  // Holds the membership payment record for this member (if any). When null,
  // it means no record exists. Loading and error states are handled
  // separately. See docs/MEMBERSHIP_MANUAL_PAYMENT_PHASE2.md for details.
  const [payment, setPayment] = useState<MembershipPayment | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  // Indicates if a payment status update is in progress
  const [paymentUpdating, setPaymentUpdating] = useState(false)

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
          throw new Error(copy.memberNotFound)
        }

        const signedPhotoUrl = await createSignedPhotoUrl(safeMember.photo_url)

        // Reset payment state before loading payment
        if (!cancelledRef?.current) {
          setPayment(null)
          setPaymentError('')
          setReceiptUrl(null)
          setPaymentLoading(true)
        }

        // Fetch membership payment record and generate signed receipt URL
        try {
          const paymentRecord = await fetchMembershipPaymentByMemberId(
            safeMember.id,
          )

          if (!cancelledRef?.current) {
            setPayment(paymentRecord)

            if (paymentRecord?.receipt_path) {
              const urlResult = await createSignedReceiptUrl(
                paymentRecord.receipt_path,
              )
              setReceiptUrl(urlResult)
            }
          }
        } catch (paymentErr) {
          if (!cancelledRef?.current) {
            setPaymentError(
              paymentErr instanceof Error
                ? paymentErr.message
                : 'Failed to load membership payment.',
            )
          }
        } finally {
          if (!cancelledRef?.current) {
            setPaymentLoading(false)
          }
        }

        if (cancelledRef?.current) return

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

  /**
   * Update the membership payment status for this member. When marking a
   * payment as paid, the `paid_at` timestamp is set to the current time.
   * When marking as waived or pending, `paid_at` is cleared. If the update
   * fails, an error message is stored in `paymentError`.
   */
  const updatePaymentStatus = useCallback(
    async (status: MembershipPaymentStatus) => {
      // If no payment record exists, nothing to update
      if (!payment) return

      // Confirm with the admin before proceeding
      const statusLabel = getMembershipPaymentStatusLabel(status)
      const confirmed = window.confirm(
        `Are you sure you want to mark this payment as ${statusLabel}?`,
      )
      if (!confirmed) return

      setPaymentUpdating(true)
      setPaymentError('')
      try {
        // prepare update payload
        const updatePayload: Partial<MembershipPayment> & {
          status: MembershipPaymentStatus
        } = {
          status,
        }

        // Set or clear paid_at based on new status
        if (status === 'paid') {
          updatePayload.paid_at = new Date().toISOString()
        } else {
          updatePayload.paid_at = null
        }

        const { data, error } = await supabase
          .from('membership_payments')
          .update(updatePayload)
          .eq('id', payment.id)
          .select('*')
          .maybeSingle()

        if (error) {
          throw new Error(error.message)
        }

        // Refresh local payment state
        setPayment(data as MembershipPayment)
        // Reload the signed receipt URL in case of any changes
        if (data?.receipt_path) {
          const urlResult = await createSignedReceiptUrl(data.receipt_path)
          setReceiptUrl(urlResult)
        } else {
          setReceiptUrl(null)
        }
      } catch (err) {
        setPaymentError(
          err instanceof Error
            ? err.message
            : 'Failed to update payment status.',
        )
      } finally {
        setPaymentUpdating(false)
      }
    },
    [payment],
  )

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

  if (loading) {
    return (
      <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
        <div className="page-wrap rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            {copy.loading}
          </div>
        </div>
      </div>
    </AdminShell>
    )
  }

  if (!member) {
    return (
      <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
        <div className="page-wrap space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <BackToAdmin />

          <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <h1 className="text-xl font-black text-red-900">
                  {copy.memberNotFound}
                </h1>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  {error || copy.memberNotFoundText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
    )
  }

  return (
    <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
      <div className="page-wrap space-y-6">
        <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
            <BackToAdmin />

            <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className={`min-w-0 ${textAlignClass}`} dir={textDir}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  {copy.pageEyebrow}
                </p>

                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {member.full_name}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {copy.cnic}:{' '}
                  <span className="font-bold text-slate-800">
                    {formatCnic(member.cnic)}
                  </span>{' '}
                  · {copy.district}:{' '}
                  <span className="font-bold text-slate-800">
                    {member.district}
                    {member.taluka ? ` / ${member.taluka}` : ''}
                  </span>
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {copy.memberNo}:{' '}
                  <span className="font-bold text-slate-900">
                    {member.member_no || copy.notIssuedYet}
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
                    {copy.refresh}
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
                        {copy.viewCard}
                      </Link>

                      <Link
                        to="/admin/members/$id/designation-card"
                        params={{ id: member.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:from-emerald-900 hover:to-slate-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                        style={{ color: '#ffffff' }}
                      >
                        <BadgeCheck className="h-4 w-4 text-amber-300" />
                        {copy.officeBearerCard}
                      </Link>
                    </>
                  ) : null}
                </div>

                {!canViewCard ? (
                  <p className="max-w-xs text-left text-xs leading-5 text-slate-500 lg:text-right">
                    {copy.digitalCardUnavailable}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <SummaryItem
              label={copy.summary.status}
              value={getStatusLabel(member.status, copy)}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.memberNo}
              value={member.member_no || copy.notIssued}
              icon={<IdCard className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.submitted}
              value={formatDate(member.created_at, true) || copy.notProvided}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.reviewed}
              value={
                formatDate(member.reviewed_at || member.approved_at, true) ||
                copy.notReviewed
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

        <StatusPanel member={member} />

        {/* Membership payment details for this member. Restored from 49f591c */}
        <PaymentSection
          payment={payment}
          loading={paymentLoading}
          error={paymentError}
          receiptUrl={receiptUrl}
          updating={paymentUpdating}
          onUpdateStatus={updatePaymentStatus}
        />

        <section className="grid gap-6 md:grid-cols-3">
          <aside className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <MemberPhoto src={photoUrl} alt={member.full_name} />

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {copy.sidebar.quickContact}
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
                  {copy.sidebar.verificationNotice}
                </p>
              </div>
            </div>
          </aside>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.details.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.details.subtitle}
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
                    {copy.openCard}
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    {copy.officeCard}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-5">
              <DetailGroup title={copy.details.identity}>
                <InfoItem label={copy.details.fullName} value={member.full_name} />
                <InfoItem label={copy.details.fatherName} value={member.father_name} />
                <InfoItem label={copy.cnic} value={formatCnic(member.cnic)} />
                <InfoItem label={copy.details.mobile} value={formatMobile(member.mobile)} />
              </DetailGroup>

              <DetailGroup title={copy.details.location}>
                <InfoItem label={copy.district} value={member.district} />
                <InfoItem label={copy.details.taluka} value={member.taluka} />
                <InfoItem label={copy.details.address} value={member.address} wide />
              </DetailGroup>

              <DetailGroup title={copy.details.profile}>
                <InfoItem
                  label={copy.details.dateOfBirth}
                  value={formatDate(member.date_of_birth)}
                />
                <InfoItem label={copy.details.gender} value={member.gender} />
                <InfoItem label={copy.details.education} value={member.education} />
                <InfoItem label={copy.details.bloodGroup} value={member.blood_group} />
                <InfoItem label={copy.details.profession} value={member.profession} />
                <InfoItem label={copy.details.casteBranch} value={member.caste_branch} />
              </DetailGroup>

              <DetailGroup title={copy.details.emergencyContact}>
                <InfoItem
                  label={copy.details.emergencyContactName}
                  value={member.emergency_contact_name}
                />
                <InfoItem
                  label={copy.details.emergencyContactRelation}
                  value={member.emergency_contact_relation}
                />
                <InfoItem
                  label={copy.details.emergencyContactMobile}
                  value={formatMobile(member.emergency_contact_mobile)}
                />
                <InfoItem
                  label={copy.details.declarationAccepted}
                  value={member.declaration_accepted ? copy.details.yes : copy.details.no}
                />
              </DetailGroup>

              <DetailGroup title={copy.details.reviewRecord}>
                <InfoItem label={copy.summary.memberNo} value={member.member_no} />
                <InfoItem
                  label={copy.summary.submitted}
                  value={formatDate(member.created_at, true)}
                />
                <InfoItem
                  label={copy.details.approvedAt}
                  value={formatDate(member.approved_at, true)}
                />
                <InfoItem
                  label={copy.details.reviewedAt}
                  value={formatDate(member.reviewed_at, true)}
                />
              </DetailGroup>
            </div>

            {member.rejection_reason ? (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">{copy.details.rejectionReason}</p>
                    <p className="mt-1 leading-6">{member.rejection_reason}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </section>

        {member.status === 'pending' ? (
          <section className="admin-member-review-panel rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.review.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {copy.review.subtitle}
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
                {actionLoading ? copy.review.processing : copy.review.approve}
              </button>
            </div>

            <ReviewChecklist member={member} />

            <div className="admin-member-rejection-box mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-red-900">
                  {copy.details.rejectionReason}
                </span>

                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:text-sm"
                  placeholder={copy.review.rejectionPlaceholder}
                />
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`text-xs font-medium ${
                    reasonTooShort ? 'text-red-700' : 'text-slate-500'
                  }`}
                >
                  {copy.review.minimum} {MIN_REJECTION_REASON_LENGTH} {copy.review.charactersRequired}
                  {copy.review.current}: {trimmedRejectionReason.length}
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
                  {actionLoading ? copy.review.processing : copy.review.reject}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.review.completedTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {copy.review.completedText}{' '}
                  <strong>{getStatusLabel(member.status, copy)}</strong>.
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
                    {copy.viewCard}
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    {copy.officeCard}
                  </Link>
                </div>
              ) : (
                <Link
                  to="/admin"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {copy.review.backToAdminList}
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
    </AdminShell>
  )
}

function BackToAdmin() {
  const { copy, iconBeforeClass } = useAdminMemberDetailCopy()

  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 no-underline hover:text-emerald-800"
    >
      <ArrowLeft className={`h-4 w-4 ${iconBeforeClass}`} />
      {copy.backToAdmin}
    </Link>
  )
}

function MemberPhoto({ src, alt }: { src: string | null; alt: string }) {
  const { copy } = useAdminMemberDetailCopy()

  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
        <div className="text-center">
          <ImageOff className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2">{copy.sidebar.noPhoto}</p>
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

function StatusPanel({ member }: { member: Member }) {
  const { copy } = useAdminMemberDetailCopy()

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
      title: copy.status.pendingTitle,
      text: copy.status.pendingText,
      className: 'bg-amber-50 text-amber-900 ring-amber-100',
      icon: <Hourglass className="h-5 w-5 text-amber-700" />,
    },
    approved: {
      title: copy.status.approvedTitle,
      text: member.member_no
        ? copy.status.approvedTextIssued.replace('{{memberNo}}', member.member_no)
        : copy.status.approvedTextMissing,
      className: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
      icon: <BadgeCheck className="h-5 w-5 text-emerald-700" />,
    },
    rejected: {
      title: copy.status.rejectedTitle,
      text:
        member.rejection_reason ||
        copy.status.rejectedText,
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


function ReviewChecklist({ member }: { member: Member }) {
  const checks = [
    {
      label: 'Photo',
      ready: Boolean(member.photo_url),
      text: member.photo_url ? 'Photo uploaded.' : 'Photo is missing.',
    },
    {
      label: 'CNIC & mobile',
      ready: Boolean(member.cnic && member.mobile),
      text: 'CNIC and mobile number should be verified before approval.',
    },
    {
      label: 'Area',
      ready: Boolean(member.district && member.taluka),
      text: member.taluka
        ? `${member.district} / ${member.taluka}`
        : 'Taluka is missing or not selected.',
    },
    {
      label: 'Declaration',
      ready: member.declaration_accepted,
      text: member.declaration_accepted
        ? 'Member accepted declaration.'
        : 'Declaration is not accepted.',
    },
  ]

  return (
    <div className="admin-member-checklist mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-950">
            Approval verification checklist
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-900/75">
            Review profile details, payment receipt and identity information before approval.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-emerald-100">
          Manual Review
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                  check.ready
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {check.ready ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{check.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-member-payment-note mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Payment receipt/status should be confirmed from the membership payment record before final approval.
          </p>
        </div>
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
  const { copy } = useAdminMemberDetailCopy()

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
        {value || <span className="font-medium text-slate-400">{copy.notProvided}</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const { copy } = useAdminMemberDetailCopy()

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
      text: copy.status.pending,
    },
    approved: {
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      text: copy.status.approved,
    },
    rejected: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'bg-red-50 text-red-700 ring-red-200',
      text: copy.status.rejected,
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

/**
 * Fetch a membership payment record for a given member ID. Returns null if no
 * record exists. Throws an error if the Supabase query fails.
 */
async function fetchMembershipPaymentByMemberId(
  memberId: string,
): Promise<MembershipPayment | null> {
  const { data, error } = await supabase
    .from('membership_payments')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? null) as MembershipPayment | null
}

/**
 * Generate a signed URL for a receipt path in the private membership-receipts
 * bucket. Returns null if the path is falsy or if the signed URL could not be
 * generated.
 */
async function createSignedReceiptUrl(
  receiptPath: string | null,
): Promise<string | null> {
  if (!receiptPath) return null

  const { data, error } = await supabase.storage
    .from(MEMBERSHIP_RECEIPT_BUCKET)
    .createSignedUrl(receiptPath, 60 * 60) // 1 hour

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

  if (error) throw error

  return data as Member | null
}

function getStatusLabel(
  status: MemberStatus,
  copy?: ReturnType<typeof useAdminMemberDetailCopy>['copy'],
) {
  switch (status) {
    case 'approved':
      return copy?.status.approved ?? 'Approved'
    case 'rejected':
      return copy?.status.rejected ?? 'Rejected'
    default:
      return copy?.status.pending ?? 'Pending'
  }
}

/**
 * Render a membership payment overview for a member. Displays the fee breakdown,
 * manual payment account details, receipt information and controls to update
 * payment status. When no record exists, a helpful message is shown. Errors
 * during fetch or update are surfaced to the admin.
 */
function PaymentSection({
  payment,
  loading,
  error,
  receiptUrl,
  updating,
  onUpdateStatus,
}: {
  payment: MembershipPayment | null
  loading: boolean
  error: string
  receiptUrl: string | null
  updating: boolean
  onUpdateStatus: (status: MembershipPaymentStatus) => void
}) {
  // Format a date/time string using the existing formatDate helper. If
  // undefined/null, returns '-'.
  const formatDateTime = (value: string | null | undefined) =>
    value ? formatDate(value, true) : '-'

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Payment Details</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Membership fee breakdown, receipt and manual payment information.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading payment...</span>
        </div>
      ) : null}

      {/* Error state */}
      {!loading && error ? (
        <AlertBox tone="error" icon={<AlertCircle className="h-5 w-5" />}>
          {error}
        </AlertBox>
      ) : null}

      {/* No payment record */}
      {!loading && !error && !payment ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
          No membership payment record found for this application.
        </div>
      ) : null}

      {/* Payment details */}
      {!loading && payment ? (
        <>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Base Amount
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatMembershipMoney(payment.base_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Tax/Charges
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatMembershipMoney(payment.tax_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total Amount
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatMembershipMoney(payment.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1 font-black text-slate-950">
                {getMembershipPaymentStatusLabel(payment.status)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Payment Method
              </p>
              <p className="mt-1 font-black text-slate-950">
                {payment.payment_method ?? payment.gateway_provider ?? 'Manual'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Gateway/Provider
              </p>
              <p className="mt-1 font-black text-slate-950">
                {payment.gateway_provider ?? payment.payment_method ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Receipt File
              </p>
              <p className="mt-1 font-black text-slate-950">
                {payment.receipt_file_name || '–'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Receipt Uploaded
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatDateTime(payment.receipt_uploaded_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Paid At
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatDateTime(payment.paid_at)}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Admin Note
              </p>
              <p className="mt-1 font-black text-slate-950 whitespace-pre-wrap">
                {payment.admin_note || '–'}
              </p>
            </div>
          </div>

          {/* Manual payment account details */}
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Bank Name
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Account Title
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountTitle}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Account Number
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                IBAN
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.iban}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Payment Network
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.paymentNetwork}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Till ID
              </p>
              <p className="mt-1 font-black text-slate-950">
                {MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId}
              </p>
            </div>
          </div>

          {/* Receipt controls */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-slate-800"
              >
                <FileCheck2 className="h-4 w-4" />
                Open Receipt
              </a>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                Receipt file not available.
              </p>
            )}

            {/* Payment status update buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus('paid')}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Mark Paid
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus('waived')}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                Mark Waived
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus('pending')}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Hourglass className="h-4 w-4" />
                )}
                Mark Pending
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
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