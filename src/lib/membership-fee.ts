// src/lib/membership-fee.ts

export const MEMBERSHIP_BASE_FEE = 600
export const MEMBERSHIP_FEE_CURRENCY = 'PKR'
export const MEMBERSHIP_PROCESSING_LABEL = 'applicable tax/processing charges'
export const MEMBERSHIP_PAYMENT_COMING_SOON_TEXT =
  'Payment gateway coming soon / manual verification pending.'

export type MembershipPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'waived'

export type MembershipPaymentMethod =
  | 'manual'
  | 'jazzcash'
  | 'easypaisa'
  | 'bank'
  | 'gateway'

export type MembershipPayment = {
  id: string
  member_id: string
  user_id: string
  base_amount: number
  tax_amount: number
  total_amount: number
  currency: string
  status: MembershipPaymentStatus
  payment_method: MembershipPaymentMethod
  gateway_provider: string | null
  gateway_reference: string | null
  admin_note: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export function formatMembershipMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0)

  return `Rs. ${amount.toLocaleString('en-PK', {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: 0,
  })}`
}

export function getMembershipFeeNotice() {
  return `Membership Application Fee: ${formatMembershipMoney(
    MEMBERSHIP_BASE_FEE,
  )} + ${MEMBERSHIP_PROCESSING_LABEL}.`
}

export function getMembershipFeeSubtext() {
  return 'Final payable amount will be shown before payment.'
}

export function getMembershipPaymentStatusLabel(
  status: MembershipPaymentStatus | null | undefined,
) {
  switch (status) {
    case 'paid':
      return 'Paid'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    case 'waived':
      return 'Waived'
    default:
      return 'Pending'
  }
}

export function getMembershipPaymentStatusClass(
  status: MembershipPaymentStatus | null | undefined,
) {
  switch (status) {
    case 'paid':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'waived':
      return 'border-sky-200 bg-sky-50 text-sky-800'
    case 'failed':
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'refunded':
      return 'border-purple-200 bg-purple-50 text-purple-800'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-800'
  }
}

export function getMembershipPaymentDisplayStatus(
  payment: Pick<MembershipPayment, 'status'> | null | undefined,
) {
  return payment?.status ?? 'pending'
}

export function createPendingMembershipPaymentPayload(
  memberId: string,
  userId: string,
) {
  return {
    member_id: memberId,
    user_id: userId,
    base_amount: MEMBERSHIP_BASE_FEE,
    tax_amount: 0,
    total_amount: MEMBERSHIP_BASE_FEE,
    currency: MEMBERSHIP_FEE_CURRENCY,
    status: 'pending' as const,
    payment_method: 'manual' as const,
  }
}
