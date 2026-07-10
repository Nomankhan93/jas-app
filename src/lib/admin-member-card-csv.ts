import type { MemberCardDesignation } from './member-card-designation'
import { csvCell, formatDisplayDate } from './shared/formatters'

export type MemberCardCsvSource = {
  id: string
  member_no: string | null
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
  created_at: string
}

type BuildMemberCardCsvOptions = {
  members: MemberCardCsvSource[]
  designationsByMemberId: Record<string, MemberCardDesignation | null>
  publicVerifyOrigin: string
}

const ORGANIZATION_NAME = 'Jatt Alliance Sindh'
const ORGANIZATION_LOCATION = 'Sindh, Pakistan'
const CARD_VERSION = 'v1'

export const MEMBER_CARD_CSV_HEADERS = [
  'Member No',
  'Full Name',
  'Father Name',
  'CNIC',
  'Mobile',
  'District',
  'Taluka',
  'Profession',
  'Caste / Branch',
  'JAS Designation',
  'Designation Level',
  'Designation Area / Jurisdiction',
  'Committee Name',
  'Designation Valid From',
  'Designation Valid Until',
  'Designation Validity',
  'Approved Date',
  'Status',
  'Residential Address',
  'Date of Birth',
  'Gender',
  'Education',
  'Blood Group',
  'Emergency Contact Name',
  'Emergency Contact Relation',
  'Emergency Contact Mobile',
  'Issue No / Version',
  'Verification URL',
  'Photo Storage Path',
  'Declaration Accepted',
  'Submitted',
  'Organization',
  'Organization Location',
] as const

export function buildFullMemberCardCsv({
  members,
  designationsByMemberId,
  publicVerifyOrigin,
}: BuildMemberCardCsvOptions) {
  const verifyOrigin = publicVerifyOrigin.replace(/\/+$/, '')
  const rows: Array<Array<string | number | null | undefined>> = [
    [...MEMBER_CARD_CSV_HEADERS],
    ...members.map((member) => {
      const designation = designationsByMemberId[member.id] ?? null
      const verificationUrl = member.member_no
        ? `${verifyOrigin}/verify/${encodeURIComponent(member.member_no)}`
        : ''

      return [
        member.member_no ?? '',
        member.full_name,
        member.father_name,
        member.cnic,
        member.mobile,
        member.district,
        member.taluka ?? '',
        member.profession ?? '',
        member.caste_branch ?? '',
        designation?.title ?? '',
        designation?.committeeLevelLabel ?? '',
        designation?.committeeLocationLabel ?? '',
        designation?.committeeName ?? '',
        formatOptionalDate(designation?.validityStart),
        formatOptionalDate(designation?.expiresOn),
        designation?.validityLabel ?? '',
        formatOptionalDate(member.approved_at),
        formatStatus(member.status),
        member.address ?? '',
        formatOptionalDate(member.date_of_birth),
        member.gender ?? '',
        member.education ?? '',
        member.blood_group ?? '',
        member.emergency_contact_name ?? '',
        member.emergency_contact_relation ?? '',
        member.emergency_contact_mobile ?? '',
        member.member_no
          ? `${member.member_no} / ${CARD_VERSION}`
          : `Pending / ${CARD_VERSION}`,
        verificationUrl,
        member.photo_url ?? '',
        member.declaration_accepted ? 'Yes' : 'No',
        formatOptionalDate(member.created_at),
        ORGANIZATION_NAME,
        ORGANIZATION_LOCATION,
      ]
    }),
  ]

  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

function formatOptionalDate(value: string | null | undefined) {
  if (!value) return ''

  const formatted = formatDisplayDate(value)
  return formatted === 'N/A' ? '' : formatted
}

function formatStatus(status: MemberCardCsvSource['status']) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}
