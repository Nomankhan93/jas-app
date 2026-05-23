// src/lib/verify/actions.ts
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

const MEMBER_PHOTO_BUCKET = 'member-photos'
const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 10
const MIN_MEMBER_NUMBER_LENGTH = 3

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
    status: 'pending' | 'approved' | 'rejected'
    approved_at: string | null
  } | null
  photoSignedUrl: string | null
}

function normalizeMemberNo(memberNo: string) {
  const normalized = memberNo.trim()

  if (normalized.length < MIN_MEMBER_NUMBER_LENGTH) {
    throw new Error(
      `Member number must be at least ${MIN_MEMBER_NUMBER_LENGTH} characters.`,
    )
  }

  return normalized
}

async function createMemberPhotoSignedUrl(
  photoPath: string | null,
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
) {
  if (!photoPath) {
    return null
  }

  const { data, error } = await supabaseAdmin.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoPath, PHOTO_SIGNED_URL_TTL_SECONDS)

  if (error) {
    throw new Error(error.message)
  }

  return data?.signedUrl ?? null
}

export const verifyMemberAction = createServerFn({ method: 'POST' })
  .inputValidator((data: VerifyMemberInput) => ({
    memberNo: normalizeMemberNo(data.memberNo),
  }))
  .handler(async ({ data }): Promise<VerifyMemberResult> => {
    const supabaseAdmin = createSupabaseAdminClient()

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select(
        'id, member_no, full_name, district, taluka, photo_url, status, approved_at',
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

    const photoSignedUrl = await createMemberPhotoSignedUrl(
      member.photo_url,
      supabaseAdmin,
    )

    return {
      found: true,
      verified: member.status === 'approved',
      member: {
        id: member.id,
        member_no: member.member_no,
        full_name: member.full_name,
        district: member.district,
        taluka: member.taluka ?? null,
        status: member.status,
        approved_at: member.approved_at,
      },
      photoSignedUrl,
    }
  })