import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useI18n, type TranslationKey } from '../lib/i18n'
import { supabase } from '../lib/supabase/client'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_MANUAL_PAYMENT_DETAILS,
  MEMBERSHIP_PAYMENT_QR_IMAGE_PATH,
  MEMBERSHIP_RECEIPT_ALLOWED_TYPES,
  MEMBERSHIP_RECEIPT_BUCKET,
  MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES,
  MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL,
  type MembershipPayment,
  createPendingMembershipPaymentPayload,
  formatMembershipMoney,
} from '../lib/membership-fee'
import {
  formatCnicInput,
  formatMobileInput,
  isPakistaniMobile,
  normalizeMobile,
  optionalText,
  todayDate,
} from '../lib/shared/formatters'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const REGISTER_DRAFT_VERSION = 1

const sindhDistricts = [
  'Badin',
  'Dadu',
  'Ghotki',
  'Hyderabad',
  'Jacobabad',
  'Jamshoro',
  'Karachi Central',
  'Karachi East',
  'Karachi South',
  'Karachi West',
  'Kashmore',
  'Keamari',
  'Khairpur',
  'Korangi',
  'Larkana',
  'Malir',
  'Matiari',
  'Mirpur Khas',
  'Naushahro Firoze',
  'Qambar Shahdadkot',
  'Sanghar',
  'Shaheed Benazirabad',
  'Shikarpur',
  'Sujawal',
  'Sukkur',
  'Tando Allahyar',
  'Tando Muhammad Khan',
  'Tharparkar',
  'Thatta',
  'Umerkot',
]

const talukasByDistrict: Record<string, string[]> = {
  Badin: [
    'Badin',
    'Matli',
    'Shaheed Fazil Rahu (Golarchi)',
    'Talhar',
    'Tando Bago',
  ],
  Sujawal: ['Jati', 'Kharo Chan', 'Mirpur Bathoro', 'Shah Bunder', 'Sujawal'],
  Thatta: ['Ghorabari', 'Keti Bunder', 'Mirpur Sakro', 'Thatta'],
  Dadu: ['Dadu', 'Johi', 'Khairpur Nathan Shah', 'Mehar'],
  Hyderabad: ['Hyderabad City', 'Hyderabad Rural', 'Latifabad', 'Qasimabad'],
  Jamshoro: ['Kotri', 'Manjhand', 'Sehwan Sharif', 'Thano Bula Khan'],
  Matiari: ['Hala', 'Matiari', 'Saeedabad'],
  'Tando Allahyar': ['Chamber', 'Jhando Mari', 'Tando Allahyar'],
  'Tando Muhammad Khan': [
    'Bulri Shah Karim',
    'Tando Ghulam Hyder',
    'Tando Muhammad Khan',
  ],
  'Karachi Central': [
    'Gulberg',
    'Liaquatabad',
    'Nazimabad',
    'New Karachi',
    'North Nazimabad',
  ],
  'Karachi East': [
    'Ferozabad',
    'Gulshan-e-Iqbal',
    'Gulzar-e-Hijri',
    'Jamshed Quarters',
  ],
  'Karachi South': ['Aram Bagh', 'Civil Line', 'Garden', 'Lyari', 'Saddar'],
  'Karachi West': ['Mango Pir', 'Mominabad', 'Orangi'],
  Keamari: ['Baldia', 'Harbour', 'Mauripur', 'SITE'],
  Korangi: ['Korangi', 'Landhi', 'Model Colony', 'Shah Faisal'],
  Malir: [
    'Airport',
    'Bin Qasim',
    'Gadap',
    'Ibrahim Hyderi',
    'Murad Memon',
    'Shah Murad',
  ],
  Jacobabad: ['Garhi Khairo', 'Jacobabad', 'Thul'],
  Kashmore: ['Kandhkot', 'Kashmore', 'Tangwani'],
  Larkana: ['Bakrani', 'Dokri', 'Larkana', 'Ratodero'],
  'Qambar Shahdadkot': [
    'Mirokhan',
    'Nasirabad',
    'Qambar',
    'Qubo Saeed Khan',
    'Shahdadkot',
    'Sijawal Junejo',
    'Warah',
  ],
  Shikarpur: ['Garhi Yasin', 'Khanpur', 'Lakhi Ghulam Shah', 'Shikarpur'],
  'Mirpur Khas': [
    'Digri',
    'Hussain Bux Mari',
    'Jhuddo',
    'Kot Ghulam Muhammad',
    'Mirpur Khas',
    'Shujabad',
    'Sindhri',
  ],
  Tharparkar: [
    'Chachro',
    'Dahli',
    'Diplo',
    'Islamkot',
    'Kaloi',
    'Mithi',
    'Nagarparkar',
  ],
  Umerkot: ['Kunri', 'Pithoro', 'Samaro', 'Umerkot'],
  'Naushahro Firoze': [
    'Bhiria',
    'Kandiaro',
    'Mehrabpur',
    'Moro',
    'Naushahro Firoze',
  ],
  Sanghar: [
    'Jam Nawaz Ali',
    'Khipro',
    'Sanghar',
    'Shahdadpur',
    'Sinjhoro',
    'Tando Adam',
  ],
  'Shaheed Benazirabad': ['Daur', 'Nawabshah', 'Qazi Ahmed', 'Sakrand'],
  Ghotki: ['Daharki', 'Ghotki', 'Khangarh', 'Mirpur Mathelo', 'Ubauro'],
  Khairpur: [
    'Faiz Ganj',
    'Gambat',
    'Khairpur',
    'Kingri',
    'Kot Diji',
    'Mirwah',
    'Nara',
    'Sobhodero',
  ],
  Sukkur: ['New Sukkur', 'Pano Aqil', 'Rohri', 'Salehpat', 'Sukkur City'],
}

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

type MemberStatus = 'pending' | 'approved' | 'rejected'

type ExistingMember = {
  id: string
  status: MemberStatus
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
  photo_url: string
}

type RegisterFormState = {
  fullName: string
  fatherName: string
  cnic: string
  mobile: string
  district: string
  taluka: string
  profession: string
  casteBranch: string
  address: string
  dateOfBirth: string
  gender: string
  education: string
  bloodGroup: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactMobile: string
  declarationAccepted: boolean
}

type FormField = keyof RegisterFormState | 'photo' | 'paymentReceipt'

type FieldErrors = Partial<Record<FormField, string>>

const initialForm: RegisterFormState = {
  fullName: '',
  fatherName: '',
  cnic: '',
  mobile: '',
  district: '',
  taluka: '',
  profession: '',
  casteBranch: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  education: '',
  bloodGroup: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactMobile: '',
  declarationAccepted: false,
}

const formSteps: Array<{
  titleKey: TranslationKey
  shortTitleKey: TranslationKey
  descriptionKey: TranslationKey
  fields: FormField[]
}> = [
  {
    titleKey: 'register.step.identity.title',
    shortTitleKey: 'register.step.identity.short',
    descriptionKey: 'register.step.identity.desc',
    fields: ['fullName', 'fatherName', 'cnic', 'mobile'],
  },
  {
    titleKey: 'register.step.location.title',
    shortTitleKey: 'register.step.location.short',
    descriptionKey: 'register.step.location.desc',
    fields: ['district', 'taluka', 'address'],
  },
  {
    titleKey: 'register.step.profile.title',
    shortTitleKey: 'register.step.profile.short',
    descriptionKey: 'register.step.profile.desc',
    fields: ['profession', 'casteBranch', 'dateOfBirth', 'gender', 'education', 'bloodGroup'],
  },
  {
    titleKey: 'register.step.emergency.title',
    shortTitleKey: 'register.step.emergency.short',
    descriptionKey: 'register.step.emergency.desc',
    fields: ['emergencyContactName', 'emergencyContactRelation', 'emergencyContactMobile'],
  },
  {
    titleKey: 'register.step.submit.title',
    shortTitleKey: 'register.step.submit.short',
    descriptionKey: 'register.step.submit.desc',
    fields: ['photo', 'paymentReceipt', 'declarationAccepted'],
  },
]

function RegisterPage() {
  const navigate = useNavigate()
  const { t, direction } = useI18n()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')
  const [existingMember, setExistingMember] = useState<ExistingMember | null>(null)
  const [existingMembershipPayment, setExistingMembershipPayment] =
    useState<MembershipPayment | null>(null)

  const [form, setForm] = useState<RegisterFormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [currentStep, setCurrentStep] = useState(0)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoSignedUrl, setExistingPhotoSignedUrl] = useState<string | null>(null)
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [draftSavedAt, setDraftSavedAt] = useState('')

  const locked = existingMember?.status === 'approved'
  const isPendingEdit = existingMember?.status === 'pending'
  const isRejected = existingMember?.status === 'rejected'
  const paymentReceiptLocked =
    existingMembershipPayment?.status === 'paid' ||
    existingMembershipPayment?.status === 'waived'
  const isLastStep = currentStep === formSteps.length - 1
  const localizedSteps = useMemo(() =>
    formSteps.map((step) => ({
      ...step,
      title: t(step.titleKey),
      shortTitle: t(step.shortTitleKey),
      description: t(step.descriptionKey),
    })),
    [t],
  )
  const currentStepData = localizedSteps[currentStep]
  const progressPercent = Math.round(((currentStep + 1) / formSteps.length) * 100)

  const talukaOptions = useMemo(() => {
    return form.district ? talukasByDistrict[form.district] || [] : []
  }, [form.district])

  const photoSrc = photoPreview || existingPhotoSignedUrl

  useEffect(() => {
    loadExisting()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  async function loadExisting() {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate({ to: '/login' })
      return
    }

    setUserId(user.id)

    const { data: rawData, error: memberError } = await supabase
      .from('members')
      .select(
        [
          'id',
          'status',
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
        ].join(', '),
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    const data = rawData as unknown as ExistingMember | null

    if (data) {
      setExistingMember(data)
      setForm(memberToForm(data))

      const { data: paymentData } = await supabase
        .from('membership_payments')
        .select('*')
        .eq('member_id', data.id)
        .maybeSingle()
        .returns<MembershipPayment | null>()

      setExistingMembershipPayment(paymentData ?? null)

      if (data.photo_url) {
        const { data: signed } = await supabase.storage
          .from('member-photos')
          .createSignedUrl(data.photo_url, 60 * 60)

        setExistingPhotoSignedUrl(signed?.signedUrl ?? null)
      }
    } else {
      const draft = readDraft(user.id)

      if (draft) {
        setForm({ ...initialForm, ...draft.form })
        setDraftSavedAt(draft.savedAt)
      }
    }

    setLoading(false)
  }

  function updateField<K extends keyof RegisterFormState>(
    field: K,
    value: RegisterFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }

    setError('')
    setSuccess('')
  }

  function handleDistrictChange(value: string) {
    setForm((current) => ({
      ...current,
      district: value,
      taluka: '',
    }))

    setFieldErrors((current) => {
      const next = { ...current }
      delete next.district
      delete next.taluka
      return next
    })

    setError('')
    setSuccess('')
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    setSuccess('')

    const file = event.target.files?.[0] ?? null
    setPhoto(null)

    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }

    if (!file) return

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setFieldErrors((current) => ({
        ...current,
        photo: t('register.photo.hint'),
      }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        photo: t('register.photo.hint'),
      }))
      event.target.value = ''
      return
    }

    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))

    setFieldErrors((current) => {
      const next = { ...current }
      delete next.photo
      return next
    })
  }


  function handlePaymentReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    setSuccess('')

    if (paymentReceiptLocked) {
      setError(t('register.payment.receiptLocked'))
      event.target.value = ''
      return
    }

    const file = event.target.files?.[0] ?? null
    setPaymentReceipt(null)

    if (!file) return

    if (!MEMBERSHIP_RECEIPT_ALLOWED_TYPES.includes(file.type)) {
      setFieldErrors((current) => ({
        ...current,
        paymentReceipt: t('register.payment.receiptHint').replace('{size}', MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL),
      }))
      event.target.value = ''
      return
    }

    if (file.size > MEMBERSHIP_RECEIPT_MAX_SIZE_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        paymentReceipt: t('register.payment.receiptHint').replace('{size}', MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL),
      }))
      event.target.value = ''
      return
    }

    setPaymentReceipt(file)

    setFieldErrors((current) => {
      const next = { ...current }
      delete next.paymentReceipt
      return next
    })
  }

  function validateStep(stepIndex: number) {
    const step = formSteps[stepIndex]
    const errors = validateForm()

    const stepErrors: FieldErrors = {}

    step.fields.forEach((field) => {
      if (errors[field]) {
        stepErrors[field] = errors[field]
      }
    })

    setFieldErrors((current) => ({
      ...current,
      ...stepErrors,
    }))

    return stepErrors
  }

  function handleNextStep() {
    const stepErrors = validateStep(currentStep)

    if (Object.keys(stepErrors).length > 0) {
      setError(t('register.error.fixHighlightedContinue'))
      focusFirstInvalidField()
      return
    }

    setError('')
    setSuccess('')
    setCurrentStep((step) => Math.min(step + 1, formSteps.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePreviousStep() {
    setError('')
    setSuccess('')
    setCurrentStep((step) => Math.max(step - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStepClick(targetStep: number) {
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep)
      setError('')
      setSuccess('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const stepErrors = validateStep(currentStep)

    if (Object.keys(stepErrors).length > 0) {
      setError(t('register.error.completeCurrentStep'))
      focusFirstInvalidField()
      return
    }

    setCurrentStep(targetStep)
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveDraft() {
    if (!userId || locked) return

    try {
      const savedAt = new Date().toISOString()

      localStorage.setItem(
        draftKey(userId),
        JSON.stringify({
          version: REGISTER_DRAFT_VERSION,
          savedAt,
          form,
        }),
      )

      setDraftSavedAt(savedAt)
      setSuccess(t('register.draftSaved'))
      setError('')
    } catch {
      setError(t('register.draftSaveFailed'))
    }
  }

  function clearDraft() {
    if (!userId) return

    localStorage.removeItem(draftKey(userId))
    setDraftSavedAt('')
    setSuccess(t('register.draftCleared'))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!userId) {
      setError(t('register.error.loginRequired'))
      return
    }

    if (existingMember?.status === 'approved') {
      setError(t('register.error.approvedLocked'))
      return
    }

    const allErrors = validateForm()
    setFieldErrors(allErrors)

    if (Object.keys(allErrors).length > 0) {
      const firstField = Object.keys(allErrors)[0] as FormField | undefined
      const targetStep = formSteps.findIndex(
        (step) => firstField && step.fields.includes(firstField),
      )

      if (targetStep >= 0) {
        setCurrentStep(targetStep)
      }

      setError(t('register.error.fixHighlightedSubmit'))
      focusFirstInvalidField()
      return
    }

    setSubmitting(true)

    let photoPath = existingMember?.photo_url ?? ''

    if (photo) {
      const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      photoPath = `${userId}/photo-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(photoPath, photo, {
          upsert: true,
          contentType: photo.type || 'image/jpeg',
        })

      if (uploadError) {
        setError(uploadError.message)
        setSubmitting(false)
        return
      }
    }

    let receiptPath = existingMembershipPayment?.receipt_path ?? null
    let receiptFileName = existingMembershipPayment?.receipt_file_name ?? null
    let receiptMimeType = existingMembershipPayment?.receipt_mime_type ?? null
    let receiptSizeBytes = existingMembershipPayment?.receipt_size_bytes ?? null
    let receiptUploadedAt = existingMembershipPayment?.receipt_uploaded_at ?? null

    if (paymentReceipt && paymentReceiptLocked) {
      setError(t('register.payment.receiptLocked'))
      setSubmitting(false)
      return
    }

    if (paymentReceipt) {
      const extension = paymentReceipt.name.split('.').pop()?.toLowerCase() || 'jpg'
      receiptPath = `${userId}/receipt-${Date.now()}.${extension}`
      receiptFileName = paymentReceipt.name
      receiptMimeType = paymentReceipt.type || 'application/octet-stream'
      receiptSizeBytes = paymentReceipt.size
      receiptUploadedAt = new Date().toISOString()

      const { error: receiptUploadError } = await supabase.storage
        .from(MEMBERSHIP_RECEIPT_BUCKET)
        .upload(receiptPath, paymentReceipt, {
          upsert: true,
          contentType: receiptMimeType,
        })

      if (receiptUploadError) {
        setError(receiptUploadError.message)
        setSubmitting(false)
        return
      }
    }

    const normalizedMobile = normalizeMobile(form.mobile)
    const normalizedEmergencyMobile = normalizeMobile(form.emergencyContactMobile)

    const payload = {
      full_name: form.fullName.trim(),
      father_name: form.fatherName.trim(),
      cnic: form.cnic.trim(),
      mobile: normalizedMobile,
      district: form.district,
      taluka: form.taluka,
      profession: optionalText(form.profession),
      caste_branch: optionalText(form.casteBranch),
      address: form.address.trim(),
      date_of_birth: form.dateOfBirth || null,
      gender: optionalText(form.gender),
      education: optionalText(form.education),
      blood_group: optionalText(form.bloodGroup),
      emergency_contact_name: optionalText(form.emergencyContactName),
      emergency_contact_relation: optionalText(form.emergencyContactRelation),
      emergency_contact_mobile: normalizedEmergencyMobile || null,
      declaration_accepted: form.declarationAccepted,
      photo_url: photoPath,
    }

    let savedMemberId = existingMember?.id ?? ''

    if (existingMember) {
      const updatePayload =
        existingMember.status === 'rejected'
          ? {
              ...payload,
              status: 'pending' as const,
              rejection_reason: null,
            }
          : payload

      const { error: updateError } = await supabase
        .from('members')
        .update(updatePayload)
        .eq('id', existingMember.id)

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data: insertedMember, error: insertError } = await supabase
        .from('members')
        .insert({
          user_id: userId,
          ...payload,
          status: 'pending',
        })
        .select('id, user_id')
        .single()

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }

      savedMemberId = insertedMember.id
    }

    if (savedMemberId) {
      const paymentAlreadyFinal =
        existingMembershipPayment?.status === 'paid' ||
        existingMembershipPayment?.status === 'waived'

      if (!paymentAlreadyFinal) {
        const paymentPayload = createPendingMembershipPaymentPayload(
          savedMemberId,
          userId,
          {
            receipt_path: receiptPath,
            receipt_file_name: receiptFileName,
            receipt_mime_type: receiptMimeType,
            receipt_size_bytes: receiptSizeBytes,
            receipt_uploaded_at: receiptUploadedAt,
          },
        )

        const { error: paymentError } = await supabase
          .from('membership_payments')
          .upsert(paymentPayload, { onConflict: 'member_id' })

        if (paymentError) {
          setError(paymentError.message)
          setSubmitting(false)
          return
        }
      }
    }

    localStorage.removeItem(draftKey(userId))
    setDraftSavedAt('')
    setSubmitting(false)

    setSuccess(
      existingMember
        ? t('register.success.updated')
        : t('register.success.submitted'),
    )

    window.setTimeout(() => {
      navigate({ to: '/dashboard' })
    }, 650)
  }

  function validateForm() {
    const errors: FieldErrors = {}
    const normalizedMobile = normalizeMobile(form.mobile)
    const normalizedEmergencyMobile = normalizeMobile(form.emergencyContactMobile)

    if (!form.fullName.trim()) {
      errors.fullName = t('register.error.fullNameRequired')
    } else if (form.fullName.trim().length < 3) {
      errors.fullName = t('register.error.fullNameShort')
    }

    if (!form.fatherName.trim()) {
      errors.fatherName = t('register.error.fatherRequired')
    } else if (form.fatherName.trim().length < 3) {
      errors.fatherName = t('register.error.fullNameShort')
    }

    if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(form.cnic.trim())) {
      errors.cnic = t('register.error.cnicInvalid')
    }

    if (!isPakistaniMobile(normalizedMobile)) {
      errors.mobile = t('register.error.mobileInvalid')
    }

    if (!form.district) {
      errors.district = t('register.error.districtRequired')
    }

    if (!form.taluka) {
      errors.taluka = t('register.error.talukaRequired')
    }

    if (!form.address.trim()) {
      errors.address = t('register.error.addressRequired')
    } else if (form.address.trim().length < 10) {
      errors.address = t('register.error.addressRequired')
    }

    if (form.dateOfBirth && form.dateOfBirth > todayDate()) {
      errors.dateOfBirth = t('register.error.dobFuture')
    }

    if (
      normalizedEmergencyMobile &&
      !isPakistaniMobile(normalizedEmergencyMobile)
    ) {
      errors.emergencyContactMobile =
        t('register.error.emergencyMobileInvalid')
    }

    if (!existingMember && !photo) {
      errors.photo = t('register.error.photoRequired')
    }

    if (
      !paymentReceiptLocked &&
      !paymentReceipt &&
      !existingMembershipPayment?.receipt_path
    ) {
      errors.paymentReceipt = t('register.error.receiptRequired')
    }

    if (!form.declarationAccepted) {
      errors.declarationAccepted = t('register.error.declarationRequired')
    }

    return errors
  }

  function getDescriptionIds(field: FormField, hasHint = false) {
    const ids: string[] = []

    if (hasHint) ids.push(`${field}-hint`)
    if (fieldErrors[field]) ids.push(`${field}-error`)

    return ids.length ? ids.join(' ') : undefined
  }

  function renderCurrentStep() {
    if (currentStep === 0) {
      return (
        <FormSection
          title={currentStepData.title}
          description={currentStepData.description}
        >
          <div className="reg-grid">
            <Field
              name="fullName"
              label={t('register.field.fullName')}
              required
              error={fieldErrors.fullName}
            >
              <input
                id="fullName"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                disabled={locked}
                className="reg-input"
                placeholder="Enter full name"
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={getDescriptionIds('fullName')}
              />
            </Field>

            <Field
              name="fatherName"
              label={t('register.field.fatherName')}
              required
              error={fieldErrors.fatherName}
            >
              <input
                id="fatherName"
                value={form.fatherName}
                onChange={(event) => updateField('fatherName', event.target.value)}
                disabled={locked}
                className="reg-input"
                placeholder="Enter father's name"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.fatherName)}
                aria-describedby={getDescriptionIds('fatherName')}
              />
            </Field>

            <Field
              name="cnic"
              label={t('register.field.cnic')}
              required
              hint={t('register.hint.cnic')}
              error={fieldErrors.cnic}
            >
              <input
                id="cnic"
                value={form.cnic}
                onChange={(event) =>
                  updateField('cnic', formatCnicInput(event.target.value))
                }
                disabled={locked}
                className="reg-input"
                placeholder="12345-1234567-1"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.cnic)}
                aria-describedby={getDescriptionIds('cnic', true)}
              />
            </Field>

            <Field
              name="mobile"
              label={t('register.field.mobile')}
              required
              hint={t('register.hint.mobile')}
              error={fieldErrors.mobile}
            >
              <input
                id="mobile"
                value={form.mobile}
                onChange={(event) =>
                  updateField('mobile', formatMobileInput(event.target.value))
                }
                disabled={locked}
                className="reg-input"
                placeholder="03001234567"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.mobile)}
                aria-describedby={getDescriptionIds('mobile', true)}
              />
            </Field>
          </div>
        </FormSection>
      )
    }

    if (currentStep === 1) {
      return (
        <FormSection
          title={currentStepData.title}
          description={currentStepData.description}
        >
          <div className="reg-grid">
            <Field
              name="district"
              label={t('register.field.district')}
              required
              error={fieldErrors.district}
            >
              <select
                id="district"
                value={form.district}
                onChange={(event) => handleDistrictChange(event.target.value)}
                disabled={locked}
                className="reg-input reg-select"
                aria-invalid={Boolean(fieldErrors.district)}
                aria-describedby={getDescriptionIds('district')}
              >
                <option value="">Select district</option>
                {sindhDistricts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="taluka"
              label={t('register.field.taluka')}
              required
              error={fieldErrors.taluka}
            >
              <select
                id="taluka"
                value={form.taluka}
                onChange={(event) => updateField('taluka', event.target.value)}
                disabled={locked || !form.district}
                className="reg-input reg-select"
                aria-invalid={Boolean(fieldErrors.taluka)}
                aria-describedby={getDescriptionIds('taluka')}
              >
                <option value="">
                  {form.district ? 'Select taluka' : 'Select district first'}
                </option>
                {talukaOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="address"
              label={t('register.field.address')}
              required
              error={fieldErrors.address}
              className="span-2"
            >
              <textarea
                id="address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                disabled={locked}
                className="reg-input reg-textarea"
                placeholder="House no., street, area, taluka, district"
                autoComplete="street-address"
                aria-invalid={Boolean(fieldErrors.address)}
                aria-describedby={getDescriptionIds('address')}
              />
            </Field>
          </div>
        </FormSection>
      )
    }

    if (currentStep === 2) {
      return (
        <FormSection
          title={currentStepData.title}
          description={currentStepData.description}
        >
          <div className="reg-grid">
            <Field name="profession" label={t('register.field.profession')}>
              <input
                id="profession"
                value={form.profession}
                onChange={(event) => updateField('profession', event.target.value)}
                disabled={locked}
                className="reg-input"
                placeholder={t('register.placeholder.profession')}
                autoComplete="organization-title"
              />
            </Field>

            <Field name="casteBranch" label={t('register.field.casteBranch')}>
              <input
                id="casteBranch"
                value={form.casteBranch}
                onChange={(event) => updateField('casteBranch', event.target.value)}
                disabled={locked}
                className="reg-input"
                placeholder={t('register.placeholder.optional')}
                autoComplete="off"
              />
            </Field>

            <Field
              name="dateOfBirth"
              label={t('register.field.dateOfBirth')}
              error={fieldErrors.dateOfBirth}
            >
              <input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
                disabled={locked}
                className="reg-input"
                max={todayDate()}
                aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                aria-describedby={getDescriptionIds('dateOfBirth')}
              />
            </Field>

            <Field name="gender" label={t('register.field.gender')}>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                disabled={locked}
                className="reg-input reg-select"
              >
                <option value="">{t('register.optional')}</option>
                {genderOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field name="education" label={t('register.field.education')}>
              <input
                id="education"
                value={form.education}
                onChange={(event) => updateField('education', event.target.value)}
                disabled={locked}
                className="reg-input"
                placeholder={t('register.placeholder.education')}
                autoComplete="off"
              />
            </Field>

            <Field name="bloodGroup" label={t('register.field.bloodGroup')}>
              <select
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={(event) => updateField('bloodGroup', event.target.value)}
                disabled={locked}
                className="reg-input reg-select"
              >
                <option value="">{t('register.optional')}</option>
                {bloodGroupOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>
      )
    }

    if (currentStep === 3) {
      return (
        <FormSection
          title={currentStepData.title}
          description={currentStepData.description}
        >
          <div className="reg-grid">
            <Field name="emergencyContactName" label={t('register.field.contactName')}>
              <input
                id="emergencyContactName"
                value={form.emergencyContactName}
                onChange={(event) =>
                  updateField('emergencyContactName', event.target.value)
                }
                disabled={locked}
                className="reg-input"
                placeholder="Full name"
                autoComplete="off"
              />
            </Field>

            <Field name="emergencyContactRelation" label={t('register.field.relation')}>
              <input
                id="emergencyContactRelation"
                value={form.emergencyContactRelation}
                onChange={(event) =>
                  updateField('emergencyContactRelation', event.target.value)
                }
                disabled={locked}
                className="reg-input"
                placeholder={t('register.placeholder.relation')}
                autoComplete="off"
              />
            </Field>

            <Field
              name="emergencyContactMobile"
              label={t('register.field.contactMobile')}
              hint={t('register.hint.emergencyMobile')}
              error={fieldErrors.emergencyContactMobile}
            >
              <input
                id="emergencyContactMobile"
                value={form.emergencyContactMobile}
                onChange={(event) =>
                  updateField(
                    'emergencyContactMobile',
                    formatMobileInput(event.target.value),
                  )
                }
                disabled={locked}
                className="reg-input"
                placeholder="03001234567"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.emergencyContactMobile)}
                aria-describedby={getDescriptionIds('emergencyContactMobile', true)}
              />
            </Field>
          </div>
        </FormSection>
      )
    }

    return (
      <FormSection
        title={currentStepData.title}
        description={currentStepData.description}
      >
        <div className="reg-photo-row">
          <div className="reg-photo-preview">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={t('register.photo.alt')}
                className="reg-photo-img"
              />
            ) : (
              <div className="reg-photo-placeholder" aria-hidden="true">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span>{t('register.photo.none')}</span>
              </div>
            )}
          </div>

          <div className="reg-photo-upload">
            <label
              className={`reg-upload-btn ${
                locked ? 'is-disabled' : 'cursor-pointer'
              }`}
              htmlFor="photo"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {photo ? photo.name : t('register.photo.choose')}
            </label>

            <input
              id="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
              disabled={locked}
              className="reg-sr-only"
              aria-invalid={Boolean(fieldErrors.photo)}
              aria-describedby={getDescriptionIds('photo', true)}
            />

            <p id="photo-hint" className="reg-upload-hint">
              {t('register.photo.hint')}
            </p>

            {fieldErrors.photo ? (
              <p id="photo-error" className="reg-error-text">
                {fieldErrors.photo}
              </p>
            ) : null}
          </div>
        </div>

        <div className="reg-payment-panel rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="reg-payment-title font-black">{t('register.fee.notice').replace('{amount}', formatMembershipMoney(MEMBERSHIP_BASE_FEE)).replace('{charges}', t('signup.fee.processingCharges'))}</p>
          <p className="reg-payment-instruction mt-1 text-amber-800">
            {t('register.fee.manualInstruction').replace('{bank}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName).replace('{account}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber)}
          </p>

          <div className="reg-payment-layout mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,340px)]">
            <div className="reg-payment-details grid gap-3 rounded-2xl bg-white/80 p-4 text-slate-900 ring-1 ring-amber-100 sm:grid-cols-2">
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.bankName')}
                </p>
                <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName}</p>
              </div>
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.accountTitle')}
                </p>
                <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountTitle}</p>
              </div>
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.accountNo')}
                </p>
                <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.accountNumber}</p>
              </div>
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.iban')}
                </p>
                <p className="mt-1 break-all font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.iban}</p>
              </div>
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.network')}
                </p>
                <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.paymentNetwork}</p>
              </div>
              <div className="reg-payment-detail">
                <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
                  {t('register.payment.tillId')}
                </p>
                <p className="mt-1 font-black">{MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId}</p>
              </div>
            </div>

            <div className="reg-payment-qr overflow-hidden rounded-2xl border border-amber-200 bg-white p-3 text-center shadow-sm">
              <img
                src={MEMBERSHIP_PAYMENT_QR_IMAGE_PATH}
                alt="Membership fee payment QR code"
                className="reg-payment-qr-img mx-auto w-full max-w-[300px] rounded-xl object-contain"
                loading="lazy"
              />
              <p className="mt-3 text-sm font-bold text-slate-900">
                {t('register.payment.qrHelp').replace('{network}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.paymentNetwork).replace('{tillId}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.tillId)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {t('register.payment.afterPayment')}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              className={`reg-upload-btn reg-payment-upload ${
                paymentReceiptLocked ? 'is-disabled' : 'cursor-pointer'
              }`}
              htmlFor="paymentReceipt"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {paymentReceipt
                ? paymentReceipt.name
                : existingMembershipPayment?.receipt_file_name ||
                  (existingMembershipPayment?.receipt_path
                    ? t('register.payment.receiptUploaded')
                    : t('register.payment.uploadReceipt'))}
            </label>

            <input
              id="paymentReceipt"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={handlePaymentReceiptChange}
              disabled={paymentReceiptLocked}
              className="reg-sr-only"
              aria-invalid={Boolean(fieldErrors.paymentReceipt)}
              aria-describedby={getDescriptionIds('paymentReceipt', true)}
            />

            <p id="paymentReceipt-hint" className="reg-upload-hint mt-2">
              {t('register.payment.receiptHint').replace('{size}', MEMBERSHIP_RECEIPT_MAX_SIZE_LABEL)}
            </p>

            {paymentReceiptLocked ? (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                {t('register.payment.receiptLocked')}
              </p>
            ) : null}

            {fieldErrors.paymentReceipt ? (
              <p id="paymentReceipt-error" className="reg-error-text">
                {fieldErrors.paymentReceipt}
              </p>
            ) : null}
          </div>
        </div>

        <label
          className={`reg-declaration ${
            form.declarationAccepted ? 'reg-declaration--checked' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={form.declarationAccepted}
            onChange={(event) =>
              updateField('declarationAccepted', event.target.checked)
            }
            disabled={locked}
            className="reg-checkbox"
            aria-invalid={Boolean(fieldErrors.declarationAccepted)}
            aria-describedby={getDescriptionIds('declarationAccepted')}
          />
          <span>
            {t('register.declaration')}
          </span>
        </label>

        {fieldErrors.declarationAccepted ? (
          <p id="declarationAccepted-error" className="reg-error-text">
            {fieldErrors.declarationAccepted}
          </p>
        ) : null}
      </FormSection>
    )
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <main className="reg-page" dir={direction}>
          <div className="reg-card">
            <div className="reg-loading">
              <span className="reg-spinner" />
              <p>{t('register.loading')}</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>

      <main className="reg-page" dir={direction}>
        <div className="reg-bg-pattern" aria-hidden="true" />

        <div className="reg-card">
          <div className="reg-header">
            <div className="reg-header-badge">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              {t('register.brand')}
            </div>

            <h1 className="reg-title">{t('register.title')}</h1>

            <p className="reg-subtitle">
              {t('register.subtitle')}
            </p>

            <MembershipFeeSummary t={t} />

            <div className="reg-title-line" />
          </div>

          <div className="reg-progress-wrap" aria-label={t('register.progressLabel')}>
            <div className="reg-progress-top">
              <span>
                {t('register.stepOf').replace('{current}', String(currentStep + 1)).replace('{total}', String(formSteps.length))}
              </span>
              <strong>{t('register.complete').replace('{percent}', String(progressPercent))}</strong>
            </div>

            <div className="reg-progress-track" aria-hidden="true">
              <div
                className="reg-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="reg-step-tabs">
              {localizedSteps.map((step, index) => (
                <button
                  key={step.titleKey}
                  type="button"
                  className={`reg-step-tab ${
                    index === currentStep ? 'is-active' : ''
                  } ${index < currentStep ? 'is-done' : ''}`}
                  onClick={() => handleStepClick(index)}
                  disabled={locked && index !== currentStep}
                  aria-current={index === currentStep ? 'step' : undefined}
                >
                  <span>{index + 1}</span>
                  {step.shortTitle}
                </button>
              ))}
            </div>
          </div>

          {existingMember?.status === 'approved' ? (
            <div className="reg-banner reg-banner--success">
              <span className="reg-banner-icon">✓</span>
              {t('register.approvedBanner')}
            </div>
          ) : null}

          {isPendingEdit ? (
            <div className="reg-banner reg-banner--info">
              <span className="reg-banner-icon">i</span>
              {t('register.pendingEditBanner')}
            </div>
          ) : null}

          {isRejected ? (
            <div className="reg-banner reg-banner--warning">
              <span className="reg-banner-icon">!</span>
              {t('register.rejectedBanner')}
            </div>
          ) : null}

          {draftSavedAt && !existingMember ? (
            <div className="reg-banner reg-banner--info">
              <span className="reg-banner-icon">i</span>
              {t('register.draftAvailable')}
            </div>
          ) : null}

          {error ? (
            <div className="reg-banner reg-banner--error" role="alert">
              <span className="reg-banner-icon">!</span>
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="reg-banner reg-banner--success" role="status">
              <span className="reg-banner-icon">✓</span>
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="reg-form" noValidate>
            {renderCurrentStep()}

            <div className="reg-actions">
              <div className="reg-actions-left">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="reg-btn-secondary"
                  >
                    ← {t('register.previous')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/dashboard' })}
                    className="reg-btn-secondary"
                  >
                    ← {t('register.backDashboard')}
                  </button>
                )}

                {!locked ? (
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="reg-btn-soft"
                  >
                    {t('register.saveDraft')}
                  </button>
                ) : null}

                {draftSavedAt && !locked ? (
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="reg-btn-soft reg-btn-soft--danger"
                  >
                    {t('register.clearDraft')}
                  </button>
                ) : null}
              </div>

              <div className="reg-actions-right">
                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={locked}
                    className="reg-btn-primary"
                  >
                    {t('register.nextStep')} →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || locked}
                    className="reg-btn-primary"
                  >
                    {submitting ? (
                      <>
                        <span className="reg-spinner reg-spinner--sm" />
                        {t('register.saving')}
                      </>
                    ) : isRejected ? (
                      t('register.resubmit')
                    ) : existingMember ? (
                      t('register.updateForm')
                    ) : (
                      t('register.submitApplication')
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}


function MembershipFeeSummary({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left text-sm text-amber-950 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
        {t('signup.fee.label')}
      </p>
      <p className="mt-2 text-base font-black text-amber-950">
        {formatMembershipMoney(MEMBERSHIP_BASE_FEE)} + {t('signup.fee.processingCharges')}
      </p>
      <p className="mt-1 leading-6 text-amber-800">
        {t('register.fee.payVia').replace('{bank}', MEMBERSHIP_MANUAL_PAYMENT_DETAILS.bankName)}
      </p>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="reg-section">
      <div className="reg-section-header">
        <div>
          <h2 className="reg-section-title">{title}</h2>
          <p className="reg-section-desc">{description}</p>
        </div>
      </div>

      <div className="reg-section-body">{children}</div>
    </section>
  )
}

function Field({
  name,
  label,
  children,
  required,
  hint,
  error,
  className = '',
}: {
  name: FormField
  label: string
  children: ReactNode
  required?: boolean
  hint?: string
  error?: string
  className?: string
}) {
  return (
    <div className={`reg-field ${className}`}>
      <label htmlFor={name} className="reg-label">
        {label}
        {required ? (
          <span className="reg-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <span id={`${name}-hint`} className="reg-hint">
          {hint}
        </span>
      ) : null}

      {children}

      {error ? (
        <p id={`${name}-error`} className="reg-error-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function memberToForm(data: ExistingMember): RegisterFormState {
  return {
    fullName: data.full_name,
    fatherName: data.father_name,
    cnic: data.cnic,
    mobile: data.mobile,
    district: data.district,
    taluka: data.taluka ?? '',
    profession: data.profession ?? '',
    casteBranch: data.caste_branch ?? '',
    address: data.address ?? '',
    dateOfBirth: data.date_of_birth ?? '',
    gender: data.gender ?? '',
    education: data.education ?? '',
    bloodGroup: data.blood_group ?? '',
    emergencyContactName: data.emergency_contact_name ?? '',
    emergencyContactRelation: data.emergency_contact_relation ?? '',
    emergencyContactMobile: data.emergency_contact_mobile ?? '',
    declarationAccepted: data.declaration_accepted,
  }
}

function draftKey(userId: string) {
  return `jas-register-draft:${REGISTER_DRAFT_VERSION}:${userId}`
}

function readDraft(userId: string) {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as {
      version?: number
      savedAt?: string
      form?: Partial<RegisterFormState>
    }

    if (parsed.version !== REGISTER_DRAFT_VERSION || !parsed.form) {
      return null
    }

    return {
      savedAt: parsed.savedAt ?? '',
      form: parsed.form,
    }
  } catch {
    return null
  }
}

function focusFirstInvalidField() {
  window.setTimeout(() => {
    const firstInvalid = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    )

    firstInvalid?.focus()
  }, 50)
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --reg-cream: #F8F5EF;
    --reg-paper: #FFFDF9;
    --reg-ink: #1C1A17;
    --reg-muted: #7A7670;
    --reg-border: #E2DDD5;
    --reg-green: #1B5E3B;
    --reg-green-l: #2D7A52;
    --reg-green-bg: #EEF5EF;
    --reg-gold: #B08A3E;
    --reg-gold-bg: #FFF7E6;
    --reg-red: #C0392B;
    --reg-red-bg: #FDF2F2;
    --reg-warn: #9A6700;
    --reg-warn-bg: #FFF8E5;
    --reg-blue: #1E5AA8;
    --reg-blue-bg: #EEF5FF;
  }

  .reg-page {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--reg-cream);
    background-image:
      radial-gradient(circle at 80% 10%, rgba(27,94,59,0.06) 0%, transparent 50%),
      radial-gradient(circle at 10% 90%, rgba(176,138,62,0.06) 0%, transparent 50%);
    padding: 2.5rem 1rem 4rem;
    font-family: 'DM Sans', sans-serif;
  }

  .reg-bg-pattern {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B5E3B' fill-opacity='0.03'%3E%3Cpath d='M20 20l8-8-8-8-8 8 8 8zm0 0l8 8-8 8-8-8 8-8z'/%3E%3C/g%3E%3C/svg%3E");
  }

  .reg-card {
    position: relative;
    z-index: 1;
    max-width: 820px;
    margin: 0 auto;
    background: var(--reg-paper);
    border-radius: 22px;
    border: 1px solid var(--reg-border);
    box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 18px 46px rgba(0,0,0,0.09);
    overflow: hidden;
  }

  .reg-header {
    padding: 2.5rem 2.5rem 2rem;
    border-bottom: 1px solid var(--reg-border);
    background: linear-gradient(135deg, #FFFDF9 0%, #F4F0E8 100%);
  }

  .reg-header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--reg-green);
    background: var(--reg-green-bg);
    border: 1px solid rgba(27,94,59,0.2);
    padding: 5px 12px;
    border-radius: 999px;
    margin-bottom: 1rem;
  }

  .reg-title {
    font-family: 'Lora', serif;
    font-size: clamp(1.75rem, 4vw, 2.55rem);
    font-weight: 700;
    color: var(--reg-ink);
    line-height: 1.2;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .reg-subtitle {
    font-size: 0.96rem;
    color: var(--reg-muted);
    margin: 0 0 1.25rem;
    max-width: 620px;
    line-height: 1.6;
  }

  .reg-title-line {
    width: 52px;
    height: 3px;
    background: linear-gradient(90deg, var(--reg-green), var(--reg-gold));
    border-radius: 999px;
  }

  .reg-progress-wrap {
    padding: 1.5rem 2.5rem 0;
  }

  .reg-progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: var(--reg-muted);
    font-size: 0.85rem;
    margin-bottom: 0.65rem;
  }

  .reg-progress-top strong {
    color: var(--reg-green);
    font-weight: 700;
  }

  .reg-progress-track {
    height: 8px;
    background: #EFEAE2;
    border-radius: 999px;
    overflow: hidden;
  }

  .reg-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--reg-green), var(--reg-gold));
    border-radius: 999px;
    transition: width 0.2s ease;
  }

  .reg-step-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .reg-step-tab {
    min-height: 42px;
    border: 1px solid var(--reg-border);
    background: #FFFFFF;
    color: var(--reg-muted);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: border-color 0.15s, color 0.15s, background 0.15s, transform 0.1s;
  }

  .reg-step-tab span {
    width: 20px;
    height: 20px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #F4F1EB;
    color: var(--reg-muted);
    font-size: 0.7rem;
  }

  .reg-step-tab:hover:not(:disabled) {
    border-color: rgba(27,94,59,0.35);
    transform: translateY(-1px);
  }

  .reg-step-tab.is-active {
    border-color: rgba(27,94,59,0.35);
    background: var(--reg-green-bg);
    color: var(--reg-green);
  }

  .reg-step-tab.is-active span,
  .reg-step-tab.is-done span {
    background: var(--reg-green);
    color: white;
  }

  .reg-step-tab.is-done {
    color: var(--reg-green);
  }

  .reg-banner {
    margin: 1.25rem 2.5rem 0;
    padding: 0.875rem 1.25rem;
    border-radius: 12px;
    font-size: 0.875rem;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid transparent;
    line-height: 1.5;
  }

  .reg-banner--success {
    background: var(--reg-green-bg);
    color: var(--reg-green);
    border-color: rgba(27,94,59,0.2);
  }

  .reg-banner--warning {
    background: var(--reg-warn-bg);
    color: var(--reg-warn);
    border-color: rgba(154,103,0,0.22);
  }

  .reg-banner--error {
    background: var(--reg-red-bg);
    color: var(--reg-red);
    border-color: rgba(192,57,43,0.2);
  }

  .reg-banner--info {
    background: var(--reg-blue-bg);
    color: var(--reg-blue);
    border-color: rgba(30,90,168,0.18);
  }

  .reg-banner-icon {
    flex-shrink: 0;
    width: 21px;
    height: 21px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 800;
    background: currentColor;
    color: white;
  }

  .reg-form {
    padding: 0 2.5rem 2.5rem;
  }

  .reg-section {
    margin-top: 2rem;
    border: 1px solid var(--reg-border);
    border-radius: 16px;
    overflow: hidden;
    background: #FFFFFF;
  }

  .reg-section-header {
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F1EA 100%);
    border-bottom: 1px solid var(--reg-border);
  }

  .reg-section-title {
    font-family: 'Lora', serif;
    font-size: 1.18rem;
    font-weight: 700;
    color: var(--reg-ink);
    margin: 0 0 4px;
  }

  .reg-section-desc {
    font-size: 0.84rem;
    color: var(--reg-muted);
    margin: 0;
    line-height: 1.5;
  }

  .reg-section-body {
    padding: 1.5rem;
  }

  .reg-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .span-2 {
    grid-column: span 2;
  }

  .reg-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .reg-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--reg-ink);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .reg-required {
    color: var(--reg-red);
  }

  .reg-hint {
    font-size: 0.75rem;
    color: var(--reg-muted);
    margin-top: -2px;
  }

  .reg-input {
    width: 100%;
    min-height: 46px;
    padding: 0.72rem 0.9rem;
    border: 1.5px solid var(--reg-border);
    border-radius: 10px;
    background: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    color: var(--reg-ink);
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    outline: none;
    box-sizing: border-box;
  }

  .reg-input::placeholder {
    color: #B8B3AB;
  }

  .reg-input:focus {
    border-color: var(--reg-green);
    box-shadow: 0 0 0 3px rgba(27,94,59,0.1);
  }

  .reg-input[aria-invalid="true"] {
    border-color: var(--reg-red);
    background: #FFFBFB;
  }

  .reg-input:disabled {
    background: #F5F3EF;
    color: var(--reg-muted);
    cursor: not-allowed;
  }

  .reg-select {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7670' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.25rem;
  }

  .reg-textarea {
    min-height: 104px;
    resize: vertical;
    line-height: 1.5;
  }

  .reg-error-text {
    color: var(--reg-red);
    font-size: 0.76rem;
    font-weight: 600;
    margin: 2px 0 0;
    line-height: 1.4;
  }

  .reg-photo-row {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .reg-photo-preview {
    flex-shrink: 0;
    width: 104px;
    height: 128px;
    border-radius: 14px;
    border: 1.5px solid var(--reg-border);
    overflow: hidden;
    background: #F5F3EF;
  }

  .reg-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .reg-photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--reg-muted);
    font-size: 0.72rem;
  }

  .reg-photo-upload {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
  }

  .reg-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.7rem 1rem;
    border: 1.5px dashed rgba(27,94,59,0.35);
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--reg-green);
    background: var(--reg-green-bg);
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
    max-width: 300px;
    min-height: 46px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .reg-upload-btn:hover:not(.is-disabled) {
    border-color: var(--reg-green);
    background: #E2EFEA;
    transform: translateY(-1px);
  }

  .reg-upload-btn.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .reg-upload-hint {
    font-size: 0.78rem;
    color: var(--reg-muted);
    margin: 0;
    line-height: 1.45;
  }

  .reg-declaration {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 1.125rem 1.25rem;
    border-radius: 12px;
    border: 1.5px solid var(--reg-border);
    background: #FAFAF7;
    font-size: 0.89rem;
    color: var(--reg-ink);
    line-height: 1.55;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .reg-declaration--checked {
    border-color: var(--reg-green);
    background: var(--reg-green-bg);
  }

  .reg-checkbox {
    flex-shrink: 0;
    margin-top: 2px;
    width: 18px;
    height: 18px;
    accent-color: var(--reg-green);
    cursor: pointer;
  }

  .reg-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--reg-border);
  }

  .reg-actions-left,
  .reg-actions-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .reg-btn-primary,
  .reg-btn-secondary,
  .reg-btn-soft {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0.72rem 1.55rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s, border-color 0.15s, color 0.15s;
  }

  .reg-btn-primary {
    background: var(--reg-green);
    color: white;
    border: 1.5px solid var(--reg-green);
    box-shadow: 0 2px 8px rgba(27,94,59,0.28);
  }

  .reg-btn-primary:hover:not(:disabled) {
    background: var(--reg-green-l);
    border-color: var(--reg-green-l);
    box-shadow: 0 4px 16px rgba(27,94,59,0.35);
    transform: translateY(-1px);
  }

  .reg-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .reg-btn-secondary {
    background: #FFFFFF;
    color: var(--reg-muted);
    border: 1.5px solid var(--reg-border);
  }

  .reg-btn-secondary:hover {
    border-color: #C4BDB4;
    color: var(--reg-ink);
    background: #F5F3EF;
  }

  .reg-btn-soft {
    background: var(--reg-gold-bg);
    color: #7A5616;
    border: 1.5px solid rgba(176,138,62,0.25);
  }

  .reg-btn-soft:hover {
    background: #FFF0C8;
    transform: translateY(-1px);
  }

  .reg-btn-soft--danger {
    background: var(--reg-red-bg);
    color: var(--reg-red);
    border-color: rgba(192,57,43,0.18);
  }

  .reg-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2.5rem;
    color: var(--reg-muted);
    font-size: 0.9rem;
  }

  .reg-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--reg-border);
    border-top-color: var(--reg-green);
    border-radius: 999px;
    animation: reg-spin 0.7s linear infinite;
    display: inline-block;
  }

  .reg-spinner--sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }

  .reg-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes reg-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .reg-page {
      padding: 1rem 0.75rem 2.5rem;
    }

    .reg-card {
      border-radius: 18px;
    }

    .reg-header {
      padding: 1.75rem 1.25rem 1.5rem;
    }

    .reg-progress-wrap,
    .reg-form {
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }

    .reg-banner {
      margin-left: 1.25rem;
      margin-right: 1.25rem;
    }

    .reg-step-tabs {
      grid-template-columns: repeat(2, 1fr);
    }

    .reg-section-body {
      padding: 1.25rem;
    }

    .reg-grid {
      grid-template-columns: 1fr;
    }

    .span-2 {
      grid-column: span 1;
    }

    .reg-photo-row {
      flex-direction: column;
    }

    .reg-photo-upload,
    .reg-upload-btn,
    .reg-actions,
    .reg-actions-left,
    .reg-actions-right,
    .reg-btn-primary,
    .reg-btn-secondary,
    .reg-btn-soft {
      width: 100%;
      max-width: none;
    }

    .reg-actions {
      flex-direction: column-reverse;
    }

    .reg-actions-left,
    .reg-actions-right {
      flex-direction: column;
    }
  }
  /* Final Dashboard + Register Mobile Polish */
  .reg-page {
    overflow-x: clip;
  }

  .reg-card,
  .reg-section,
  .reg-payment-panel {
    min-width: 0;
  }

  .reg-payment-panel {
    overflow: hidden;
  }

  .reg-payment-title,
  .reg-payment-instruction,
  .reg-payment-detail p,
  .reg-payment-qr p {
    overflow-wrap: anywhere;
  }

  .reg-payment-details {
    min-width: 0;
  }

  .reg-payment-detail {
    min-width: 0;
    border-radius: 0.9rem;
  }

  .reg-payment-detail p:last-child {
    unicode-bidi: plaintext;
  }

  .reg-payment-qr {
    min-width: 0;
  }

  .reg-payment-qr-img {
    max-height: 320px;
  }

  .reg-payment-upload {
    width: min(100%, 340px);
    max-width: 100%;
    justify-content: center;
  }

  .reg-page[dir="rtl"] {
    text-align: right;
  }

  .reg-page[dir="rtl"] .reg-header,
  .reg-page[dir="rtl"] .reg-section-header,
  .reg-page[dir="rtl"] .reg-field,
  .reg-page[dir="rtl"] .reg-banner,
  .reg-page[dir="rtl"] .reg-payment-panel {
    text-align: right;
  }

  .reg-page[dir="rtl"] .reg-title-line {
    margin-right: 0;
    margin-left: auto;
  }

  .reg-page[dir="rtl"] .reg-select {
    background-position: left 0.75rem center;
    padding-right: 0.9rem;
    padding-left: 2.25rem;
  }

  .reg-page[dir="rtl"] .reg-declaration {
    text-align: right;
  }

  .reg-page[dir="rtl"] .reg-actions {
    direction: rtl;
  }

  .reg-page[dir="rtl"] .reg-btn-primary,
  .reg-page[dir="rtl"] .reg-btn-secondary,
  .reg-page[dir="rtl"] .reg-btn-soft,
  .reg-page[dir="rtl"] .reg-upload-btn {
    direction: rtl;
  }

  @media (max-width: 760px) {
    .reg-payment-layout {
      grid-template-columns: 1fr;
    }

    .reg-payment-details {
      grid-template-columns: 1fr;
      padding: 0.85rem;
    }

    .reg-payment-detail {
      background: rgba(255,255,255,0.7);
      padding: 0.75rem;
      border: 1px solid rgba(245,158,11,0.14);
    }

    .reg-payment-qr {
      padding: 0.85rem;
    }

    .reg-payment-qr-img {
      max-width: 230px;
    }

    .reg-payment-upload {
      width: 100%;
      white-space: normal;
      text-align: center;
      line-height: 1.35;
      padding: 0.85rem 1rem;
    }

    .reg-progress-top {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.35rem;
    }

    .reg-step-tab {
      min-height: 3rem;
      white-space: normal;
      line-height: 1.25;
      padding: 0.45rem;
    }

    .reg-declaration {
      padding: 1rem;
    }
  }

  @media (max-width: 420px) {
    .reg-page {
      padding-inline: 0.55rem;
    }

    .reg-card {
      border-radius: 1rem;
    }

    .reg-header {
      padding: 1.35rem 1rem 1.15rem;
    }

    .reg-progress-wrap,
    .reg-form {
      padding-left: 0.9rem;
      padding-right: 0.9rem;
    }

    .reg-banner {
      margin-left: 0.9rem;
      margin-right: 0.9rem;
    }

    .reg-section-header,
    .reg-section-body {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .reg-title {
      font-size: clamp(1.55rem, 10vw, 2.05rem);
      line-height: 1.16;
    }

    .reg-subtitle {
      font-size: 0.88rem;
    }

    .reg-photo-preview {
      width: 92px;
      height: 112px;
    }
  }

`