import { supabase } from './supabase/client'

const MAX_CARD_DESIGNATIONS = 2

export type MemberCardDesignation = {
  title: string
  committeeName: string | null
  committeeType: string | null
  committeeLevelLabel: string | null
  committeeLocationLabel: string | null
  tenureStart: string | null
  tenureEnd: string | null
}

type MemberDesignationSource = {
  activeDesignation?: MemberCardDesignation | null
  activeDesignations?: MemberCardDesignation[] | null
}

type CommitteeAssignmentRow = {
  designation_title: string | null
  tenure_start: string | null
  tenure_end: string | null
  sort_order: number | null
  created_at: string | null
  committee:
    | {
        id: string
        committee_type: string | null
        name: string | null
        division: string | null
        district: string | null
        taluka: string | null
        status: string | null
      }
    | Array<{
        id: string
        committee_type: string | null
        name: string | null
        division: string | null
        district: string | null
        taluka: string | null
        status: string | null
      }>
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

export function getMemberDesignationList(
  source: MemberDesignationSource,
  limit = MAX_CARD_DESIGNATIONS,
) {
  const designations = [
    ...(source.activeDesignations ?? []),
    ...(source.activeDesignation ? [source.activeDesignation] : []),
  ]

  const seen = new Set<string>()
  const unique: MemberCardDesignation[] = []

  for (const designation of designations) {
    const title = getMemberDesignationTitle(designation)
    if (!title) continue

    const key = [
      title,
      designation.committeeName,
      designation.committeeLevelLabel,
      designation.committeeLocationLabel,
    ]
      .filter(Boolean)
      .join('|')
      .toLowerCase()

    if (seen.has(key)) continue

    seen.add(key)
    unique.push({
      ...designation,
      title,
    })
  }

  return unique.slice(0, Math.max(1, limit))
}

export function getMemberDesignationSummary(
  source: MemberDesignationSource,
  limit = MAX_CARD_DESIGNATIONS,
) {
  const titles = getMemberDesignationList(source, limit)
    .map((designation) => designation.title)
    .filter(Boolean)

  return titles.join(' / ') || null
}

export async function fetchActiveMemberCardDesignations(
  memberId: string,
  limit = MAX_CARD_DESIGNATIONS,
) {
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
    .limit(20)

  if (error) {
    console.warn('Unable to load member card designations:', error.message)
    return []
  }

  const rows = (data ?? []) as unknown as CommitteeAssignmentRow[]

  const designations = rows.flatMap((row) => {
    const committee = Array.isArray(row.committee)
      ? row.committee[0]
      : row.committee

    const title = row.designation_title?.trim()

    if (!title || committee?.status !== 'active') return []

    return [
      {
        title,
        committeeName: committee.name ?? null,
        committeeType: committee.committee_type ?? null,
        committeeLevelLabel: getCardCommitteeTypeLabel(committee.committee_type),
        committeeLocationLabel: getCardCommitteeLocationLabel(committee),
        tenureStart: row.tenure_start,
        tenureEnd: row.tenure_end,
        sortOrder: row.sort_order ?? 999,
        createdAt: row.created_at ?? '',
      },
    ]
  })

  return designations
    .sort((a, b) => {
      const levelRank = getCardCommitteeTypeRank(a.committeeType) - getCardCommitteeTypeRank(b.committeeType)
      if (levelRank !== 0) return levelRank

      const orderRank = a.sortOrder - b.sortOrder
      if (orderRank !== 0) return orderRank

      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, Math.max(1, limit))
    .map(({ sortOrder: _sortOrder, createdAt: _createdAt, ...designation }) => designation)
}

export async function fetchActiveMemberCardDesignation(memberId: string) {
  const designations = await fetchActiveMemberCardDesignations(memberId, 1)
  return designations[0] ?? null
}

function getCardCommitteeTypeLabel(value: string | null | undefined) {
  switch (value) {
    case 'central':
      return 'Central Executive Committee'
    case 'central_advisory':
      return 'Central Advisory Committee'
    case 'provincial':
      return 'Provincial'
    case 'divisional':
      return 'Divisional'
    case 'district':
      return 'District'
    case 'taluka':
      return 'Taluka'
    default:
      return 'Organization Level'
  }
}

function getCardCommitteeTypeRank(value: string | null | undefined) {
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

function getCardCommitteeLocationLabel(committee: {
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
