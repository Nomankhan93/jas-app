import { supabase } from './supabase/client'

export const electionLevelOptions = [
  { value: 'central', label: 'Central' },
  { value: 'divisional', label: 'Divisional' },
  { value: 'district', label: 'District' },
  { value: 'taluka', label: 'Taluka' },
] as const

export const electionStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'nominations_open', label: 'Nominations Open' },
  { value: 'scrutiny', label: 'Scrutiny' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'voter_list_frozen', label: 'Voter List Frozen' },
  { value: 'voting_open', label: 'Voting Open' },
  { value: 'voting_closed', label: 'Voting Closed' },
  { value: 'results_published', label: 'Results Published' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export type ElectionLevel = (typeof electionLevelOptions)[number]['value']
export type ElectionStatus = (typeof electionStatusOptions)[number]['value']

export type ElectionRecord = {
  id: string
  title: string
  level: ElectionLevel
  division: string | null
  district: string | null
  taluka: string | null
  term_start: string
  term_end: string
  nomination_start: string | null
  nomination_end: string | null
  voting_start: string | null
  voting_end: string | null
  status: ElectionStatus
  result_published_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export type ElectionPositionRecord = {
  id: string
  election_id: string
  title: string
  seats: number
  sort_order: number
  created_at: string
}

export type ElectionCandidateRecord = {
  id: string
  election_id: string
  position_id: string
  member_id: string
  manifesto: string | null
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  rejection_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  member?: {
    full_name: string
    member_no: string | null
    photo_url: string
  }
}

export type ElectionResult = {
  position_id: string
  position_title: string
  candidate_id: string
  candidate_name: string
  member_no: string | null
  vote_count: number
  is_winner: boolean
}

export async function fetchElections() {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ElectionRecord[]
}

export async function fetchElectionDetails(id: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as ElectionRecord | null
}

export async function createElection(input: Partial<ElectionRecord>) {
  const { data, error } = await supabase
    .from('elections')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ElectionRecord
}

export async function updateElection(id: string, input: Partial<ElectionRecord>) {
  const { error } = await supabase
    .from('elections')
    .update(input)
    .eq('id', id)

  if (error) throw error
}

export async function fetchElectionPositions(electionId: string) {
  const { data, error } = await supabase
    .from('election_positions')
    .select('*')
    .eq('election_id', electionId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as ElectionPositionRecord[]
}

export async function fetchElectionCandidates(electionId: string) {
  const { data, error } = await supabase
    .from('election_candidates')
    .select('*, member:members(full_name, member_no, photo_url)')
    .eq('election_id', electionId)

  if (error) throw error
  return data as ElectionCandidateRecord[]
}

export async function castVote(electionId: string, positionId: string, candidateId: string) {
  const { data, error } = await supabase.rpc('cast_vote', {
    _election_id: electionId,
    _position_id: positionId,
    _candidate_id: candidateId,
  })

  if (error) throw error
  return data
}

export async function fetchElectionResults(electionId: string) {
  const { data, error } = await supabase.rpc('get_election_results', {
    _election_id: electionId,
  })

  if (error) throw error
  return data as ElectionResult[]
}

export async function generateVoterList(electionId: string) {
  const { data, error } = await supabase.rpc('generate_election_voters', {
    _election_id: electionId,
  })

  if (error) throw error
  return data
}
