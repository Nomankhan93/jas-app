// src/routes/admin/members/$id.tsx
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { AdminShell } from '../../../components/admin/AdminShell'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  ExternalLink,
  Hourglass,
  IdCard,
  ImageOff,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import {
  approveMemberAction,
  rejectMemberAction,
} from '../../../lib/admin/actions'
import {
  MEMBERSHIP_RECEIPT_ALLOWED_TYPES,
  MEMBERSHIP_RECEIPT_BUCKET,
  MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES,
  MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL,
  type MembershipPayment,
  createPendingMembershipPaymentPayload,
  type MembershipPaymentStatus,
  formatMembershipMoney,
  getMembershipPaymentDisplayStatus,
  getMembershipPaymentQrHelpText,
  getMembershipPaymentStatusClass,
  getMembershipPaymentStatusLabel,
} from '../../../lib/membership-fee'
import { supabase } from '../../../lib/supabase/client'
import {
  formatCnicInput,
  formatMobileInput,
  isPakistaniMobile,
  normalizeMobile,
  optionalText,
  todayDate,
} from '../../../lib/shared/formatters'
import { useAdminMemberDetailCopy } from '../../../lib/admin-member-detail-i18n'
import {
  addCommitteeMember,
  fetchCommitteesForAdmin,
  fetchDesignations,
  formatCommitteeDate,
  getCommitteeLocationLabel,
  getCommitteeStatusClass,
  getCommitteeStatusLabel,
  getCommitteeTypeLabel,
  type CommitteeMemberRecord,
  type CommitteeRecord,
  type CommitteeStatus,
  type DesignationRecord,
  type MemberSearchResult,
} from '../../../lib/committees'

export const Route = createFileRoute('/admin/members/$id')({
  component: AdminMemberDetailPage,
})

type MemberStatus = 'pending' | 'approved' | 'rejected'

type Member = {
  id: string
  user_id: string
  member_no: string | null
  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string | null
  status: MemberStatus
  rejection_reason: string | null
  reviewed_at: string | null
  approved_at: string | null
  created_at: string
}

type AdminEditFormState = {
  fullName: string
  fatherName: string
  cnic: string
  mobile: string
  district: string
  taluka: string
  address: string
  dateOfBirth: string
  gender: string
  education: string
  bloodGroup: string
  profession: string
  casteBranch: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactMobile: string
  declarationAccepted: boolean
}

type AdminEditField = keyof AdminEditFormState | 'photo'

type AdminEditErrors = Partial<Record<AdminEditField, string>>

type OfficeBearerIssueForm = {
  committeeId: string
  designationId: string
  designationTitle: string
  status: CommitteeStatus
  sortOrder: string
  tenureStart: string
  tenureEnd: string
  appointmentNotes: string
}

type AdminOfficeBearerAssignment = CommitteeMemberRecord & {
  committee: CommitteeRecord | null
}

type AdminAccessResult =
  | { ok: true }
  | { ok: false; redirectTo: '/login' | '/dashboard' }

const MEMBER_PHOTO_BUCKET = 'member-photos'
const MEMBER_PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024
const MEMBER_PHOTO_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const SIGNED_URL_TTL_SECONDS = 60 * 60
const RECEIPT_SIGNED_URL_TTL_SECONDS = 60 * 60
const MIN_REJECTION_REASON_LENGTH = 10
const MEMBERSHIP_REVIEW_ROLES: Array<
  'admin' | 'super_admin' | 'membership_admin'
> = ['admin', 'super_admin', 'membership_admin']

const initialOfficeBearerIssueForm: OfficeBearerIssueForm = {
  committeeId: '',
  designationId: '',
  designationTitle: '',
  status: 'active',
  sortOrder: '10',
  tenureStart: todayDate(),
  tenureEnd: '',
  appointmentNotes: '',
}

const MEMBER_SELECT_COLUMNS = [
  'id',
  'user_id',
  'member_no',
  'address',
  'date_of_birth',
  'gender',
  'education',
  'blood_group',
  'emergency_contact_name',
  'emergency_contact_relation',
  'emergency_contact_mobile',
  'declaration_accepted',
  'full_name',
  'father_name',
  'cnic',
  'mobile',
  'district',
  'taluka',
  'profession',
  'caste_branch',
  'photo_url',
  'status',
  'rejection_reason',
  'reviewed_at',
  'approved_at',
  'created_at',
].join(', ')

function AdminMemberDetailPage() {
  const { id } = Route.useParams()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isNestedMemberRoute =
    normalizedPathname === `/admin/members/${id}/card` ||
    normalizedPathname === `/admin/members/${id}/designation-card`

  if (isNestedMemberRoute) {
    return <Outlet />
  }

  return <AdminMemberApplicationPage id={id} />
}

function AdminMemberApplicationPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const { copy, textDir, textAlignClass } = useAdminMemberDetailCopy()

  const [member, setMember] = useState<Member | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [membershipPayment, setMembershipPayment] =
    useState<MembershipPayment | null>(null)
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null)
  const [paymentAdminNote, setPaymentAdminNote] = useState('')
  const [paymentActionLoading, setPaymentActionLoading] = useState(false)
  const [paymentLoadError, setPaymentLoadError] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState<AdminEditFormState | null>(null)
  const [editErrors, setEditErrors] = useState<AdminEditErrors>({})
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [officeBearerAssignments, setOfficeBearerAssignments] = useState<
    AdminOfficeBearerAssignment[]
  >([])
  const [officeBearerCommittees, setOfficeBearerCommittees] = useState<
    CommitteeRecord[]
  >([])
  const [officeBearerDesignations, setOfficeBearerDesignations] = useState<
    DesignationRecord[]
  >([])
  const [officeBearerForm, setOfficeBearerForm] = useState<OfficeBearerIssueForm>(
    initialOfficeBearerIssueForm,
  )
  const [officeBearerPanelOpen, setOfficeBearerPanelOpen] = useState(false)
  const [officeBearerLoading, setOfficeBearerLoading] = useState(false)
  const [officeBearerSaving, setOfficeBearerSaving] = useState(false)
  const [officeBearerError, setOfficeBearerError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const trimmedRejectionReason = useMemo(
    () => rejectionReason.trim(),
    [rejectionReason],
  )

  const canViewCard = member?.status === 'approved' && Boolean(member.member_no)
  const canIssueOfficeBearer = canViewCard
  const hasActiveOfficeBearer = officeBearerAssignments.some(
    (assignment) => assignment.status === 'active',
  )
  const selectedOfficeBearerCommittee = officeBearerCommittees.find(
    (committee) => committee.id === officeBearerForm.committeeId,
  )
  const scopedOfficeBearerDesignations = officeBearerDesignations.filter(
    (designation) =>
      designation.is_active &&
      (!selectedOfficeBearerCommittee ||
        designation.scope === selectedOfficeBearerCommittee.committee_type),
  )
  const canEditApplication =
    member?.status === 'pending' || member?.status === 'rejected'
  const reasonTooShort =
    trimmedRejectionReason.length > 0 &&
    trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH

  const loadMember = useCallback(
    async (
      cancelledRef?: { current: boolean },
      options?: { silent?: boolean },
    ) => {
      const silent = options?.silent ?? false

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')
      setPaymentLoadError('')

      try {
        const access = await ensureAdminAccess()

        if (!access.ok) {
          if (!cancelledRef?.current) {
            await navigate({ to: access.redirectTo })
          }

          return
        }

        const safeMember = await fetchMemberById(id)

        if (!safeMember) {
          throw new Error(copy.memberNotFound)
        }

        const [signedPhotoUrl, paymentResult] = await Promise.all([
          createSignedPhotoUrl(safeMember.photo_url),
          fetchMembershipPaymentWithReceiptUrl(safeMember.id),
        ])

        if (cancelledRef?.current) return

        setMember(safeMember)
        setEditForm(memberToAdminEditForm(safeMember))
        setEditErrors({})
        setEditPhoto(null)
        if (editPhotoPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(editPhotoPreview)
        }
        setEditPhotoPreview(null)
        if (!safeMember.status || safeMember.status === 'approved') {
          setEditMode(false)
        }
        setPhotoUrl(signedPhotoUrl)
        setMembershipPayment(paymentResult.payment)
        setReceiptSignedUrl(paymentResult.receiptSignedUrl)
        setPaymentAdminNote(paymentResult.payment?.admin_note ?? '')
        setPaymentLoadError(paymentResult.errorMessage ?? '')
      } catch (err) {
        if (!cancelledRef?.current) {
          setError(err instanceof Error ? err.message : 'Failed to load member.')
          setMember(null)
          setPhotoUrl(null)
          setMembershipPayment(null)
          setReceiptSignedUrl(null)
          setPaymentAdminNote('')
          setPaymentLoadError('')
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [id, navigate],
  )

  useEffect(() => {
    const cancelledRef = { current: false }

    void loadMember(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [loadMember])

  useEffect(() => {
    if (!member?.id || !canIssueOfficeBearer) {
      setOfficeBearerAssignments([])
      return
    }

    void loadOfficeBearerIssueData(member.id)
  }, [member?.id, canIssueOfficeBearer])

  useEffect(() => {
    return () => {
      if (editPhotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(editPhotoPreview)
      }
    }
  }, [editPhotoPreview])

  function startEditMode() {
    if (!member || !canEditApplication) return

    setEditForm(memberToAdminEditForm(member))
    setEditErrors({})
    setEditPhoto(null)
    if (editPhotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview)
    }
    setEditPhotoPreview(null)
    setError('')
    setSuccess('')
    setEditMode(true)
  }

  function cancelEditMode() {
    if (editPhotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview)
    }

    setEditForm(member ? memberToAdminEditForm(member) : null)
    setEditErrors({})
    setEditPhoto(null)
    setEditPhotoPreview(null)
    setEditMode(false)
    setError('')
  }

  function updateEditField<K extends keyof AdminEditFormState>(
    field: K,
    value: AdminEditFormState[K],
  ) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    )

    setEditErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })

    setError('')
    setSuccess('')
  }

  function handleAdminPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    setSuccess('')
    setEditPhoto(null)

    if (editPhotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview)
      setEditPhotoPreview(null)
    }

    const file = event.target.files?.[0] ?? null
    if (!file) return

    if (!MEMBER_PHOTO_ALLOWED_TYPES.includes(file.type)) {
      setEditErrors((current) => ({
        ...current,
        photo: 'Upload PNG, JPG or WebP image only.',
      }))
      event.target.value = ''
      return
    }

    if (file.size > MEMBER_PHOTO_MAX_SIZE_BYTES) {
      setEditErrors((current) => ({
        ...current,
        photo: 'Profile photo must be 2MB or smaller.',
      }))
      event.target.value = ''
      return
    }

    setEditPhoto(file)
    setEditPhotoPreview(URL.createObjectURL(file))
    setEditErrors((current) => {
      const next = { ...current }
      delete next.photo
      return next
    })
  }

  async function handleAdminEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!member || !editForm || !canEditApplication || editSaving) return

    const validationErrors = validateAdminEditForm(editForm)
    setEditErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the highlighted application fields before saving.')
      return
    }

    setEditSaving(true)
    setError('')
    setSuccess('')

    try {
      let photoPath = member.photo_url

      if (editPhoto) {
        const extension = editPhoto.name.split('.').pop()?.toLowerCase() || 'jpg'
        photoPath = `${member.user_id}/admin-photo-${Date.now()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from(MEMBER_PHOTO_BUCKET)
          .upload(photoPath, editPhoto, {
            upsert: true,
            contentType: editPhoto.type || 'image/jpeg',
          })

        if (uploadError) throw uploadError
      }

      const payload = {
        full_name: editForm.fullName.trim(),
        father_name: editForm.fatherName.trim(),
        cnic: editForm.cnic.trim(),
        mobile: normalizeMobile(editForm.mobile),
        district: editForm.district.trim(),
        taluka: optionalText(editForm.taluka),
        address: editForm.address.trim(),
        date_of_birth: editForm.dateOfBirth || null,
        gender: optionalText(editForm.gender),
        education: optionalText(editForm.education),
        blood_group: optionalText(editForm.bloodGroup),
        profession: optionalText(editForm.profession),
        caste_branch: optionalText(editForm.casteBranch),
        emergency_contact_name: optionalText(editForm.emergencyContactName),
        emergency_contact_relation: optionalText(editForm.emergencyContactRelation),
        emergency_contact_mobile:
          normalizeMobile(editForm.emergencyContactMobile) || null,
        declaration_accepted: editForm.declarationAccepted,
        photo_url: photoPath ?? '',
      }

      const { data: updatedMember, error: updateError } = await supabase
        .from('members')
        .update(payload)
        .eq('id', member.id)
        .in('status', ['pending', 'rejected'])
        .select(MEMBER_SELECT_COLUMNS)
        .maybeSingle()

      if (updateError) throw updateError
      if (!updatedMember) {
        throw new Error('Application could not be updated. It may already be approved.')
      }

      const nextMember = updatedMember as unknown as Member
      const signedPhotoUrl = await createSignedPhotoUrl(nextMember.photo_url)

      if (editPhotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(editPhotoPreview)
      }

      setMember(nextMember)
      setEditForm(memberToAdminEditForm(nextMember))
      setPhotoUrl(signedPhotoUrl)
      setEditPhoto(null)
      setEditPhotoPreview(null)
      setEditErrors({})
      setEditMode(false)
      setSuccess('Application details updated successfully.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update application details.',
      )
    } finally {
      setEditSaving(false)
    }
  }

  function openOfficeBearerPanel() {
    setOfficeBearerPanelOpen(true)

    window.setTimeout(() => {
      document.getElementById('office-bearer-issue-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  async function loadOfficeBearerIssueData(memberId: string) {
    setOfficeBearerLoading(true)
    setOfficeBearerError('')

    try {
      const [committees, designations, assignments] = await Promise.all([
        fetchCommitteesForAdmin(),
        fetchDesignations(),
        fetchOfficeBearerAssignments(memberId),
      ])

      setOfficeBearerCommittees(committees)
      setOfficeBearerDesignations(designations)
      setOfficeBearerAssignments(assignments)
    } catch (err) {
      setOfficeBearerError(
        err instanceof Error
          ? err.message
          : 'Unable to load office bearer designation data.',
      )
    } finally {
      setOfficeBearerLoading(false)
    }
  }

  function updateOfficeBearerForm(fields: Partial<OfficeBearerIssueForm>) {
    setOfficeBearerForm((current) => ({ ...current, ...fields }))
    setOfficeBearerError('')
    setSuccess('')
  }

  function handleOfficeBearerCommitteeChange(committeeId: string) {
    const committee = officeBearerCommittees.find((item) => item.id === committeeId)

    setOfficeBearerForm((current) => ({
      ...current,
      committeeId,
      designationId: '',
      designationTitle: '',
      tenureStart: committee?.tenure_start ?? (current.tenureStart || todayDate()),
      tenureEnd: committee?.tenure_end ?? '',
    }))
    setOfficeBearerError('')
    setSuccess('')
  }

  function handleOfficeBearerDesignationChange(designationId: string) {
    const designation = officeBearerDesignations.find((item) => item.id === designationId)

    setOfficeBearerForm((current) => ({
      ...current,
      designationId,
      designationTitle: designation?.title ?? current.designationTitle,
    }))
    setOfficeBearerError('')
    setSuccess('')
  }

  async function handleIssueOfficeBearerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!member || !canIssueOfficeBearer || officeBearerSaving) return

    const selectedCommittee = officeBearerCommittees.find(
      (committee) => committee.id === officeBearerForm.committeeId,
    )
    const designationTitle = officeBearerForm.designationTitle.trim()
    const sortOrder = Number.parseInt(officeBearerForm.sortOrder, 10)

    if (!selectedCommittee) {
      setOfficeBearerError('Select an active committee first.')
      return
    }

    if (selectedCommittee.status !== 'active') {
      setOfficeBearerError('Designation can only be issued from an active committee.')
      return
    }

    if (!designationTitle) {
      setOfficeBearerError('Designation title is required.')
      return
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      setOfficeBearerError('Display order must be a valid positive number.')
      return
    }

    const duplicateActiveCommitteeRole = officeBearerAssignments.find(
      (assignment) =>
        assignment.committee_id === selectedCommittee.id &&
        assignment.status === 'active',
    )

    if (duplicateActiveCommitteeRole) {
      setOfficeBearerError(
        `This member already has an active ${duplicateActiveCommitteeRole.designation_title} role in this committee. Open the committee detail page to edit the existing role.`,
      )
      return
    }

    setOfficeBearerSaving(true)
    setOfficeBearerError('')
    setError('')
    setSuccess('')

    try {
      await addCommitteeMember({
        committee_id: selectedCommittee.id,
        member: memberToCommitteeSearchResult(member),
        designation_id: officeBearerForm.designationId || null,
        designation_title: designationTitle,
        status: officeBearerForm.status,
        sort_order: sortOrder,
        tenure_start: officeBearerForm.tenureStart || null,
        tenure_end: officeBearerForm.tenureEnd || null,
        appointment_notes: officeBearerForm.appointmentNotes.trim() || null,
      })

      await loadOfficeBearerIssueData(member.id)
      setOfficeBearerForm({
        ...initialOfficeBearerIssueForm,
        tenureStart: todayDate(),
      })
      setOfficeBearerPanelOpen(false)
      setSuccess('Office bearer designation issued successfully. The designation card is now available.')
    } catch (err) {
      setOfficeBearerError(
        err instanceof Error
          ? err.message
          : 'Failed to issue office bearer designation.',
      )
    } finally {
      setOfficeBearerSaving(false)
    }
  }

  async function handlePaymentReceiptUpload(file: File) {
    if (!member || receiptUploading) return

    const paymentFinal =
      membershipPayment?.status === 'paid' || membershipPayment?.status === 'waived'

    if (paymentFinal) {
      setError('Paid or waived payment records are locked. Receipt changes are not allowed.')
      return
    }

    if (!canEditApplication) {
      setError('Approved applications cannot receive replacement receipts in this patch.')
      return
    }

    if (!MEMBERSHIP_RECEIPT_ALLOWED_TYPES.includes(file.type)) {
      setError(`Receipt must be PNG, JPG, WebP or PDF and ${MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL} or smaller.`)
      return
    }

    if (file.size > MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES) {
      setError(`Receipt file must be ${MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL} or smaller.`)
      return
    }

    if (
      membershipPayment &&
      membershipPayment.status !== 'pending' &&
      membershipPayment.status !== 'failed'
    ) {
      setError('Only pending or failed payment records can receive replacement receipts.')
      return
    }

    setReceiptUploading(true)
    setError('')
    setSuccess('')

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const receiptPath = `${member.user_id}/admin-receipt-${Date.now()}.${extension}`
      const receiptMimeType = file.type || 'application/octet-stream'
      const receiptUploadedAt = new Date().toISOString()

      const { error: uploadError } = await supabase.storage
        .from(MEMBERSHIP_RECEIPT_BUCKET)
        .upload(receiptPath, file, {
          upsert: true,
          contentType: receiptMimeType,
        })

      if (uploadError) throw uploadError

      const receiptPayload = {
        receipt_path: receiptPath,
        receipt_file_name: file.name,
        receipt_mime_type: receiptMimeType,
        receipt_size_bytes: file.size,
        receipt_uploaded_at: receiptUploadedAt,
      }

      let savedPayment: MembershipPayment | null = null

      if (membershipPayment) {
        const { data, error: updateError } = await supabase
          .from('membership_payments')
          .update({
            ...receiptPayload,
            status:
              membershipPayment.status === 'failed'
                ? 'pending'
                : membershipPayment.status,
            updated_at: receiptUploadedAt,
          })
          .eq('id', membershipPayment.id)
          .in('status', ['pending', 'failed'])
          .select('*')
          .maybeSingle()
          .returns<MembershipPayment | null>()

        if (updateError) throw updateError
        if (!data) throw new Error('Payment record could not be updated.')
        savedPayment = data
      } else {
        const { data, error: insertError } = await supabase
          .from('membership_payments')
          .insert(
            createPendingMembershipPaymentPayload(
              member.id,
              member.user_id,
              receiptPayload,
            ),
          )
          .select('*')
          .maybeSingle()
          .returns<MembershipPayment | null>()

        if (insertError) throw insertError
        if (!data) throw new Error('Payment record could not be created.')
        savedPayment = data
      }

      const signedReceiptUrl = await createSignedReceiptUrl(savedPayment.receipt_path)
      setMembershipPayment(savedPayment)
      setReceiptSignedUrl(signedReceiptUrl)
      setPaymentAdminNote(savedPayment.admin_note ?? '')
      setPaymentLoadError(
        savedPayment.receipt_path && !signedReceiptUrl
          ? 'Receipt file not available.'
          : '',
      )
      setSuccess('Payment receipt updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt.')
    } finally {
      setReceiptUploading(false)
    }
  }

  async function handleApprove() {
    if (!member || actionLoading) return

    const confirmed = window.confirm(
      `Approve ${member.full_name}? This will issue/activate membership and enable the digital card when member number is available.`,
    )

    if (!confirmed) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const accessToken = await getAccessToken()

      await approveMemberAction({
        data: {
          memberId: member.id,
          accessToken,
        },
      })

      setSuccess('Member approved successfully.')
      await loadMember(undefined, { silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve member.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (
      !member ||
      actionLoading ||
      trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH
    ) {
      return
    }

    const confirmed = window.confirm(
      `Reject ${member.full_name}? The member will need to update and resubmit the application.`,
    )

    if (!confirmed) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const accessToken = await getAccessToken()

      await rejectMemberAction({
        data: {
          memberId: member.id,
          rejectionReason: trimmedRejectionReason,
          accessToken,
        },
      })

      setRejectionReason('')
      setSuccess('Application rejected with reason.')
      await loadMember(undefined, { silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject member.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePaymentStatusUpdate(status: MembershipPaymentStatus) {
    if (!member || !membershipPayment || paymentActionLoading) return

    const confirmed = window.confirm(
      `Update membership fee status to ${getMembershipPaymentStatusLabel(status)}?`,
    )

    if (!confirmed) return

    setPaymentActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const now = new Date().toISOString()
      const nextPaidAt =
        status === 'paid' || status === 'waived'
          ? membershipPayment.paid_at ?? now
          : null

      const { data, error: updateError } = await supabase
        .from('membership_payments')
        .update({
          status,
          admin_note: paymentAdminNote.trim() || null,
          paid_at: nextPaidAt,
          updated_at: now,
        })
        .eq('id', membershipPayment.id)
        .select('*')
        .maybeSingle()
        .returns<MembershipPayment | null>()

      if (updateError) throw updateError
      if (!data) throw new Error('Payment record could not be updated.')

      const signedReceiptUrl = await createSignedReceiptUrl(data.receipt_path)

      setMembershipPayment(data)
      setReceiptSignedUrl(signedReceiptUrl)
      setPaymentAdminNote(data.admin_note ?? '')
      setPaymentLoadError(
        data.receipt_path && !signedReceiptUrl ? 'Receipt file not available.' : '',
      )
      setSuccess(`Membership fee marked as ${getMembershipPaymentStatusLabel(status)}.`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update membership fee status.',
      )
    } finally {
      setPaymentActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
        <div className="page-wrap rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            {copy.loading}
          </div>
        </div>
      </div>
    </AdminShell>
    )
  }

  if (!member) {
    return (
      <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
        <div className="page-wrap space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <BackToAdmin />

          <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <h1 className="text-xl font-black text-red-900">
                  {copy.memberNotFound}
                </h1>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  {error || copy.memberNotFoundText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
    )
  }

  return (
    <AdminShell title="Member Detail" subtitle="Review membership application, payment receipt, profile data and digital card status.">
      <div className="admin-nested-page">
      <div className="page-wrap space-y-6">
        <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
            <BackToAdmin />

            <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className={`min-w-0 ${textAlignClass}`} dir={textDir}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  {copy.pageEyebrow}
                </p>

                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {member.full_name}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {copy.cnic}:{' '}
                  <span className="font-bold text-slate-800">
                    {formatCnic(member.cnic)}
                  </span>{' '}
                  · {copy.district}:{' '}
                  <span className="font-bold text-slate-800">
                    {member.district}
                    {member.taluka ? ` / ${member.taluka}` : ''}
                  </span>
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {copy.memberNo}:{' '}
                  <span className="font-bold text-slate-900">
                    {member.member_no || copy.notIssuedYet}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <StatusBadge status={member.status} />

                <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto">
                  <button
                    type="button"
                    onClick={() => void loadMember(undefined, { silent: true })}
                    disabled={refreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    {copy.refresh}
                  </button>

                  {canEditApplication ? (
                    <button
                      type="button"
                      onClick={startEditMode}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
                    >
                      <IdCard className="h-4 w-4" />
                      Edit Application
                    </button>
                  ) : null}

                  {canViewCard ? (
                    <>
                      <Link
                        to="/admin/members/$id/card"
                        params={{ id: member.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        style={{ color: '#ffffff' }}
                      >
                        <CreditCard className="h-4 w-4" />
                        {copy.viewCard}
                      </Link>

                      <Link
                        to="/admin/members/$id/designation-card"
                        params={{ id: member.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:from-emerald-900 hover:to-slate-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                        style={{ color: '#ffffff' }}
                      >
                        <BadgeCheck className="h-4 w-4 text-amber-300" />
                        {copy.officeBearerCard}
                      </Link>

                      <button
                        type="button"
                        onClick={openOfficeBearerPanel}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2 text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-100"
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                        Issue Designation
                      </button>
                    </>
                  ) : null}
                </div>

                {!canViewCard ? (
                  <p className="max-w-xs text-left text-xs leading-5 text-slate-500 lg:text-right">
                    {copy.digitalCardUnavailable}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <SummaryItem
              label={copy.summary.status}
              value={getStatusLabel(member.status, copy)}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.memberNo}
              value={member.member_no || copy.notIssued}
              icon={<IdCard className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.submitted}
              value={formatDate(member.created_at, true) || copy.notProvided}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <SummaryItem
              label={copy.summary.reviewed}
              value={
                formatDate(member.reviewed_at || member.approved_at, true) ||
                copy.notReviewed
              }
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        </header>

        {error ? (
          <AlertBox tone="error" icon={<AlertCircle className="h-5 w-5" />}>
            {error}
          </AlertBox>
        ) : null}

        {success ? (
          <AlertBox tone="success" icon={<CheckCircle2 className="h-5 w-5" />}>
            {success}
          </AlertBox>
        ) : null}

        <StatusPanel member={member} />

        <MembershipPaymentPanel
          payment={membershipPayment}
          receiptSignedUrl={receiptSignedUrl}
          loadError={paymentLoadError}
          adminNote={paymentAdminNote}
          onAdminNoteChange={setPaymentAdminNote}
          onStatusUpdate={handlePaymentStatusUpdate}
          onReceiptUpload={handlePaymentReceiptUpload}
          actionLoading={paymentActionLoading}
          receiptUploading={receiptUploading}
          canEditReceipt={canEditApplication}
        />

        <section className="grid gap-6 md:grid-cols-3">
          <aside className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <MemberPhoto src={photoUrl} alt={member.full_name} />

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {copy.sidebar.quickContact}
              </p>
              <p className="mt-2 break-all text-sm font-black text-slate-950">
                {formatMobile(member.mobile)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {member.district}
                {member.taluka ? `, ${member.taluka}` : ''}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="leading-6">
                  {copy.sidebar.verificationNotice}
                </p>
              </div>
            </div>
          </aside>

          {editMode && editForm && canEditApplication ? (
            <AdminMemberEditPanel
              form={editForm}
              errors={editErrors}
              photoPreview={editPhotoPreview || photoUrl}
              selectedPhotoName={editPhoto?.name ?? ''}
              saving={editSaving}
              onChange={updateEditField}
              onPhotoChange={handleAdminPhotoChange}
              onSubmit={handleAdminEditSubmit}
              onCancel={cancelEditMode}
            />
          ) : null}

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.details.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.details.subtitle}
                </p>
              </div>

              {canViewCard ? (
                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
                  <Link
                    to="/admin/members/$id/card"
                    params={{ id: member.id }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    <CreditCard className="h-4 w-4" />
                    {copy.openCard}
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    {copy.officeCard}
                  </Link>

                  <button
                    type="button"
                    onClick={openOfficeBearerPanel}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-100"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    Issue Designation
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-5">
              <DetailGroup title={copy.details.identity}>
                <InfoItem label={copy.details.fullName} value={member.full_name} />
                <InfoItem label={copy.details.fatherName} value={member.father_name} />
                <InfoItem label={copy.cnic} value={formatCnic(member.cnic)} />
                <InfoItem label={copy.details.mobile} value={formatMobile(member.mobile)} />
              </DetailGroup>

              <DetailGroup title={copy.details.location}>
                <InfoItem label={copy.district} value={member.district} />
                <InfoItem label={copy.details.taluka} value={member.taluka} />
                <InfoItem label={copy.details.address} value={member.address} wide />
              </DetailGroup>

              <DetailGroup title={copy.details.profile}>
                <InfoItem
                  label={copy.details.dateOfBirth}
                  value={formatDate(member.date_of_birth)}
                />
                <InfoItem label={copy.details.gender} value={member.gender} />
                <InfoItem label={copy.details.education} value={member.education} />
                <InfoItem label={copy.details.bloodGroup} value={member.blood_group} />
                <InfoItem label={copy.details.profession} value={member.profession} />
                <InfoItem label={copy.details.casteBranch} value={member.caste_branch} />
              </DetailGroup>

              <DetailGroup title={copy.details.emergencyContact}>
                <InfoItem
                  label={copy.details.emergencyContactName}
                  value={member.emergency_contact_name}
                />
                <InfoItem
                  label={copy.details.emergencyContactRelation}
                  value={member.emergency_contact_relation}
                />
                <InfoItem
                  label={copy.details.emergencyContactMobile}
                  value={formatMobile(member.emergency_contact_mobile)}
                />
                <InfoItem
                  label={copy.details.declarationAccepted}
                  value={member.declaration_accepted ? copy.details.yes : copy.details.no}
                />
              </DetailGroup>

              <DetailGroup title={copy.details.reviewRecord}>
                <InfoItem label={copy.summary.memberNo} value={member.member_no} />
                <InfoItem
                  label={copy.summary.submitted}
                  value={formatDate(member.created_at, true)}
                />
                <InfoItem
                  label={copy.details.approvedAt}
                  value={formatDate(member.approved_at, true)}
                />
                <InfoItem
                  label={copy.details.reviewedAt}
                  value={formatDate(member.reviewed_at, true)}
                />
              </DetailGroup>
            </div>

            {member.rejection_reason ? (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">{copy.details.rejectionReason}</p>
                    <p className="mt-1 leading-6">{member.rejection_reason}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </section>

        {canViewCard ? (
          <OfficeBearerIssuePanel
            member={member}
            assignments={officeBearerAssignments}
            committees={officeBearerCommittees}
            designations={scopedOfficeBearerDesignations}
            selectedCommittee={selectedOfficeBearerCommittee ?? null}
            form={officeBearerForm}
            loading={officeBearerLoading}
            saving={officeBearerSaving}
            error={officeBearerError}
            isOpen={officeBearerPanelOpen}
            hasActiveOfficeBearer={hasActiveOfficeBearer}
            onOpenChange={setOfficeBearerPanelOpen}
            onRefresh={() => void loadOfficeBearerIssueData(member.id)}
            onCommitteeChange={handleOfficeBearerCommitteeChange}
            onDesignationChange={handleOfficeBearerDesignationChange}
            onFormChange={updateOfficeBearerForm}
            onSubmit={handleIssueOfficeBearerSubmit}
          />
        ) : null}

        {member.status === 'pending' ? (
          <section className="admin-member-review-panel rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.review.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {copy.review.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {actionLoading ? copy.review.processing : copy.review.approve}
              </button>
            </div>

            <ReviewChecklist member={member} />

            <div className="admin-member-rejection-box mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-red-900">
                  {copy.details.rejectionReason}
                </span>

                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 sm:text-sm"
                  placeholder={copy.review.rejectionPlaceholder}
                />
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`text-xs font-medium ${
                    reasonTooShort ? 'text-red-700' : 'text-slate-500'
                  }`}
                >
                  {copy.review.minimum} {MIN_REJECTION_REASON_LENGTH} {copy.review.charactersRequired}
                  {copy.review.current}: {trimmedRejectionReason.length}
                </p>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={
                    actionLoading ||
                    trimmedRejectionReason.length < MIN_REJECTION_REASON_LENGTH
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {actionLoading ? copy.review.processing : copy.review.reject}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {copy.review.completedTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {copy.review.completedText}{' '}
                  <strong>{getStatusLabel(member.status, copy)}</strong>.
                </p>
              </div>

              {canViewCard ? (
                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                  <Link
                    to="/admin/members/$id/card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <CreditCard className="h-4 w-4" />
                    {copy.viewCard}
                  </Link>

                  <Link
                    to="/admin/members/$id/designation-card"
                    params={{ id: member.id }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-2 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white"
                    style={{ color: '#ffffff' }}
                  >
                    <BadgeCheck className="h-4 w-4 text-amber-300" />
                    {copy.officeCard}
                  </Link>
                </div>
              ) : (
                <Link
                  to="/admin"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {copy.review.backToAdminList}
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
    </AdminShell>
  )
}


function OfficeBearerIssuePanel({
  member,
  assignments,
  committees,
  designations,
  selectedCommittee,
  form,
  loading,
  saving,
  error,
  isOpen,
  hasActiveOfficeBearer,
  onOpenChange,
  onRefresh,
  onCommitteeChange,
  onDesignationChange,
  onFormChange,
  onSubmit,
}: {
  member: Member
  assignments: AdminOfficeBearerAssignment[]
  committees: CommitteeRecord[]
  designations: DesignationRecord[]
  selectedCommittee: CommitteeRecord | null
  form: OfficeBearerIssueForm
  loading: boolean
  saving: boolean
  error: string
  isOpen: boolean
  hasActiveOfficeBearer: boolean
  onOpenChange: (value: boolean) => void
  onRefresh: () => void
  onCommitteeChange: (committeeId: string) => void
  onDesignationChange: (designationId: string) => void
  onFormChange: (fields: Partial<OfficeBearerIssueForm>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const activeCommittees = committees.filter((committee) => committee.status === 'active')
  const selectedActiveCommittee = selectedCommittee?.status === 'active' ? selectedCommittee : null
  const canSubmit = Boolean(selectedActiveCommittee) && Boolean(form.designationTitle.trim())

  return (
    <section id="office-bearer-issue-panel" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Office Bearer Designation
          </p>
          <h2 className="mt-2 text-lg font-black text-slate-950">
            Issue designation and office bearer card
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Assign this approved member to an active committee. After saving, the office bearer card and QR verification use the same official designation record.
          </p>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            to="/admin/members/$id/designation-card"
            params={{ id: member.id }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold !text-white no-underline shadow-sm ring-1 ring-amber-300/40 transition hover:bg-emerald-900 hover:!text-white"
            style={{ color: '#ffffff' }}
          >
            <BadgeCheck className="h-4 w-4 text-amber-300" />
            Open Card
          </Link>

          <button
            type="button"
            onClick={() => onOpenChange(!isOpen)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-100"
          >
            <BriefcaseBusiness className="h-4 w-4" />
            {isOpen ? 'Close Form' : 'Issue New'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
                Current designations
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Active designation is required for a valid office bearer card.
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                hasActiveOfficeBearer
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                  : 'bg-amber-50 text-amber-900 ring-amber-200'
              }`}
            >
              {hasActiveOfficeBearer ? 'Active Card Ready' : 'No Active Card'}
            </span>
          </div>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white p-4 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              Loading office bearer assignments...
            </div>
          ) : assignments.length ? (
            <div className="mt-4 grid gap-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-black text-slate-950">
                        {assignment.designation_title}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {assignment.committee?.name ?? 'Committee not found'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {assignment.committee
                          ? `${getCommitteeTypeLabel(assignment.committee.committee_type)} · ${getCommitteeLocationLabel(assignment.committee)}`
                          : 'Committee details unavailable'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${getCommitteeStatusClass(
                        assignment.status,
                      )}`}
                    >
                      {getCommitteeStatusLabel(assignment.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
                    <span>Start: {formatCommitteeDate(assignment.tenure_start)}</span>
                    <span>End: {formatCommitteeDate(assignment.tenure_end)}</span>
                    <span>Order: {assignment.sort_order}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignment.committee ? (
                      <Link
                        to="/admin/committees/$id"
                        params={{ id: assignment.committee.id }}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:bg-slate-50"
                      >
                        Manage Committee
                      </Link>
                    ) : null}
                    {assignment.status === 'active' ? (
                      <Link
                        to="/admin/members/$id/designation-card"
                        params={{ id: member.id }}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-900 px-3 text-xs font-black !text-white no-underline shadow-sm transition hover:bg-emerald-800"
                        style={{ color: '#ffffff' }}
                      >
                        Open Office Bearer Card
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-slate-600 ring-1 ring-slate-200">
              No office bearer designation has been issued to this approved member yet. Use the quick form to assign one.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-black">Quick issue process</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 font-semibold">
            <li>Select an active committee.</li>
            <li>Select or type the designation title.</li>
            <li>Save to activate the office bearer card.</li>
          </ol>
          <p className="mt-3 text-xs font-semibold text-amber-800">
            Member must remain approved and the assigned committee must stay active for QR verification to remain valid.
          </p>
        </div>
      </div>

      {isOpen ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AdminEditInput label="Committee" required>
              <select
                value={form.committeeId}
                onChange={(event) => onCommitteeChange(event.target.value)}
                className="admin-edit-input"
              >
                <option value="">Select active committee</option>
                {activeCommittees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.name} · {getCommitteeLocationLabel(committee)}
                  </option>
                ))}
              </select>
            </AdminEditInput>

            <AdminEditInput label="Designation" required>
              <select
                value={form.designationId}
                onChange={(event) => onDesignationChange(event.target.value)}
                className="admin-edit-input"
                disabled={!selectedActiveCommittee}
              >
                <option value="">Select designation</option>
                {designations.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.title}
                  </option>
                ))}
              </select>
            </AdminEditInput>

            <AdminEditInput label="Designation title" required>
              <input
                value={form.designationTitle}
                onChange={(event) => onFormChange({ designationTitle: event.target.value })}
                className="admin-edit-input"
                placeholder="e.g. District President"
              />
            </AdminEditInput>

            <AdminEditInput label="Status" required>
              <select
                value={form.status}
                onChange={(event) => onFormChange({ status: event.target.value as CommitteeStatus })}
                className="admin-edit-input"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
                <option value="resigned">Resigned</option>
              </select>
            </AdminEditInput>

            <AdminEditInput label="Display order" required>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => onFormChange({ sortOrder: event.target.value })}
                className="admin-edit-input"
              />
            </AdminEditInput>

            <AdminEditInput label="Tenure start">
              <input
                type="date"
                value={form.tenureStart}
                onChange={(event) => onFormChange({ tenureStart: event.target.value })}
                className="admin-edit-input"
              />
            </AdminEditInput>

            <AdminEditInput label="Tenure end">
              <input
                type="date"
                value={form.tenureEnd}
                onChange={(event) => onFormChange({ tenureEnd: event.target.value })}
                className="admin-edit-input"
              />
            </AdminEditInput>

            <AdminEditInput label="Appointment notes" wide>
              <textarea
                value={form.appointmentNotes}
                onChange={(event) => onFormChange({ appointmentNotes: event.target.value })}
                className="admin-edit-input min-h-24"
                placeholder="Optional CWC/committee approval note."
              />
            </AdminEditInput>
          </div>

          {activeCommittees.length === 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
              No active committee is available. Create or activate a committee first from Committees & Designations.
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit || activeCommittees.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              {saving ? 'Issuing...' : 'Issue Designation'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

function AdminMemberEditPanel({
  form,
  errors,
  photoPreview,
  selectedPhotoName,
  saving,
  onChange,
  onPhotoChange,
  onSubmit,
  onCancel,
}: {
  form: AdminEditFormState
  errors: AdminEditErrors
  photoPreview: string | null
  selectedPhotoName: string
  saving: boolean
  onChange: <K extends keyof AdminEditFormState>(
    field: K,
    value: AdminEditFormState[K],
  ) => void
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  return (
    <section id="office-bearer-issue-panel" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-200 sm:p-6 md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            Admin Edit Mode
          </p>
          <h2 className="mt-2 text-lg font-black text-slate-950">
            Edit pending application
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Update member details before approval. Member number, review status and approval fields are still controlled by the review workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
        <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="aspect-[4/5] w-full object-contain bg-slate-50"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-slate-400">
                <ImageOff className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Replace profile photo
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPhotoChange}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              PNG, JPG or WebP only. Maximum 2MB. {selectedPhotoName ? `Selected: ${selectedPhotoName}` : ''}
            </p>
            {errors.photo ? <p className="mt-2 text-xs font-bold text-red-700">{errors.photo}</p> : null}
          </div>
        </div>

        <AdminEditGroup title="Identity">
          <AdminEditInput label="Full name" error={errors.fullName} required>
            <input
              value={form.fullName}
              onChange={(event) => onChange('fullName', event.target.value)}
              className="admin-edit-input"
              aria-invalid={Boolean(errors.fullName)}
            />
          </AdminEditInput>
          <AdminEditInput label="Father name" error={errors.fatherName} required>
            <input
              value={form.fatherName}
              onChange={(event) => onChange('fatherName', event.target.value)}
              className="admin-edit-input"
              aria-invalid={Boolean(errors.fatherName)}
            />
          </AdminEditInput>
          <AdminEditInput label="CNIC" error={errors.cnic} required>
            <input
              value={form.cnic}
              onChange={(event) => onChange('cnic', formatCnicInput(event.target.value))}
              className="admin-edit-input"
              inputMode="numeric"
              aria-invalid={Boolean(errors.cnic)}
            />
          </AdminEditInput>
          <AdminEditInput label="Mobile" error={errors.mobile} required>
            <input
              value={form.mobile}
              onChange={(event) => onChange('mobile', formatMobileInput(event.target.value))}
              className="admin-edit-input"
              inputMode="tel"
              aria-invalid={Boolean(errors.mobile)}
            />
          </AdminEditInput>
        </AdminEditGroup>

        <AdminEditGroup title="Location">
          <AdminEditInput label="District" error={errors.district} required>
            <input
              value={form.district}
              onChange={(event) => onChange('district', event.target.value)}
              className="admin-edit-input"
              aria-invalid={Boolean(errors.district)}
            />
          </AdminEditInput>
          <AdminEditInput label="Taluka" error={errors.taluka} required>
            <input
              value={form.taluka}
              onChange={(event) => onChange('taluka', event.target.value)}
              className="admin-edit-input"
              aria-invalid={Boolean(errors.taluka)}
            />
          </AdminEditInput>
          <AdminEditInput label="Address" error={errors.address} required wide>
            <textarea
              value={form.address}
              onChange={(event) => onChange('address', event.target.value)}
              className="admin-edit-input min-h-24"
              aria-invalid={Boolean(errors.address)}
            />
          </AdminEditInput>
        </AdminEditGroup>

        <AdminEditGroup title="Profile">
          <AdminEditInput label="Date of birth" error={errors.dateOfBirth}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => onChange('dateOfBirth', event.target.value)}
              className="admin-edit-input"
              max={todayDate()}
              aria-invalid={Boolean(errors.dateOfBirth)}
            />
          </AdminEditInput>
          <AdminEditInput label="Gender">
            <input
              value={form.gender}
              onChange={(event) => onChange('gender', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Education">
            <input
              value={form.education}
              onChange={(event) => onChange('education', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Blood group">
            <input
              value={form.bloodGroup}
              onChange={(event) => onChange('bloodGroup', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Profession">
            <input
              value={form.profession}
              onChange={(event) => onChange('profession', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Caste / branch">
            <input
              value={form.casteBranch}
              onChange={(event) => onChange('casteBranch', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
        </AdminEditGroup>

        <AdminEditGroup title="Emergency contact">
          <AdminEditInput label="Contact name">
            <input
              value={form.emergencyContactName}
              onChange={(event) => onChange('emergencyContactName', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Relation">
            <input
              value={form.emergencyContactRelation}
              onChange={(event) => onChange('emergencyContactRelation', event.target.value)}
              className="admin-edit-input"
            />
          </AdminEditInput>
          <AdminEditInput label="Contact mobile" error={errors.emergencyContactMobile}>
            <input
              value={form.emergencyContactMobile}
              onChange={(event) => onChange('emergencyContactMobile', formatMobileInput(event.target.value))}
              className="admin-edit-input"
              inputMode="tel"
              aria-invalid={Boolean(errors.emergencyContactMobile)}
            />
          </AdminEditInput>
        </AdminEditGroup>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">
          <input
            type="checkbox"
            checked={form.declarationAccepted}
            onChange={(event) => onChange('declarationAccepted', event.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-700"
          />
          Declaration accepted by the member / verified by admin.
        </label>
        {errors.declarationAccepted ? (
          <p className="text-xs font-bold text-red-700">{errors.declarationAccepted}</p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </form>
    </section>
  )
}

function AdminEditGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function AdminEditInput({
  label,
  children,
  error,
  required,
  wide,
}: {
  label: string
  children: ReactNode
  error?: string
  required?: boolean
  wide?: boolean
}) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}{required ? ' *' : ''}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-red-700">{error}</span> : null}
    </label>
  )
}

function BackToAdmin() {
  const { copy, iconBeforeClass } = useAdminMemberDetailCopy()

  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 no-underline hover:text-emerald-800"
    >
      <ArrowLeft className={`h-4 w-4 ${iconBeforeClass}`} />
      {copy.backToAdmin}
    </Link>
  )
}

function MemberPhoto({ src, alt }: { src: string | null; alt: string }) {
  const { copy } = useAdminMemberDetailCopy()

  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
        <div className="text-center">
          <ImageOff className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2">{copy.sidebar.noPhoto}</p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${alt} profile photo`}
      className="aspect-square w-full rounded-2xl object-contain bg-slate-50 ring-1 ring-slate-200"
    />
  )
}

function StatusPanel({ member }: { member: Member }) {
  const { copy } = useAdminMemberDetailCopy()

  const config: Record<
    MemberStatus,
    {
      title: string
      text: string
      className: string
      icon: ReactNode
    }
  > = {
    pending: {
      title: copy.status.pendingTitle,
      text: copy.status.pendingText,
      className: 'bg-amber-50 text-amber-900 ring-amber-100',
      icon: <Hourglass className="h-5 w-5 text-amber-700" />,
    },
    approved: {
      title: copy.status.approvedTitle,
      text: member.member_no
        ? copy.status.approvedTextIssued.replace('{{memberNo}}', member.member_no)
        : copy.status.approvedTextMissing,
      className: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
      icon: <BadgeCheck className="h-5 w-5 text-emerald-700" />,
    },
    rejected: {
      title: copy.status.rejectedTitle,
      text:
        member.rejection_reason ||
        copy.status.rejectedText,
      className: 'bg-red-50 text-red-900 ring-red-100',
      icon: <XCircle className="h-5 w-5 text-red-700" />,
    },
  }

  const item = config[member.status]

  return (
    <section className={`rounded-3xl p-5 ring-1 ${item.className}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">{item.icon}</div>
        <div>
          <h2 className="text-base font-black">{item.title}</h2>
          <p className="mt-1 text-sm leading-6">{item.text}</p>
        </div>
      </div>
    </section>
  )
}


function ReviewChecklist({ member }: { member: Member }) {
  const checks = [
    {
      label: 'Photo',
      ready: Boolean(member.photo_url),
      text: member.photo_url ? 'Photo uploaded.' : 'Photo is missing.',
    },
    {
      label: 'CNIC & mobile',
      ready: Boolean(member.cnic && member.mobile),
      text: 'CNIC and mobile number should be verified before approval.',
    },
    {
      label: 'Area',
      ready: Boolean(member.district && member.taluka),
      text: member.taluka
        ? `${member.district} / ${member.taluka}`
        : 'Taluka is missing or not selected.',
    },
    {
      label: 'Declaration',
      ready: member.declaration_accepted,
      text: member.declaration_accepted
        ? 'Member accepted declaration.'
        : 'Declaration is not accepted.',
    },
  ]

  return (
    <div className="admin-member-checklist mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-950">
            Approval verification checklist
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-900/75">
            Review profile details, payment receipt and identity information before approval.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-emerald-100">
          Manual Review
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                  check.ready
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {check.ready ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{check.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-member-payment-note mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Payment receipt/status should be confirmed from the membership payment record before final approval.
          </p>
        </div>
      </div>
    </div>
  )
}


function MembershipPaymentPanel({
  payment,
  receiptSignedUrl,
  loadError,
  adminNote,
  onAdminNoteChange,
  onStatusUpdate,
  onReceiptUpload,
  actionLoading,
  receiptUploading,
  canEditReceipt,
}: {
  payment: MembershipPayment | null
  receiptSignedUrl: string | null
  loadError: string
  adminNote: string
  onAdminNoteChange: (value: string) => void
  onStatusUpdate: (status: MembershipPaymentStatus) => void
  onReceiptUpload: (file: File) => void
  actionLoading: boolean
  receiptUploading: boolean
  canEditReceipt: boolean
}) {
  const status = getMembershipPaymentDisplayStatus(payment)
  const paymentFinal = status === 'paid' || status === 'waived'
  const canUpdate = Boolean(payment) && !actionLoading
  const canUploadReceipt =
    canEditReceipt &&
    !receiptUploading &&
    (!payment || payment.status === 'pending' || payment.status === 'failed') &&
    !paymentFinal
  const receiptLabel = payment?.receipt_file_name || (payment?.receipt_path ? 'Uploaded' : 'Not uploaded')

  return (
    <section className="admin-member-payment-panel rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Membership Fee
          </p>
          <h2 className="mt-2 text-lg font-black text-slate-950">
            Payment Receipt & Verification
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Confirm the manual payment record and receipt before final approval.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${getMembershipPaymentStatusClass(
            status,
          )}`}
        >
          {getMembershipPaymentStatusLabel(status)}
        </span>
      </div>

      {loadError ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {loadError}
        </div>
      ) : null}

      {!payment ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          <p>No membership payment record found for this application.</p>
          <label
            className={`mt-4 inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold shadow-sm transition ${
              canUploadReceipt
                ? 'cursor-pointer border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'cursor-not-allowed border-slate-200 bg-white text-slate-400'
            }`}
          >
            {receiptUploading ? 'Uploading...' : 'Upload Receipt & Create Pending Payment'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={!canUploadReceipt}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) onReceiptUpload(file)
              }}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="Base Fee" value={formatMembershipMoney(payment.base_amount)} />
            <InfoItem label="Tax / Charges" value={formatMembershipMoney(payment.tax_amount)} />
            <InfoItem label="Total Amount" value={`${formatMembershipMoney(payment.total_amount)} ${payment.currency}`} />
            <InfoItem label="Payment Method" value={formatPaymentMethod(payment)} />
            <InfoItem label="Gateway / Account" value={formatGatewayProvider(payment)} />
            <InfoItem label="Gateway Reference" value={payment.gateway_reference} />
            <InfoItem label="Receipt File" value={receiptLabel} />
            <InfoItem label="Receipt Uploaded" value={formatDate(payment.receipt_uploaded_at, true)} />
            <InfoItem label="Paid At" value={formatDate(payment.paid_at, true)} />
            <InfoItem label="Last Updated" value={formatDate(payment.updated_at, true)} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.45fr)]">
            <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-500">
                Admin Note
              </span>
              <textarea
                value={adminNote}
                onChange={(event) => onAdminNoteChange(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Optional note about payment verification."
              />
            </label>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{getMembershipPaymentQrHelpText()}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Payment Receipt</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {payment.receipt_path
                  ? receiptSignedUrl
                    ? 'Private receipt link is ready for admin review.'
                    : 'Receipt file not available.'
                  : 'No receipt was uploaded with this payment record.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <label
                className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold shadow-sm transition ${
                  canUploadReceipt
                    ? 'cursor-pointer border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {receiptUploading ? 'Uploading...' : payment?.receipt_path ? 'Replace Receipt' : 'Upload Receipt'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  disabled={!canUploadReceipt}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file) onReceiptUpload(file)
                  }}
                  className="sr-only"
                />
              </label>

              {!canUploadReceipt && paymentFinal ? (
                <span className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800">
                  Final payment locked
                </span>
              ) : null}

              {receiptSignedUrl ? (
                <a
                  href={receiptSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold !text-white no-underline shadow-sm transition hover:bg-slate-800 hover:!text-white"
                  style={{ color: '#ffffff' }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Receipt
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => onStatusUpdate('pending')}
                disabled={!canUpdate || status === 'pending'}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark Pending
              </button>
              <button
                type="button"
                onClick={() => onStatusUpdate('paid')}
                disabled={!canUpdate || status === 'paid'}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Mark Paid'}
              </button>
              <button
                type="button"
                onClick={() => onStatusUpdate('waived')}
                disabled={!canUpdate || status === 'waived'}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-900 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark Waived
              </button>
              <button
                type="button"
                onClick={() => onStatusUpdate('failed')}
                disabled={!canUpdate || status === 'failed'}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-900 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark Failed
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}


function AlertBox({
  tone,
  icon,
  children,
}: {
  tone: 'error' | 'success'
  icon: ReactNode
  children: ReactNode
}) {
  const classes =
    tone === 'error'
      ? 'bg-red-50 text-red-700 ring-red-100'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-100'

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-medium ring-1 ${classes}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-all text-sm font-black text-slate-950">
            {value}
          </p>
        </div>

        <span className="text-emerald-700">{icon}</span>
      </div>
    </div>
  )
}

function DetailGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
        <FileCheck2 className="h-4 w-4 text-emerald-700" />
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string | null | undefined
  wide?: boolean
}) {
  const { copy } = useAdminMemberDetailCopy()

  return (
    <div
      className={`rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 ${
        wide ? 'md:col-span-2' : ''
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || <span className="font-medium text-slate-400">{copy.notProvided}</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const { copy } = useAdminMemberDetailCopy()

  const config: Record<
    MemberStatus,
    {
      icon: ReactNode
      className: string
      text: string
    }
  > = {
    pending: {
      icon: <Hourglass className="h-3.5 w-3.5" />,
      className: 'bg-amber-50 text-amber-700 ring-amber-200',
      text: copy.status.pending,
    },
    approved: {
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      text: copy.status.approved,
    },
    rejected: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'bg-red-50 text-red-700 ring-red-200',
      text: copy.status.rejected,
    },
  }

  const item = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${item.className}`}
    >
      {item.icon}
      {item.text}
    </span>
  )
}

async function ensureAdminAccess(): Promise<AdminAccessResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, redirectTo: '/login' }
  }

  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('id, role')
    .eq('user_id', user.id)
    .in('role', MEMBERSHIP_REVIEW_ROLES)
    .limit(1)

  if (roleError || !roles?.length) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  return { ok: true }
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Unable to get access token.')
  }

  return session.access_token
}

async function createSignedPhotoUrl(photoPath: string | null) {
  if (!photoPath) return null

  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null

  return data.signedUrl
}


async function createSignedReceiptUrl(receiptPath: string | null | undefined) {
  if (!receiptPath) return null

  const { data, error } = await supabase.storage
    .from(MEMBERSHIP_RECEIPT_BUCKET)
    .createSignedUrl(receiptPath, RECEIPT_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null

  return data.signedUrl
}

async function fetchMembershipPaymentByMemberId(memberId: string) {
  const { data, error } = await supabase
    .from('membership_payments')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<MembershipPayment | null>()

  if (error) throw error

  return data
}

async function fetchMembershipPaymentWithReceiptUrl(memberId: string): Promise<{
  payment: MembershipPayment | null
  receiptSignedUrl: string | null
  errorMessage?: string
}> {
  try {
    const payment = await fetchMembershipPaymentByMemberId(memberId)
    const receiptSignedUrl = await createSignedReceiptUrl(payment?.receipt_path)

    return {
      payment,
      receiptSignedUrl,
      errorMessage:
        payment?.receipt_path && !receiptSignedUrl
          ? 'Receipt file not available.'
          : undefined,
    }
  } catch (err) {
    return {
      payment: null,
      receiptSignedUrl: null,
      errorMessage:
        err instanceof Error
          ? `Payment record could not be loaded: ${err.message}`
          : 'Payment record could not be loaded.',
    }
  }
}


async function fetchOfficeBearerAssignments(memberId: string) {
  const { data, error } = await supabase
    .from('organization_committee_members' as never)
    .select([
      'id',
      'committee_id',
      'member_id',
      'designation_id',
      'designation_title',
      'status',
      'sort_order',
      'tenure_start',
      'tenure_end',
      'appointment_notes',
      'member_no_snapshot',
      'full_name_snapshot',
      'father_name_snapshot',
      'district_snapshot',
      'taluka_snapshot',
      'created_at',
      'updated_at',
    ].join(', '))
    .eq('member_id' as never, memberId as never)
    .order('status', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  const assignments = (data ?? []) as unknown as CommitteeMemberRecord[]
  const committeeIds = Array.from(new Set(assignments.map((item) => item.committee_id)))

  if (!committeeIds.length) return []

  const { data: committeeData, error: committeeError } = await supabase
    .from('organization_committees' as never)
    .select([
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
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ].join(', '))
    .in('id' as never, committeeIds as never)

  if (committeeError) throw committeeError

  const committeeMap = new Map(
    ((committeeData ?? []) as unknown as CommitteeRecord[]).map((committee) => [
      committee.id,
      committee,
    ]),
  )

  return assignments.map((assignment) => ({
    ...assignment,
    committee: committeeMap.get(assignment.committee_id) ?? null,
  }))
}

function memberToCommitteeSearchResult(member: Member): MemberSearchResult {
  return {
    id: member.id,
    full_name: member.full_name,
    father_name: member.father_name,
    member_no: member.member_no,
    district: member.district,
    taluka: member.taluka,
    mobile: member.mobile,
    status: member.status,
  }
}

async function fetchMemberById(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error

  return data as Member | null
}

function memberToAdminEditForm(member: Member): AdminEditFormState {
  return {
    fullName: member.full_name,
    fatherName: member.father_name,
    cnic: member.cnic,
    mobile: member.mobile,
    district: member.district,
    taluka: member.taluka ?? '',
    address: member.address ?? '',
    dateOfBirth: member.date_of_birth ?? '',
    gender: member.gender ?? '',
    education: member.education ?? '',
    bloodGroup: member.blood_group ?? '',
    profession: member.profession ?? '',
    casteBranch: member.caste_branch ?? '',
    emergencyContactName: member.emergency_contact_name ?? '',
    emergencyContactRelation: member.emergency_contact_relation ?? '',
    emergencyContactMobile: member.emergency_contact_mobile ?? '',
    declarationAccepted: member.declaration_accepted,
  }
}

function validateAdminEditForm(form: AdminEditFormState) {
  const errors: AdminEditErrors = {}
  const normalizedMobile = normalizeMobile(form.mobile)
  const normalizedEmergencyMobile = normalizeMobile(form.emergencyContactMobile)

  if (!form.fullName.trim() || form.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.'
  }

  if (!form.fatherName.trim() || form.fatherName.trim().length < 3) {
    errors.fatherName = 'Father name must be at least 3 characters.'
  }

  if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(form.cnic.trim())) {
    errors.cnic = 'CNIC must use 12345-1234567-1 format.'
  }

  if (!isPakistaniMobile(normalizedMobile)) {
    errors.mobile = 'Enter a valid Pakistani mobile number.'
  }

  if (!form.district.trim()) {
    errors.district = 'District is required.'
  }

  if (!form.taluka.trim()) {
    errors.taluka = 'Taluka is required.'
  }

  if (!form.address.trim() || form.address.trim().length < 10) {
    errors.address = 'Address must be at least 10 characters.'
  }

  if (form.dateOfBirth && form.dateOfBirth > todayDate()) {
    errors.dateOfBirth = 'Date of birth cannot be in the future.'
  }

  if (normalizedEmergencyMobile && !isPakistaniMobile(normalizedEmergencyMobile)) {
    errors.emergencyContactMobile = 'Enter a valid emergency mobile number.'
  }

  if (!form.declarationAccepted) {
    errors.declarationAccepted = 'Declaration must be accepted before approval.'
  }

  return errors
}

function getStatusLabel(
  status: MemberStatus,
  copy?: ReturnType<typeof useAdminMemberDetailCopy>['copy'],
) {
  switch (status) {
    case 'approved':
      return copy?.status.approved ?? 'Approved'
    case 'rejected':
      return copy?.status.rejected ?? 'Rejected'
    default:
      return copy?.status.pending ?? 'Pending'
  }
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return withTime
    ? date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function formatCnic(value: string | null | undefined) {
  if (!value) return 'N/A'

  const digits = value.replace(/\D/g, '')

  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
  }

  return value
}

function formatMobile(value: string | null | undefined) {
  if (!value) return 'N/A'

  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return digits
  }

  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`
  }

  return value
}

function formatPaymentMethod(payment: MembershipPayment) {
  return prettifyPaymentValue(payment.payment_method)
}

function formatGatewayProvider(payment: MembershipPayment) {
  const provider = payment.gateway_provider || payment.payment_method

  return prettifyPaymentValue(provider)
}

function prettifyPaymentValue(value: string | null | undefined) {
  if (!value) return null

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

