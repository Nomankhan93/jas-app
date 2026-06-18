import { supabase } from './supabase/client'
import {
  getCommitteeLocationLabel,
  getCommitteeTypeLabel,
  type CommitteeRecord,
  type CommitteeType,
} from './committees'
import {
  formatDesignationExpiry,
  formatDesignationValidity,
  getDesignationExpiryDate,
  getDesignationValidityStart,
  isDesignationCurrentlyValid,
} from './designation-validity'

export type MemberCardDesignation = {
  title: string
  committeeName: string | null
  committeeType: CommitteeType | null
  committeeLevelLabel: string | null
  committeeLocationLabel: string | null
  tenureStart: string | null
  tenureEnd: string | null
  validityStart: string | null
  expiresOn: string | null
  validityLabel: string
  expiryLabel: string
}

type CommitteeAssignmentRow = {
  designation_title: string
  tenure_start: string | null
  tenure_end: string | null
  sort_order: number | null
  created_at: string | null
  committee:
    | Pick<
        CommitteeRecord,
        'id' | 'committee_type' | 'name' | 'division' | 'district' | 'taluka' | 'status'
      >
    | Pick<
        CommitteeRecord,
        'id' | 'committee_type' | 'name' | 'division' | 'district' | 'taluka' | 'status'
      >[]
    | null
}

export function getMemberDesignationTitle(
  designation: MemberCardDesignation | null | undefined,
) {
  return designation?.title?.trim() || null
}

export function getMemberDesignationLevel(
  designation: MemberCardDesignation | null | undefined,
) {
  if (!designation) return null

  return [designation.committeeLevelLabel, designation.committeeLocationLabel]
    .filter(Boolean)
    .join(' · ') || null
}

export async function fetchActiveMemberCardDesignation(memberId: string) {
  const { data, error } = await supabase
    .from('organization_committee_members' as never)
    .select(
      [
        'designation_title',
        'tenure_start',
        'tenure_end',
        'sort_order',
        'created_at',
        'committee:organization_committees(id, committee_type, name, division, district, taluka, status)',
      ].join(', '),
    )
    .eq('member_id' as never, memberId as never)
    .eq('status' as never, 'active' as never)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.warn('Unable to load member card designation:', error.message)
    return null
  }

  const rows = (data ?? []) as unknown as CommitteeAssignmentRow[]

  const activeRow = rows.find((row) => {
    const committee = Array.isArray(row.committee)
      ? row.committee[0]
      : row.committee

    return (
      Boolean(row.designation_title?.trim()) &&
      committee?.status === 'active' &&
      isDesignationCurrentlyValid({
        tenure_start: row.tenure_start,
        tenure_end: row.tenure_end,
        created_at: row.created_at,
      })
    )
  })

  if (!activeRow) return null

  const committee = Array.isArray(activeRow.committee)
    ? activeRow.committee[0]
    : activeRow.committee

  if (!committee) return null

  const validitySource = {
    tenure_start: activeRow.tenure_start,
    tenure_end: activeRow.tenure_end,
    created_at: activeRow.created_at,
  }

  return {
    title: activeRow.designation_title.trim(),
    committeeName: committee.name ?? null,
    committeeType: committee.committee_type,
    committeeLevelLabel: getCommitteeTypeLabel(committee.committee_type),
    committeeLocationLabel: getCommitteeLocationLabel(committee),
    tenureStart: activeRow.tenure_start,
    tenureEnd: activeRow.tenure_end,
    validityStart: getDesignationValidityStart(validitySource),
    expiresOn: getDesignationExpiryDate(validitySource),
    validityLabel: formatDesignationValidity(validitySource),
    expiryLabel: formatDesignationExpiry(validitySource),
  } satisfies MemberCardDesignation
}
