export type HealthStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'approved'
  | 'rejected'
  | 'paid_completed'
  | 'completed'

export type HealthDocumentVerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_reupload'

export type HealthDocumentType =
  | 'patient_cnic_bform'
  | 'member_cnic'
  | 'medical_reports'
  | 'doctor_prescription'
  | 'hospital_estimate'
  | 'lab_reports'
  | 'other'

export type HealthPaymentStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'partially_released'
  | 'released'
  | 'completed'

export type HealthCommitteeDecision =
  | 'pending'
  | 'recommended'
  | 'not_recommended'
  | 'approved'
  | 'rejected'
  | 'deferred'

export type HealthTreatmentType =
  | 'Emergency Treatment'
  | 'Surgery'
  | 'Medicine Support'
  | 'Lab Tests'
  | 'Hospital Admission'
  | 'Follow-up Treatment'
  | 'Chronic Disease Support'
  | 'Other'

export type MemberRelationship =
  | 'self'
  | 'son'
  | 'daughter'
  | 'father'
  | 'mother'
  | 'brother'
  | 'sister'
  | 'wife'
  | 'husband'
  | 'guardian'
  | 'other'

export type VerifyMembershipResult = {
  valid: boolean
  reason?: string
  member_id?: string
  membership_no?: string
  full_name?: string
  district?: string
  taluka?: string
  status?: string
}

export type HealthApplicationDetails = {
  case_priority?: 'emergency' | 'urgent' | 'normal' | string
  patient_age?: string
  patient_gender?: string
  guardian_name?: string
  disease_name?: string
  treatment_type?: string
  hospital_name?: string
  doctor_name?: string
  doctor_contact?: string
  estimated_cost?: string
  required_amount?: string
  emergency?: boolean
  case_summary?: string
  medical_committee_remarks?: string
  health_committee_decision?: HealthCommitteeDecision | string
  health_committee_reviewed_at?: string
  health_committee_members?: string
  health_committee_remarks?: string
  payment_status?: HealthPaymentStatus | string
  follow_up_notes?: string
  case_close_report?: string
}

export type HealthDocumentConfig = {
  type: HealthDocumentType
  label: string
  description: string
  required: boolean
}

export type HealthDocumentRecord = {
  id: string
  application_id: string
  program_key: 'health'
  uploaded_by: string
  document_type: HealthDocumentType | string
  file_path: string
  file_name: string | null
  mime_type: string | null
  file_size: number | null
  verification_status: HealthDocumentVerificationStatus | string
  is_verified: boolean
  admin_note: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export const HEALTH_DOCUMENT_BUCKET = 'health-documents'

export const HEALTH_MAX_DOCUMENT_SIZE_MB = 8

export const HEALTH_MAX_DOCUMENT_SIZE_BYTES =
  HEALTH_MAX_DOCUMENT_SIZE_MB * 1024 * 1024

export const HEALTH_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp'

export const HEALTH_ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const relationshipOptions: Array<{
  value: MemberRelationship
  label: string
}> = [
  { value: 'self', label: 'Self' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'wife', label: 'Wife' },
  { value: 'husband', label: 'Husband' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
]

export const patientGenderOptions = ['Male', 'Female', 'Other']

export const treatmentTypeOptions: HealthTreatmentType[] = [
  'Emergency Treatment',
  'Surgery',
  'Medicine Support',
  'Lab Tests',
  'Hospital Admission',
  'Follow-up Treatment',
  'Chronic Disease Support',
  'Other',
]

export const healthPaymentStatusOptions: Array<{
  value: HealthPaymentStatus
  label: string
}> = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending', label: 'Payment Pending' },
  { value: 'approved', label: 'Payment Approved' },
  { value: 'partially_released', label: 'Partially Released' },
  { value: 'released', label: 'Released' },
  { value: 'completed', label: 'Completed' },
]

export const healthCommitteeDecisionOptions: Array<{
  value: HealthCommitteeDecision
  label: string
}> = [
  { value: 'pending', label: 'Pending Committee Review' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'not_recommended', label: 'Not Recommended' },
  { value: 'approved', label: 'Committee Approved' },
  { value: 'rejected', label: 'Committee Rejected' },
  { value: 'deferred', label: 'Deferred / More Info Needed' },
]

export const healthDocumentOptions: HealthDocumentConfig[] = [
  {
    type: 'patient_cnic_bform',
    label: 'Patient CNIC / B-form',
    description: 'Upload patient CNIC, B-form or identity document copy.',
    required: true,
  },
  {
    type: 'member_cnic',
    label: 'Member CNIC',
    description: 'Upload approved JAS member CNIC copy.',
    required: true,
  },
  {
    type: 'medical_reports',
    label: 'Medical Reports',
    description: 'Upload diagnosis report, discharge summary or case report.',
    required: true,
  },
  {
    type: 'doctor_prescription',
    label: 'Doctor Prescription',
    description: 'Upload doctor prescription or treatment advice.',
    required: true,
  },
  {
    type: 'hospital_estimate',
    label: 'Hospital Estimate',
    description: 'Upload hospital estimate, bill or treatment cost proof.',
    required: true,
  },
  {
    type: 'lab_reports',
    label: 'Lab Reports',
    description: 'Upload lab reports if available.',
    required: false,
  },
  {
    type: 'other',
    label: 'Other Supporting Document',
    description: 'Upload any other supporting medical document if needed.',
    required: false,
  },
]

export const healthRequiredDocumentTypes = healthDocumentOptions
  .filter((item) => item.required)
  .map((item) => item.type)

export const healthStatusLabels: Record<HealthStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Medical Review',
  need_more_info: 'Need More Info',
  approved: 'Approved',
  rejected: 'Rejected',
  paid_completed: 'Payment Released',
  completed: 'Case Closed',
}

export const healthDocumentStatusLabels: Record<
  HealthDocumentVerificationStatus,
  string
> = {
  pending: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_reupload: 'Needs Re-upload',
}

export function getHealthStatusLabel(status: string) {
  return healthStatusLabels[status as HealthStatus] ?? status
}

export function getHealthStatusClass(status: string) {
  switch (status) {
    case 'approved':
    case 'paid_completed':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'need_more_info':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'under_review':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getHealthDocumentConfig(type: string) {
  return healthDocumentOptions.find((item) => item.type === type)
}

export function getHealthDocumentLabel(type: string) {
  return getHealthDocumentConfig(type)?.label ?? type
}

export function getHealthDocumentStatusLabel(status: string) {
  return (
    healthDocumentStatusLabels[
      status as HealthDocumentVerificationStatus
    ] ?? status
  )
}

export function getHealthDocumentStatusClass(status: string) {
  switch (status) {
    case 'verified':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'needs_reupload':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getHealthPaymentStatusLabel(status?: string | null) {
  if (!status) return 'Not Started'

  return (
    healthPaymentStatusOptions.find((item) => item.value === status)?.label ??
    status
  )
}

export function validateHealthDocumentFile(file: File) {
  if (file.size > HEALTH_MAX_DOCUMENT_SIZE_BYTES) {
    return {
      ok: false,
      message: `File size ${HEALTH_MAX_DOCUMENT_SIZE_MB}MB se kam honi chahiye.`,
    }
  }

  if (
    file.type &&
    !HEALTH_ALLOWED_DOCUMENT_MIME_TYPES.includes(
      file.type as (typeof HEALTH_ALLOWED_DOCUMENT_MIME_TYPES)[number],
    )
  ) {
    return {
      ok: false,
      message: 'Sirf PDF, JPG, PNG ya WEBP document upload karen.',
    }
  }

  return { ok: true, message: '' }
}

export function createHealthDocumentStoragePath({
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
  const extension = fileName.split('.').pop()?.toLowerCase() || 'file'
  const safeDocumentType = documentType.replace(/[^a-z0-9_-]/gi, '-')

  return `${userId}/${applicationId}/${safeDocumentType}-${Date.now()}.${extension}`
}

export function formatHealthFileSize(size?: number | null) {
  if (!size) return 'Unknown size'

  const kb = size / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`

  return `${(kb / 1024).toFixed(2)} MB`
}

export function isHealthEmergency(details?: HealthApplicationDetails | null) {
  return Boolean(details?.emergency)
}


export function getHealthCommitteeDecisionLabel(status?: string | null) {
  if (!status) return 'Pending Committee Review'

  return (
    healthCommitteeDecisionOptions.find((item) => item.value === status)?.label ??
    status
  )
}

export function getHealthCommitteeDecisionClass(status?: string | null) {
  switch (status) {
    case 'approved':
    case 'recommended':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'rejected':
    case 'not_recommended':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'deferred':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getHealthCasePriority(details?: HealthApplicationDetails | null) {
  if (details?.case_priority) return details.case_priority
  return isHealthEmergency(details) ? 'emergency' : 'normal'
}

export function getHealthCasePriorityLabel(details?: HealthApplicationDetails | null) {
  const priority = getHealthCasePriority(details)

  if (priority === 'emergency') return 'Emergency'
  if (priority === 'urgent') return 'Urgent'
  return 'Normal'
}

export function getHealthCasePriorityClass(details?: HealthApplicationDetails | null) {
  const priority = getHealthCasePriority(details)

  if (priority === 'emergency') return 'bg-red-100 text-red-800 border-red-200'
  if (priority === 'urgent') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-slate-100 text-slate-800 border-slate-200'
}

export function sortHealthCasesByPriority<T extends { details?: HealthApplicationDetails | null; created_at: string }>(
  items: T[],
) {
  const priorityWeight = (details?: HealthApplicationDetails | null) => {
    const priority = getHealthCasePriority(details)
    if (priority === 'emergency') return 0
    if (priority === 'urgent') return 1
    return 2
  }

  return [...items].sort((a, b) => {
    const byPriority = priorityWeight(a.details) - priorityWeight(b.details)
    if (byPriority !== 0) return byPriority

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function formatHealthMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-'

  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)

  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export function sanitizeHealthReportText(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
