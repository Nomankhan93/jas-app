// src/lib/admin/actions.ts
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

const MIN_REJECTION_REASON_LENGTH = 10
const MAX_REJECTION_REASON_LENGTH = 500

type MemberStatus = 'pending' | 'approved' | 'rejected'

type AdminActionInput = {
  memberId: string
  accessToken: string
}

type RejectMemberInput = AdminActionInput & {
  rejectionReason: string
}

type MemberReviewRow = {
  id: string
  full_name: string
  status: MemberStatus
  member_no: string | null
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(data: Record<string, unknown>, fieldName: string) {
  const value = data[fieldName]

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`)
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalized
}

function requireUuid(value: string, fieldName: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} is not valid.`)
  }

  return value
}

function normalizeRejectionReason(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')

  if (normalized.length < MIN_REJECTION_REASON_LENGTH) {
    throw new Error(
      `Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters.`,
    )
  }

  if (normalized.length > MAX_REJECTION_REASON_LENGTH) {
    throw new Error(
      `Rejection reason must be less than ${MAX_REJECTION_REASON_LENGTH} characters.`,
    )
  }

  return normalized
}

function validateApproveInput(data: unknown): AdminActionInput {
  if (!isRecord(data)) {
    throw new Error('Invalid approval request.')
  }

  const memberId = requireUuid(readString(data, 'memberId'), 'Member ID')
  const accessToken = readString(data, 'accessToken')

  return {
    memberId,
    accessToken,
  }
}

function validateRejectInput(data: unknown): RejectMemberInput {
  if (!isRecord(data)) {
    throw new Error('Invalid rejection request.')
  }

  const memberId = requireUuid(readString(data, 'memberId'), 'Member ID')
  const accessToken = readString(data, 'accessToken')
  const rejectionReason = normalizeRejectionReason(
    readString(data, 'rejectionReason'),
  )

  return {
    memberId,
    accessToken,
    rejectionReason,
  }
}

async function requireAdmin(accessToken: string) {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(accessToken)

  if (userError) {
    throw new Error(userError.message)
  }

  if (!userData.user) {
    throw new Error('Invalid or expired session.')
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleError) {
    throw new Error(roleError.message)
  }

  if (!role) {
    throw new Error('Admin access required.')
  }

  return {
    supabaseAdmin,
    user: userData.user,
  }
}

async function getMemberForReview(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  memberId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('id, full_name, status, member_no')
    .eq('id', memberId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Member record not found.')
  }

  return data as MemberReviewRow
}

function requirePendingMember(member: MemberReviewRow, action: 'approve' | 'reject') {
  if (member.status === 'approved') {
    throw new Error(
      `${member.full_name} is already approved. This application cannot be ${action}d again.`,
    )
  }

  if (member.status === 'rejected') {
    throw new Error(
      `${member.full_name} is already rejected. Ask the member to update and resubmit the application first.`,
    )
  }

  if (member.status !== 'pending') {
    throw new Error('Only pending applications can be reviewed.')
  }
}

export const approveMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(validateApproveInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireAdmin(data.accessToken)

      const member = await getMemberForReview(supabaseAdmin, data.memberId)
      requirePendingMember(member, 'approve')

      const { data: approved, error } = await supabaseAdmin.rpc(
        'approve_member',
        {
          _member_id: data.memberId,
          _reviewed_by: user.id,
        },
      )

      if (error) {
        throw new Error(error.message)
      }

      return {
        ok: true,
        action: 'approved' as const,
        memberId: data.memberId,
        reviewedBy: user.id,
        result: approved,
      }
    } catch (error) {
      throw new Error(toErrorMessage(error, 'Failed to approve member.'))
    }
  })

export const rejectMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(validateRejectInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireAdmin(data.accessToken)

      const member = await getMemberForReview(supabaseAdmin, data.memberId)
      requirePendingMember(member, 'reject')

      const { data: rejected, error } = await supabaseAdmin.rpc(
        'reject_member',
        {
          _member_id: data.memberId,
          _rejection_reason: data.rejectionReason,
          _reviewed_by: user.id,
        },
      )

      if (error) {
        throw new Error(error.message)
      }

      return {
        ok: true,
        action: 'rejected' as const,
        memberId: data.memberId,
        reviewedBy: user.id,
        rejectionReason: data.rejectionReason,
        result: rejected,
      }
    } catch (error) {
      throw new Error(toErrorMessage(error, 'Failed to reject member.'))
    }
  })