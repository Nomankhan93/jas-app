// src/lib/admin/actions.ts
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

const MIN_REJECTION_REASON_LENGTH = 3

type AdminActionInput = {
  memberId: string
  accessToken: string
}

type RejectMemberInput = AdminActionInput & {
  rejectionReason: string
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function requireNonEmptyString(value: string, fieldName: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalized
}

function validateApproveInput(data: AdminActionInput): AdminActionInput {
  return {
    memberId: requireNonEmptyString(data.memberId, 'Member ID'),
    accessToken: requireNonEmptyString(data.accessToken, 'Access token'),
  }
}

function validateRejectInput(data: RejectMemberInput): RejectMemberInput {
  const memberId = requireNonEmptyString(data.memberId, 'Member ID')
  const accessToken = requireNonEmptyString(data.accessToken, 'Access token')
  const rejectionReason = data.rejectionReason.trim()

  if (rejectionReason.length < MIN_REJECTION_REASON_LENGTH) {
    throw new Error(
      `Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters.`,
    )
  }

  return {
    memberId,
    accessToken,
    rejectionReason,
  }
}

async function requireAdmin(accessToken: string) {
  const normalizedAccessToken = requireNonEmptyString(accessToken, 'Access token')
  const supabaseAdmin = createSupabaseAdminClient()

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(normalizedAccessToken)

  if (userError) {
    throw new Error(userError.message)
  }

  if (!userData.user) {
    throw new Error('Invalid session.')
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

export const approveMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(validateApproveInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireAdmin(data.accessToken)

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

      return approved
    } catch (error) {
      throw new Error(toErrorMessage(error, 'Failed to approve member.'))
    }
  })

export const rejectMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(validateRejectInput)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin, user } = await requireAdmin(data.accessToken)

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

      return rejected
    } catch (error) {
      throw new Error(toErrorMessage(error, 'Failed to reject member.'))
    }
  })