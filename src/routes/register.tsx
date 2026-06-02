import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabase/client'
import { talukasByDistrict } from '../lib/register/registration-options'
import {
  isPakistaniMobile,
  normalizeMobile,
  optionalText,
  todayDate,
} from '../lib/shared/formatters'
import { RegistrationStepFields } from '../components/register/RegistrationStepFields'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const REGISTER_DRAFT_VERSION = 1

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

type FormField = keyof RegisterFormState | 'photo'

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
  title: string
  shortTitle: string
  description: string
  fields: FormField[]
}> = [
  {
    title: 'Personal Identity',
    shortTitle: 'Identity',
    description: 'Your legal name, CNIC, and mobile number.',
    fields: ['fullName', 'fatherName', 'cnic', 'mobile'],
  },
  {
    title: 'Location & Address',
    shortTitle: 'Location',
    description: 'Your district, taluka, and residential address.',
    fields: ['district', 'taluka', 'address'],
  },
  {
    title: 'Profile Details',
    shortTitle: 'Profile',
    description: 'Optional information for a complete member profile.',
    fields: ['profession', 'casteBranch', 'dateOfBirth', 'gender', 'education', 'bloodGroup'],
  },
  {
    title: 'Emergency Contact',
    shortTitle: 'Emergency',
    description: 'Someone we can contact if needed.',
    fields: ['emergencyContactName', 'emergencyContactRelation', 'emergencyContactMobile'],
  },
  {
    title: 'Photo & Declaration',
    shortTitle: 'Submit',
    description: 'Upload your photo and confirm the declaration.',
    fields: ['photo', 'declarationAccepted'],
  },
]

function RegisterPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')
  const [existingMember, setExistingMember] = useState<ExistingMember | null>(null)

  const [form, setForm] = useState<RegisterFormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [currentStep, setCurrentStep] = useState(0)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoSignedUrl, setExistingPhotoSignedUrl] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [draftSavedAt, setDraftSavedAt] = useState('')

  const locked = existingMember?.status === 'approved'
  const isRejected = existingMember?.status === 'rejected'
  const isLastStep = currentStep === formSteps.length - 1
  const currentStepData = formSteps[currentStep]
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
        photo: 'Photo must be PNG, JPG, JPEG, or WebP.',
      }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        photo: 'Photo must be less than 2MB.',
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
      setError('Please fix the highlighted fields before continuing.')
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
      setError('Please complete the current step first.')
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
      setSuccess('Draft saved on this device.')
      setError('')
    } catch {
      setError('Draft could not be saved on this device.')
    }
  }

  function clearDraft() {
    if (!userId) return

    localStorage.removeItem(draftKey(userId))
    setDraftSavedAt('')
    setSuccess('Local draft cleared.')
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!userId) {
      setError('You must be logged in.')
      return
    }

    if (existingMember?.status === 'approved') {
      setError('Approved membership forms cannot be edited.')
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

      setError('Please fix the highlighted fields before submitting.')
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
      const { error: insertError } = await supabase.from('members').insert({
        user_id: userId,
        ...payload,
        status: 'pending',
      })

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }
    }

    localStorage.removeItem(draftKey(userId))
    setDraftSavedAt('')
    setSubmitting(false)

    setSuccess(
      existingMember
        ? 'Your membership application has been updated successfully.'
        : 'Your membership application has been submitted successfully.',
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
      errors.fullName = 'Full name is required.'
    } else if (form.fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters.'
    }

    if (!form.fatherName.trim()) {
      errors.fatherName = "Father's name is required."
    } else if (form.fatherName.trim().length < 3) {
      errors.fatherName = "Father's name must be at least 3 characters."
    }

    if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(form.cnic.trim())) {
      errors.cnic = 'CNIC format must be 12345-1234567-1.'
    }

    if (!isPakistaniMobile(normalizedMobile)) {
      errors.mobile = 'Enter a valid Pakistani mobile number.'
    }

    if (!form.district) {
      errors.district = 'Please select your district.'
    }

    if (!form.taluka) {
      errors.taluka = 'Please select your taluka.'
    }

    if (!form.address.trim()) {
      errors.address = 'Complete residential address is required.'
    } else if (form.address.trim().length < 10) {
      errors.address = 'Please enter a more complete address.'
    }

    if (form.dateOfBirth && form.dateOfBirth > todayDate()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.'
    }

    if (
      normalizedEmergencyMobile &&
      !isPakistaniMobile(normalizedEmergencyMobile)
    ) {
      errors.emergencyContactMobile =
        'Enter a valid Pakistani emergency contact number.'
    }

    if (!existingMember && !photo) {
      errors.photo = 'Photo is required.'
    }

    if (!form.declarationAccepted) {
      errors.declarationAccepted = 'Please accept the declaration.'
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
    return (
      <RegistrationStepFields
        currentStep={currentStep}
        title={currentStepData.title}
        description={currentStepData.description}
        form={form}
        fieldErrors={fieldErrors}
        locked={locked}
        photo={photo}
        photoSrc={photoSrc}
        talukaOptions={talukaOptions}
        updateField={updateField}
        handleDistrictChange={handleDistrictChange}
        handlePhotoChange={handlePhotoChange}
        getDescriptionIds={getDescriptionIds}
      />
    )
  }


  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <main className="reg-page">
          <div className="reg-card">
            <div className="reg-loading">
              <span className="reg-spinner" />
              <p>Loading form…</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>

      <main className="reg-page">
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
              Jatt Alliance Sindh
            </div>

            <h1 className="reg-title">Membership Registration</h1>

            <p className="reg-subtitle">
              Complete your application step by step. Your details will be sent
              for admin review.
            </p>

            <div className="reg-title-line" />
          </div>

          <div className="reg-progress-wrap" aria-label="Registration progress">
            <div className="reg-progress-top">
              <span>
                Step {currentStep + 1} of {formSteps.length}
              </span>
              <strong>{progressPercent}% Complete</strong>
            </div>

            <div className="reg-progress-track" aria-hidden="true">
              <div
                className="reg-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="reg-step-tabs">
              {formSteps.map((step, index) => (
                <button
                  key={step.title}
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
              Your membership is approved. You cannot edit this form now.
            </div>
          ) : null}

          {isRejected ? (
            <div className="reg-banner reg-banner--warning">
              <span className="reg-banner-icon">!</span>
              Your application was rejected. Please update your details and
              resubmit for admin review.
            </div>
          ) : null}

          {draftSavedAt && !existingMember ? (
            <div className="reg-banner reg-banner--info">
              <span className="reg-banner-icon">i</span>
              A local draft is available on this device.
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
                    ← Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/dashboard' })}
                    className="reg-btn-secondary"
                  >
                    ← Back to Dashboard
                  </button>
                )}

                {!locked ? (
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="reg-btn-soft"
                  >
                    Save Draft
                  </button>
                ) : null}

                {draftSavedAt && !locked ? (
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="reg-btn-soft reg-btn-soft--danger"
                  >
                    Clear Draft
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
                    Next Step →
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
                        Saving…
                      </>
                    ) : isRejected ? (
                      'Resubmit Application'
                    ) : existingMember ? (
                      'Update Form'
                    ) : (
                      'Submit Application'
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
`