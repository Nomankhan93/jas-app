import { supabase } from './supabase/client'
import {
  getInitials,
  type PublicCommitteeMemberRecord,
  type PublicCommitteeRecord,
} from './committees-public'
import {
  formatDesignationExpiry,
  formatDesignationValidity,
  isDesignationCurrentlyValid,
} from './designation-validity'

export const designationHolderLevelOrder = [
  'central',
  'provincial',
  'divisional',
  'district',
  'taluka',
] as const

export type DesignationHolderLevel = (typeof designationHolderLevelOrder)[number]

export type PublicDesignationHolderRecord = {
  assignment_id: string
  member_id: string
  member_no: string | null
  full_name: string
  father_name: string | null
  photo_url: string | null
  photo_signed_url?: string | null
  level: DesignationHolderLevel
  level_label: string
  designation_title: string
  committee_id: string
  committee_name: string
  division: string | null
  district: string | null
  taluka: string | null
  tenure_start: string | null
  tenure_end: string | null
  sort_order: number
  assigned_at: string
}

const publicCommitteeSelect = [
  'id',
  'committee_type',
  'name',
  'division',
  'district',
  'taluka',
  'tenure_start',
  'tenure_end',
  'status',
  'public_display',
  'notes',
  'created_at',
  'updated_at',
].join(', ')

const publicCommitteeMemberSelect = [
  'id',
  'committee_id',
  'member_id',
  'designation_title',
  'status',
  'sort_order',
  'tenure_start',
  'tenure_end',
  'member_no_snapshot',
  'full_name_snapshot',
  'father_name_snapshot',
  'district_snapshot',
  'taluka_snapshot',
  'created_at',
  'updated_at',
].join(', ')

export function getDesignationHolderLevelLabel(level: string | null | undefined) {
  switch (level) {
    case 'central':
      return 'CEC'
    case 'provincial':
      return 'Provincial'
    case 'divisional':
      return 'Divisional'
    case 'district':
      return 'District'
    case 'taluka':
      return 'Taluka'
    default:
      return 'Level'
  }
}

export function getDesignationHolderLevelRank(level: string | null | undefined) {
  const index = designationHolderLevelOrder.indexOf(level as DesignationHolderLevel)
  return index >= 0 ? index + 1 : designationHolderLevelOrder.length + 1
}

export function getDesignationHolderLocation(holder: Pick<PublicDesignationHolderRecord, 'level' | 'division' | 'district' | 'taluka'>) {
  if (holder.level === 'central') return 'Sindh / Central Executive Committee'
  if (holder.level === 'provincial') return 'Sindh / Provincial'
  if (holder.level === 'divisional') return holder.division || 'Division not set'
  if (holder.level === 'district') return holder.district || 'District not set'
  return [holder.taluka, holder.district].filter(Boolean).join(', ') || 'Taluka not set'
}

export function getDesignationHolderSearchText(holder: PublicDesignationHolderRecord) {
  return [
    holder.full_name,
    holder.father_name,
    holder.designation_title,
    holder.level_label,
    holder.committee_name,
    holder.member_no,
    holder.division,
    holder.district,
    holder.taluka,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function sortDesignationHolders(holders: PublicDesignationHolderRecord[]) {
  return [...holders].sort((a, b) => {
    const levelRank = getDesignationHolderLevelRank(a.level) - getDesignationHolderLevelRank(b.level)
    if (levelRank !== 0) return levelRank

    const areaRank = getDesignationHolderLocation(a).localeCompare(getDesignationHolderLocation(b))
    if (areaRank !== 0) return areaRank

    const sortOrderRank = (a.sort_order ?? 999) - (b.sort_order ?? 999)
    if (sortOrderRank !== 0) return sortOrderRank

    return a.full_name.localeCompare(b.full_name)
  })
}

export function formatDesignationHolderTenure(holder: Pick<PublicDesignationHolderRecord, 'tenure_start' | 'tenure_end' | 'assigned_at'>) {
  return formatDesignationValidity(holder)
}

export function formatDesignationHolderExpiry(holder: Pick<PublicDesignationHolderRecord, 'tenure_start' | 'tenure_end' | 'assigned_at'>) {
  return formatDesignationExpiry(holder)
}

export function getDesignationHolderInitials(name: string | null | undefined) {
  return getInitials(name)
}

export async function fetchPublicDesignationHolders() {
  const rpcResult = await supabase.rpc('get_public_designation_holders' as never)

  if (!rpcResult.error) {
    const rows = ((rpcResult.data ?? []) as unknown as PublicDesignationHolderRecord[]).filter((holder) =>
      isDesignationCurrentlyValid(holder),
    )
    return attachSignedPhotoUrls(sortDesignationHolders(rows))
  }

  if (!isMissingRpcError(rpcResult.error)) {
    throw rpcResult.error
  }

  // Fallback keeps the page usable on local databases before the migration is applied.
  // It uses public committee snapshots, so photos will show after running the migration RPC.
  return fetchPublicDesignationHoldersFromSnapshots()
}

async function fetchPublicDesignationHoldersFromSnapshots() {
  const { data: committeesData, error: committeesError } = await supabase
    .from('organization_committees' as never)
    .select(publicCommitteeSelect)
    .eq('public_display' as never, true as never)
    .eq('status' as never, 'active' as never)
    .order('committee_type' as never, { ascending: true })
    .order('name' as never, { ascending: true })

  if (committeesError) throw committeesError

  const committees = (committeesData ?? []) as unknown as PublicCommitteeRecord[]
  if (!committees.length) return []

  const committeeMap = new Map(committees.map((committee) => [committee.id, committee]))

  const { data: membersData, error: membersError } = await supabase
    .from('organization_committee_members' as never)
    .select(publicCommitteeMemberSelect)
    .in('committee_id' as never, committees.map((committee) => committee.id) as never)
    .eq('status' as never, 'active' as never)
    .order('sort_order' as never, { ascending: true })
    .order('created_at' as never, { ascending: true })
    .limit(1000)

  if (membersError) throw membersError

  const rows = ((membersData ?? []) as unknown as PublicCommitteeMemberRecord[]).flatMap((member) => {
    const committee = committeeMap.get(member.committee_id)
    if (!committee) return []

    const level = normalizeDesignationHolderLevel(committee.committee_type)

    return [
      {
        assignment_id: member.id,
        member_id: member.member_id,
        member_no: member.member_no_snapshot,
        full_name: member.full_name_snapshot,
        father_name: member.father_name_snapshot,
        photo_url: null,
        photo_signed_url: null,
        level,
        level_label: getDesignationHolderLevelLabel(level),
        designation_title: member.designation_title,
        committee_id: committee.id,
        committee_name: committee.name,
        division: committee.division,
        district: committee.district ?? member.district_snapshot,
        taluka: committee.taluka ?? member.taluka_snapshot,
        tenure_start: member.tenure_start || committee.tenure_start,
        tenure_end: member.tenure_end || committee.tenure_end,
        sort_order: member.sort_order,
        assigned_at: member.created_at,
      } satisfies PublicDesignationHolderRecord,
    ]
  })

  return sortDesignationHolders(rows.filter((holder) => isDesignationCurrentlyValid(holder)))
}

function normalizeDesignationHolderLevel(level: string | null | undefined): DesignationHolderLevel {
  if (designationHolderLevelOrder.includes(level as DesignationHolderLevel)) {
    return level as DesignationHolderLevel
  }

  return 'district'
}

async function attachSignedPhotoUrls(holders: PublicDesignationHolderRecord[]) {
  const withPhotos = await Promise.all(
    holders.map(async (holder) => ({
      ...holder,
      photo_signed_url: await createPhotoSignedUrl(holder.photo_url),
    })),
  )

  return withPhotos
}

async function createPhotoSignedUrl(path: string | null | undefined) {
  if (!path) return null

  const { data, error } = await supabase.storage
    .from('member-photos')
    .createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

function isMissingRpcError(error: unknown) {
  const message = String(
    (error as { message?: string; details?: string; code?: string } | null)?.message ||
      (error as { message?: string; details?: string; code?: string } | null)?.details ||
      '',
  ).toLowerCase()

  const code = String((error as { code?: string } | null)?.code || '')

  return code === 'PGRST202' || message.includes('get_public_designation_holders') || message.includes('could not find the function')
}
