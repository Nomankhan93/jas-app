import { describe, expect, it } from 'vitest'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_FEE_CURRENCY,
  createPendingMembershipPaymentPayload,
  formatMembershipMoney,
  getMembershipFeeNotice,
  getMembershipPaymentDisplayStatus,
  getMembershipPaymentStatusClass,
  getMembershipPaymentStatusLabel,
} from './membership-fee'

describe('membership fee helpers', () => {
  it('keeps the configured base fee and currency consistent', () => {
    expect(MEMBERSHIP_BASE_FEE).toBe(600)
    expect(MEMBERSHIP_FEE_CURRENCY).toBe('PKR')
    expect(formatMembershipMoney(MEMBERSHIP_BASE_FEE)).toContain('600')
    expect(getMembershipFeeNotice()).toContain('600')
  })

  it.each([
    ['paid', 'Paid'],
    ['failed', 'Failed'],
    ['cancelled', 'Cancelled'],
    ['refunded', 'Refunded'],
    ['waived', 'Waived'],
    [null, 'Pending'],
  ] as const)('labels payment status %s', (status, expected) => {
    expect(getMembershipPaymentStatusLabel(status)).toBe(expected)
  })

  it('maps payment status classes', () => {
    expect(getMembershipPaymentStatusClass('paid')).toContain('emerald')
    expect(getMembershipPaymentStatusClass('waived')).toContain('sky')
    expect(getMembershipPaymentStatusClass('failed')).toContain('red')
    expect(getMembershipPaymentStatusClass('refunded')).toContain('purple')
    expect(getMembershipPaymentStatusClass('pending')).toContain('amber')
  })

  it('defaults missing payments to pending', () => {
    expect(getMembershipPaymentDisplayStatus(null)).toBe('pending')
    expect(getMembershipPaymentDisplayStatus({ status: 'paid' })).toBe('paid')
  })

  it('creates a deterministic pending payment payload', () => {
    expect(createPendingMembershipPaymentPayload('member-1', 'user-1')).toMatchObject({
      member_id: 'member-1',
      user_id: 'user-1',
      base_amount: 600,
      total_amount: 600,
      currency: 'PKR',
      status: 'pending',
      receipt_path: null,
    })
  })
})
