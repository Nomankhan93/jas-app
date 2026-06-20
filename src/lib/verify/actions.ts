// src/lib/verify/actions.ts
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseAdminClient } from '../supabase/admin'

const MEMBER_PHOTO_BUCKET = 'member-photos'
const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 10
const MIN_MEMBER_NUMBER_LENGTH = 3
const MAX_MEMBER_NUMBER_LENGTH = 80
const MAX_PUBLIC_DESIGNATIONS = 6

type MemberStatus = 'pending' | 'approved' | 'rejected'

type VerifyMemberInput = {
  memberNo: string
}

type VerifyMemberDesignation = {
  title: string
  committeeName: string | null
  level: string | null
  location: string | null
  validFrom: string | null
  expiresOn: string | null
  validity: string
  expiryDate: string | null
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
  activeDesignation: VerifyMemberDesignation | null
  activeDesignations: VerifyMemberDesignation[]
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

type ActiveDesignationRow = {
  designation_title: string | null
  tenure_start: string | null
  tenure_end: string | null
  sort_order: number | null
  created_at: string | null
  committee:
    | {
        committee_type: string | null
        name: string | null
        division: string | null
        district: string | null
        taluka: string | null
        tenure_start?: string | null
        tenure_end?: string | null
        status: string | null
      }
    | Array<{
        committee_type: string | null
        name: string | null
        division: string | null
        district: string | null
        taluka: string | null
        tenure_start?: string | null
        tenure_end?: string | null
        status: string | null
      }>
    | null
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
      activeDesignation: null,
      activeDesignations: [],
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
    activeDesignation: null,
    activeDesignations: [],
  } satisfies VerifyMemberResult
}

function getCommitteeLocationLabel(committee: {
  committee_type: string | null
  division: string | null
  district: string | null
  taluka: string | null
}) {
  if (committee.committee_type === 'central') return 'Sindh / Central Executive Committee'
  if (committee.committee_type === 'central_advisory') return 'Sindh / Central Advisory Committee'
  if (committee.committee_type === 'provincial') return 'Sindh / Provincial'
  if (committee.committee_type === 'divisional') return committee.division || 'Division not set'
  if (committee.committee_type === 'district') return committee.district || 'District not set'

  return [committee.taluka, committee.district].filter(Boolean).join(', ') || 'Taluka not set'
}

function getCommitteeLevelLabel(value: string | null) {
  switch (value) {
    case 'central':
      return 'Central Executive Committee'
    case 'central_advisory':
      return 'Central Advisory Committee'
    case 'provincial':
      return 'Provincial Committee'
    case 'divisional':
      return 'Divisional Committee'
    case 'district':
      return 'District Committee'
    case 'taluka':
      return 'Taluka Committee'
    default:
      return 'Committee'
  }
}

function getCommitteeLevelRank(value: string | null | undefined) {
  switch (value) {
    case 'central':
      return 1
    case 'central_advisory':
      return 2
    case 'provincial':
      return 3
    case 'divisional':
      return 4
    case 'district':
      return 5
    case 'taluka':
      return 6
    default:
      return 99
  }
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildValidityLabel(expiresOn: string | null) {
  const formatted = formatDisplayDate(expiresOn)
  return formatted ? `Valid until ${formatted}` : 'Active'
}

async function fetchActiveMemberDesignations(
  memberId: string,
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data, error } = await supabaseAdmin
    .from('organization_committee_members')
    .select(
      [
        'designation_title',
        'tenure_start',
        'tenure_end',
        'sort_order',
        'created_at',
        'committee:organization_committees(id, committee_type, name, division, district, taluka, tenure_start, tenure_end, status)',
      ].join(', '),
    )
    .eq('member_id', memberId)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []

  const rows = (data ?? []) as unknown as ActiveDesignationRow[]

  const designations = rows.flatMap((item) => {
    const committee = Array.isArray(item.committee) ? item.committee[0] : item.committee
    const title = item.designation_title?.trim()

    if (!title || committee?.status !== 'active') return []

    const validFrom = item.tenure_start ?? committee.tenure_start ?? null
    const expiresOn = item.tenure_end ?? committee.tenure_end ?? null

    return [
      {
        title,
        committeeName: committee.name,
        level: getCommitteeLevelLabel(committee.committee_type),
        location: getCommitteeLocationLabel(committee),
        validFrom,
        expiresOn,
        validity: buildValidityLabel(expiresOn),
        expiryDate: expiresOn,
        committeeType: committee.committee_type,
        sortOrder: item.sort_order ?? 999,
        createdAt: item.created_at ?? '',
      },
    ]
  })

  return designations
    .sort((a, b) => {
      const levelRank = getCommitteeLevelRank(a.committeeType) - getCommitteeLevelRank(b.committeeType)
      if (levelRank !== 0) return levelRank

      const orderRank = a.sortOrder - b.sortOrder
      if (orderRank !== 0) return orderRank

      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, MAX_PUBLIC_DESIGNATIONS)
    .map(({ committeeType: _committeeType, sortOrder: _sortOrder, createdAt: _createdAt, ...designation }) => designation)
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
        activeDesignation: null,
        activeDesignations: [],
      }
    }

    const safeMember = member as unknown as MemberVerificationRow
    const result = buildPublicMemberPayload(safeMember)

    if (!result.verified) {
      return result
    }

    const [photoSignedUrl, activeDesignations] = await Promise.all([
      createMemberPhotoSignedUrl(safeMember.photo_url, supabaseAdmin),
      fetchActiveMemberDesignations(safeMember.id, supabaseAdmin),
    ])

    return {
      ...result,
      photoSignedUrl,
      activeDesignation: activeDesignations[0] ?? null,
      activeDesignations,
    }
  })
