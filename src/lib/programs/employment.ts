import type { Json } from '../supabase/database.types'

export const EMPLOYMENT_DOCUMENT_BUCKET = 'employment-documents'
export const EMPLOYMENT_MAX_DOCUMENT_SIZE_MB = 5
export const EMPLOYMENT_MAX_DOCUMENT_SIZE_BYTES =
  EMPLOYMENT_MAX_DOCUMENT_SIZE_MB * 1024 * 1024
export const EMPLOYMENT_DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp'

export type EmploymentStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'approved'
  | 'rejected'
  | 'paid_completed'
  | 'completed'

export type EmploymentDocumentType =
  | 'cv_resume'
  | 'cnic_copy'
  | 'education_certificate'
  | 'experience_certificate'
  | 'skills_certificate'
  | 'other_document'

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'remote'
  | 'any'

export type EmploymentCurrentStatus =
  | 'unemployed'
  | 'employed'
  | 'self_employed'
  | 'student'
  | 'fresh_graduate'
  | 'seeking_better_opportunity'

export type TrainingInterest =
  | 'computer_skills'
  | 'english_language'
  | 'office_management'
  | 'technical_skill'
  | 'business_skill'
  | 'driving'
  | 'tailoring'
  | 'other'
  | 'not_interested'

export type CandidateShortlistStatus =
  | 'not_shortlisted'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'recommended'
  | 'placed'
  | 'not_selected'

export type EmploymentApplicationDetails = {
  father_name?: string
  member_no?: string
  cnic?: string
  education_level?: string
  field_of_study?: string
  skills?: string[]
  experience_years?: string
  experience_summary?: string
  preferred_job_location?: string
  expected_salary?: string
  employment_type?: EmploymentType
  current_employment_status?: EmploymentCurrentStatus
  training_interest?: TrainingInterest
  skill_development_request?: string
  cv_summary?: string
  availability?: string
  shortlist_status?: CandidateShortlistStatus
  placement_status?: string
  placement_notes?: string
  interview_notes?: string
  employer_name?: string
  job_title?: string
  admin_notes?: string
}

export type EmploymentDocumentRecord = {
  id: string
  application_id: string
  program_key: string
  document_type: string
  file_name: string | null
  file_path: string
  file_size: number | null
  mime_type: string | null
  verification_status: string
  is_verified: boolean
  admin_note: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

export type VerifyMembershipResult = {
  found: boolean
  verified: boolean
  member?: {
    id: string
    user_id?: string
    member_no: string
    full_name: string
    father_name: string
    cnic?: string
    mobile?: string
    district?: string
    taluka?: string | null
    address?: string | null
    status?: string
  }
  message?: string
}

export const employmentStatusOptions: EmploymentStatus[] = [
  'submitted',
  'under_review',
  'need_more_info',
  'approved',
  'rejected',
  'paid_completed',
  'completed',
]

export const employmentTypeOptions: Array<{ value: EmploymentType; label: string }> = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'remote', label: 'Remote' },
  { value: 'any', label: 'Any suitable opportunity' },
]

export const currentEmploymentStatusOptions: Array<{
  value: EmploymentCurrentStatus
  label: string
}> = [
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'employed', label: 'Currently Employed' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'student', label: 'Student' },
  { value: 'fresh_graduate', label: 'Fresh Graduate' },
  { value: 'seeking_better_opportunity', label: 'Seeking Better Opportunity' },
]

export const trainingInterestOptions: Array<{
  value: TrainingInterest
  label: string
}> = [
  { value: 'computer_skills', label: 'Computer Skills' },
  { value: 'english_language', label: 'English Language' },
  { value: 'office_management', label: 'Office Management' },
  { value: 'technical_skill', label: 'Technical Skill' },
  { value: 'business_skill', label: 'Business Skill' },
  { value: 'driving', label: 'Driving' },
  { value: 'tailoring', label: 'Tailoring' },
  { value: 'other', label: 'Other Training' },
  { value: 'not_interested', label: 'Not Interested' },
]

export const shortlistStatusOptions: Array<{
  value: CandidateShortlistStatus
  label: string
}> = [
  { value: 'not_shortlisted', label: 'Not Shortlisted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'placed', label: 'Placed / Employed' },
  { value: 'not_selected', label: 'Not Selected' },
]

export const employmentDocumentOptions: Array<{
  type: EmploymentDocumentType
  label: string
  required: boolean
  description: string
}> = [
  {
    type: 'cv_resume',
    label: 'CV / Resume',
    required: true,
    description: 'Updated CV in PDF, DOC or DOCX format.',
  },
  {
    type: 'cnic_copy',
    label: 'CNIC Copy',
    required: true,
    description: 'Applicant CNIC front/back or clear image/PDF.',
  },
  {
    type: 'education_certificate',
    label: 'Education Certificate',
    required: false,
    description: 'Degree, certificate, marksheet or transcript.',
  },
  {
    type: 'experience_certificate',
    label: 'Experience Certificate',
    required: false,
    description: 'Previous employment proof, if available.',
  },
  {
    type: 'skills_certificate',
    label: 'Skills Certificate',
    required: false,
    description: 'Technical, computer or vocational skill certificate.',
  },
  {
    type: 'other_document',
    label: 'Other Supporting Document',
    required: false,
    description: 'Any other document useful for placement review.',
  },
]

export const employmentRequiredDocumentTypes = employmentDocumentOptions
  .filter((item) => item.required)
  .map((item) => item.type)

export function getEmploymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: 'Registered',
    under_review: 'Under Review',
    need_more_info: 'Need More Info',
    approved: 'Shortlisted',
    rejected: 'Rejected',
    paid_completed: 'Placed / Employed',
    completed: 'Closed',
  }

  return labels[status] || status
}

export function getEmploymentStatusClass(status: string) {
  const classes: Record<string, string> = {
    submitted: 'border-blue-200 bg-blue-50 text-blue-700',
    under_review: 'border-amber-200 bg-amber-50 text-amber-700',
    need_more_info: 'border-orange-200 bg-orange-50 text-orange-700',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rejected: 'border-red-200 bg-red-50 text-red-700',
    paid_completed: 'border-teal-200 bg-teal-50 text-teal-700',
    completed: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return classes[status] || 'border-slate-200 bg-slate-50 text-slate-700'
}

export function getEmploymentDocumentLabel(type: string) {
  return employmentDocumentOptions.find((item) => item.type === type)?.label || type
}

export function getShortlistStatusLabel(value?: string | null) {
  return (
    shortlistStatusOptions.find((item) => item.value === value)?.label ||
    'Not Shortlisted'
  )
}

export function getEmploymentTypeLabel(value?: string | null) {
  return employmentTypeOptions.find((item) => item.value === value)?.label || 'Any'
}

export function getCurrentEmploymentStatusLabel(value?: string | null) {
  return (
    currentEmploymentStatusOptions.find((item) => item.value === value)?.label ||
    'Not provided'
  )
}

export function getTrainingInterestLabel(value?: string | null) {
  return (
    trainingInterestOptions.find((item) => item.value === value)?.label ||
    'Not provided'
  )
}

export function getEmploymentDocumentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
    need_more_info: 'Need More Info',
  }

  return labels[status] || status
}

export function getEmploymentDocumentStatusClass(status: string) {
  const classes: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700',
    verified: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    need_more_info: 'bg-amber-100 text-amber-700',
  }

  return classes[status] || 'bg-slate-100 text-slate-700'
}

export function validateEmploymentDocumentFile(file: File) {
  if (file.size > EMPLOYMENT_MAX_DOCUMENT_SIZE_BYTES) {
    return `File size ${EMPLOYMENT_MAX_DOCUMENT_SIZE_MB}MB se zyada nahi honi chahiye.`
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    return 'Sirf PDF, DOC, DOCX, JPG, PNG ya WEBP file upload karen.'
  }

  return ''
}

export function createEmploymentDocumentStoragePath({
  userId,
  applicationId,
  documentType,
  fileName,
}: {
  userId: string
  applicationId: string
  documentType: string
  fileName: string
}) {
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'file'
  const safeExt = extension?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'file'
  const timestamp = Date.now()

  return `${userId}/${applicationId}/${documentType}-${timestamp}.${safeExt}`
}

export function formatEmploymentFileSize(size?: number | null) {
  if (!size) return 'Unknown size'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function normalizeSkills(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatSkills(skills?: string[] | null) {
  return skills?.length ? skills.join(', ') : 'Not provided'
}

export function parseVerifyMembershipResult(value: Json | null): VerifyMembershipResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { found: false, verified: false, message: 'Invalid membership response.' }
  }

  return value as VerifyMembershipResult
}
