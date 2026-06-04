import { supabase } from './supabase/client'

export const appointmentLevelOptions = [
  { value: 'central', label: 'Central' },
  { value: 'divisional', label: 'Divisional' },
  { value: 'district', label: 'District' },
  { value: 'taluka', label: 'Taluka' },
] as const

export const appointmentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'removed', label: 'Removed' },
  { value: 'completed', label: 'Completed' },
] as const

export type AppointmentLevel = (typeof appointmentLevelOptions)[number]['value']
export type AppointmentStatus = (typeof appointmentStatusOptions)[number]['value']

export type ProgramAppointmentRecord = {
  id: string
  program_key: string
  role_title: string
  member_id: string
  level: AppointmentLevel
  division: string | null
  district: string | null
  taluka: string | null
  appointment_method: string
  status: AppointmentStatus
  nominated_by: string | null
  approved_by: string | null
  approved_at: string | null
  tenure_start: string | null
  tenure_end: string | null
  notes: string | null
  created_at: string
  member?: {
    full_name: string
    member_no: string | null
  }
}

export type PerformanceReviewRecord = {
  id: string
  appointment_id: string
  review_period_start: string | null
  review_period_end: string | null
  rating: number
  work_progress: string | null
  transparency_notes: string | null
  discipline_notes: string | null
  recommendation: 'continue' | 'warning' | 'replace' | 'remove'
  reviewed_by: string | null
  created_at: string
}

export async function fetchAppointments() {
  const { data, error } = await supabase
    .from('program_appointments')
    .select('*, member:members(full_name, member_no)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProgramAppointmentRecord[]
}

export async function createAppointment(input: Partial<ProgramAppointmentRecord>) {
  const { data, error } = await supabase
    .from('program_appointments')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ProgramAppointmentRecord
}

export async function updateAppointment(id: string, input: Partial<ProgramAppointmentRecord>) {
  const { error } = await supabase
    .from('program_appointments')
    .update(input)
    .eq('id', id)

  if (error) throw error
}

export async function fetchPerformanceReviews(appointmentId: string) {
  const { data, error } = await supabase
    .from('program_role_reviews')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PerformanceReviewRecord[]
}

export async function createPerformanceReview(input: Partial<PerformanceReviewRecord>) {
  const { data, error } = await supabase
    .from('program_role_reviews')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as PerformanceReviewRecord
}
