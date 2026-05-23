import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

type VerifyMemberInput = {
  memberNo: string
}

export const verifyMemberAction = createServerFn({ method: 'POST' })
  .inputValidator((data: VerifyMemberInput) => {
    if (!data.memberNo || data.memberNo.trim().length < 3) {
      throw new Error('Member number is required.')
    }

    return {
      memberNo: data.memberNo.trim(),
    }
  })
  .handler(async ({ data }) => {
    const supabaseAdmin = createSupabaseAdminClient()

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select(
        'id, member_no, full_name, district, taluka, photo_url, status, approved_at',
      )
      .eq('member_no', data.memberNo)
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

    let photoSignedUrl: string | null = null

    if (member.photo_url) {
      const { data: signed } = await supabaseAdmin.storage
        .from('member-photos')
        .createSignedUrl(member.photo_url, 60 * 10)

      photoSignedUrl = signed?.signedUrl ?? null
    }

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
