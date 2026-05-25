// src/lib/verify/actions.ts
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

const MEMBER_PHOTO_BUCKET = 'member-photos'
const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 10
const MIN_MEMBER_NUMBER_LENGTH = 3
const MAX_MEMBER_NUMBER_LENGTH = 80

type MemberStatus = 'pending' | 'approved' | 'rejected'

type VerifyMemberInput = {
  memberNo: string
}

type VerifyMemberResult = {
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

type MemberVerificationRow = {
  id: string
  member_no: string | null
  full_name: string
  district: string
  taluka: string | null
  photo_url: string | null
  status: MemberStatus
  approved_at: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeMemberNo(memberNo: string) {
  const normalized = memberNo.trim()

  if (normalized.length < MIN_MEMBER_NUMBER_LENGTH) {
    throw new Error(
      `Member number must be at least ${MIN_MEMBER_NUMBER_LENGTH} characters.`,
    )
  }

  if (normalized.length > MAX_MEMBER_NUMBER_LENGTH) {
    throw new Error(
      `Member number must be less than ${MAX_MEMBER_NUMBER_LENGTH} characters.`,
    )
  }

  return normalized
}

function validateVerifyInput(data: unknown): VerifyMemberInput {
  if (!isRecord(data)) {
    throw new Error('Invalid verification request.')
  }

  const memberNo = data.memberNo

  if (typeof memberNo !== 'string') {
    throw new Error('Member number is required.')
  }

  return {
    memberNo: normalizeMemberNo(memberNo),
  }
}

async function createMemberPhotoSignedUrl(
  photoPath: string | null,
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
) {
  if (!photoPath) return null

  const { data, error } = await supabaseAdmin.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoPath, PHOTO_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}

function buildPublicMemberPayload(member: MemberVerificationRow) {
  const verified = member.status === 'approved' && Boolean(member.member_no)

  if (!verified) {
    return {
      found: true,
      verified: false,
      member: {
        id: member.id,
        member_no: member.member_no,
        full_name: 'Not disclosed',
        district: 'Not disclosed',
        taluka: null,
        status: member.status,
        approved_at: null,
      },
      photoSignedUrl: null,
    } satisfies VerifyMemberResult
  }

  return {
    found: true,
    verified: true,
    member: {
      id: member.id,
      member_no: member.member_no,
      full_name: member.full_name,
      district: member.district,
      taluka: member.taluka ?? null,
      status: member.status,
      approved_at: member.approved_at,
    },
    photoSignedUrl: null,
  } satisfies VerifyMemberResult
}

export const verifyMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(validateVerifyInput)
  .handler(async ({ data }): Promise<VerifyMemberResult> => {
    const supabaseAdmin = createSupabaseAdminClient()

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select(
        [
          'id',
          'member_no',
          'full_name',
          'district',
          'taluka',
          'photo_url',
          'status',
          'approved_at',
        ].join(', '),
      )
      .eq('member_no', data.memberNo)
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!member) {
      return {
        found: false,
        verified: false,
        member: null,
        photoSignedUrl: null,
      }
    }

    const safeMember = member as unknown as MemberVerificationRow
    const result = buildPublicMemberPayload(safeMember)

    if (!result.verified) {
      return result
    }

    const photoSignedUrl = await createMemberPhotoSignedUrl(
      safeMember.photo_url,
      supabaseAdmin,
    )

    return {
      ...result,
      photoSignedUrl,
    }
  })