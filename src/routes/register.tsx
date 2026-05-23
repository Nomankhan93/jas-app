import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

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

type ExistingMember = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
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

function RegisterPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')
  const [existingMember, setExistingMember] = useState<ExistingMember | null>(
    null,
  )

  const [fullName, setFullName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [cnic, setCnic] = useState('')
  const [mobile, setMobile] = useState('')
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [profession, setProfession] = useState('')
  const [casteBranch, setCasteBranch] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [education, setEducation] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('')
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('')
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoSignedUrl, setExistingPhotoSignedUrl] = useState<
    string | null
  >(null)

  const [error, setError] = useState('')

  const talukaOptions = useMemo(() => {
    return district ? talukasByDistrict[district] || [] : []
  }, [district])

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

    const { data: rawData, error } = await supabase
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

if (error) {
  setError(error.message)
  setLoading(false)
  return
}

const data = rawData as unknown as ExistingMember | null

if (data) {
  setExistingMember(data)
  setFullName(data.full_name)
  setFatherName(data.father_name)
  setCnic(data.cnic)
  setMobile(data.mobile)
  setDistrict(data.district)
  setTaluka(data.taluka ?? '')
  setProfession(data.profession ?? '')
  setCasteBranch(data.caste_branch ?? '')
  setAddress(data.address ?? '')
  setDateOfBirth(data.date_of_birth ?? '')
  setGender(data.gender ?? '')
  setEducation(data.education ?? '')
  setBloodGroup(data.blood_group ?? '')
  setEmergencyContactName(data.emergency_contact_name ?? '')
  setEmergencyContactRelation(data.emergency_contact_relation ?? '')
  setEmergencyContactMobile(data.emergency_contact_mobile ?? '')
  setDeclarationAccepted(data.declaration_accepted)

  if (data.photo_url) {
    const { data: signed } = await supabase.storage
      .from('member-photos')
      .createSignedUrl(data.photo_url, 60 * 60)

    setExistingPhotoSignedUrl(signed?.signedUrl ?? null)
  }
}

    setLoading(false)
  }

  function handleDistrictChange(value: string) {
    setDistrict(value)
    setTaluka('')
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setError('')

    const file = event.target.files?.[0] ?? null
    setPhoto(null)

    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }

    if (!file) return

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError('Photo must be PNG, JPG, JPEG, or WebP.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setError('Photo must be less than 2MB.')
      event.target.value = ''
      return
    }

    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedMobile = normalizeMobile(mobile)
    const normalizedEmergencyMobile = normalizeMobile(emergencyContactMobile)

    if (!userId) {
      setError('You must be logged in.')
      return
    }

    if (existingMember?.status === 'approved') {
      setError('Approved membership forms cannot be edited.')
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    if (!fatherName.trim()) {
      setError("Father's name is required.")
      return
    }

    if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(cnic.trim())) {
      setError('CNIC format must be 12345-1234567-1.')
      return
    }

    if (!isPakistaniMobile(normalizedMobile)) {
      setError('Mobile number must be a valid Pakistani mobile number.')
      return
    }

    if (!district) {
      setError('Please select your district.')
      return
    }

    if (!taluka) {
      setError('Please select your taluka.')
      return
    }

    if (!address.trim()) {
      setError('Complete residential address is required.')
      return
    }

    if (!existingMember && !photo) {
      setError('Photo is required.')
      return
    }

    if (
      normalizedEmergencyMobile &&
      !isPakistaniMobile(normalizedEmergencyMobile)
    ) {
      setError('Emergency contact mobile must be a valid Pakistani mobile number.')
      return
    }

    if (!declarationAccepted) {
      setError('Please accept the declaration before submitting.')
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

    const payload = {
      full_name: fullName.trim(),
      father_name: fatherName.trim(),
      cnic: cnic.trim(),
      mobile: normalizedMobile,
      district,
      taluka,
      profession: optionalText(profession),
      caste_branch: optionalText(casteBranch),
      address: address.trim(),
      date_of_birth: dateOfBirth || null,
      gender: optionalText(gender),
      education: optionalText(education),
      blood_group: optionalText(bloodGroup),
      emergency_contact_name: optionalText(emergencyContactName),
      emergency_contact_relation: optionalText(emergencyContactRelation),
      emergency_contact_mobile: normalizedEmergencyMobile || null,
      declaration_accepted: declarationAccepted,
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

    setSubmitting(false)
    navigate({ to: '/dashboard' })
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

  const locked = existingMember?.status === 'approved'
  const isRejected = existingMember?.status === 'rejected'
  const photoSrc = photoPreview || existingPhotoSignedUrl

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
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Jatt Alliance Sindh
            </div>
            <h1 className="reg-title">Membership Registration</h1>
            <p className="reg-subtitle">
              Submit your profile and photo for admin review.
            </p>
            <div className="reg-title-line" />
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

          {error ? (
            <div className="reg-banner reg-banner--error">
              <span className="reg-banner-icon">!</span>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="reg-form">
            <FormSection
              number={1}
              title="Personal Identity"
              description="Your legal name and contact details"
            >
              <div className="reg-grid">
                <Field label="Full Name" required>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input"
                    placeholder="Enter full name"
                  />
                </Field>

                <Field label="Father's Name" required>
                  <input
                    value={fatherName}
                    onChange={(event) => setFatherName(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input"
                    placeholder="Enter father's name"
                  />
                </Field>

                <Field label="CNIC" required hint="Format: 12345-1234567-1">
                  <input
                    value={cnic}
                    onChange={(event) => setCnic(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input"
                    placeholder="12345-1234567-1"
                  />
                </Field>

                <Field label="Mobile Number" required hint="Format: 03001234567">
                  <input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input"
                    placeholder="03001234567"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              number={2}
              title="Location"
              description="Your district, taluka, and full residential address"
            >
              <div className="reg-grid">
                <Field label="District" required>
                  <select
                    value={district}
                    onChange={(event) => handleDistrictChange(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input reg-select"
                  >
                    <option value="">Select district</option>
                    {sindhDistricts.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Taluka / Town / Sub-division" required>
                  <select
                    value={taluka}
                    onChange={(event) => setTaluka(event.target.value)}
                    disabled={locked || !district}
                    required
                    className="reg-input reg-select"
                  >
                    <option value="">
                      {district ? 'Select taluka' : 'Select district first'}
                    </option>
                    {talukaOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Complete Residential Address"
                  required
                  className="span-2"
                >
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    disabled={locked}
                    required
                    className="reg-input reg-textarea"
                    placeholder="House no., street, area, taluka, district"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              number={3}
              title="Profile Details"
              description="Optional information to complete your member profile"
            >
              <div className="reg-grid">
                <Field label="Profession">
                  <input
                    value={profession}
                    onChange={(event) => setProfession(event.target.value)}
                    disabled={locked}
                    className="reg-input"
                    placeholder="e.g. Teacher, Farmer, Business"
                  />
                </Field>

                <Field label="Caste Branch">
                  <input
                    value={casteBranch}
                    onChange={(event) => setCasteBranch(event.target.value)}
                    disabled={locked}
                    className="reg-input"
                    placeholder="Optional"
                  />
                </Field>

                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    disabled={locked}
                    className="reg-input"
                  />
                </Field>

                <Field label="Gender">
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    disabled={locked}
                    className="reg-input reg-select"
                  >
                    <option value="">— Optional —</option>
                    {genderOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Education / Qualification">
                  <input
                    value={education}
                    onChange={(event) => setEducation(event.target.value)}
                    disabled={locked}
                    className="reg-input"
                    placeholder="e.g. Matric, BA, MBA"
                  />
                </Field>

                <Field label="Blood Group">
                  <select
                    value={bloodGroup}
                    onChange={(event) => setBloodGroup(event.target.value)}
                    disabled={locked}
                    className="reg-input reg-select"
                  >
                    <option value="">— Optional —</option>
                    {bloodGroupOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection
              number={4}
              title="Emergency Contact"
              description="Someone we can reach in case of emergency"
            >
              <div className="reg-grid">
                <Field label="Contact Name">
                  <input
                    value={emergencyContactName}
                    onChange={(event) =>
                      setEmergencyContactName(event.target.value)
                    }
                    disabled={locked}
                    className="reg-input"
                    placeholder="Full name"
                  />
                </Field>

                <Field label="Relation">
                  <input
                    value={emergencyContactRelation}
                    onChange={(event) =>
                      setEmergencyContactRelation(event.target.value)
                    }
                    disabled={locked}
                    className="reg-input"
                    placeholder="e.g. Brother, Father"
                  />
                </Field>

                <Field label="Contact Mobile" hint="Optional, e.g. 03001234567">
                  <input
                    value={emergencyContactMobile}
                    onChange={(event) =>
                      setEmergencyContactMobile(event.target.value)
                    }
                    disabled={locked}
                    className="reg-input"
                    placeholder="03001234567"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              number={5}
              title="Photo & Declaration"
              description="Upload a clear passport-style photo and confirm your details"
            >
              <div className="reg-photo-row">
                <div className="reg-photo-preview">
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt="Photo preview"
                      className="reg-photo-img"
                    />
                  ) : (
                    <div className="reg-photo-placeholder">
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
                      <span>No photo</span>
                    </div>
                  )}
                </div>

                <div className="reg-photo-upload">
                  <label
                    className={`reg-upload-btn ${
                      locked ? 'is-disabled' : 'cursor-pointer'
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {photo ? photo.name : 'Choose photo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoChange}
                      disabled={locked}
                      required={!existingMember}
                      className="sr-only"
                    />
                  </label>

                  <p className="reg-upload-hint">
                    PNG, JPG or WebP · Passport style · Clear face visible · Max
                    2MB
                  </p>
                </div>
              </div>

              <label
                className={`reg-declaration ${
                  declarationAccepted ? 'reg-declaration--checked' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(event) =>
                    setDeclarationAccepted(event.target.checked)
                  }
                  disabled={locked}
                  required
                  className="reg-checkbox"
                />
                <span>
                  I confirm that the provided information is true and authorize{' '}
                  <strong>Jatt Alliance Sindh</strong> to review it for
                  membership approval and digital card issuance.
                </span>
              </label>
            </FormSection>

            <div className="reg-actions">
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

              <button
                type="button"
                onClick={() => navigate({ to: '/dashboard' })}
                className="reg-btn-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: number
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="reg-section">
      <div className="reg-section-header">
        <span className="reg-section-num">{number}</span>
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
  label,
  children,
  required,
  hint,
  className = '',
}: {
  label: string
  children: ReactNode
  required?: boolean
  hint?: string
  className?: string
}) {
  return (
    <label className={`reg-field ${className}`}>
      <span className="reg-label">
        {label}
        {required ? (
          <span className="reg-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      {hint ? <span className="reg-hint">{hint}</span> : null}
      {children}
    </label>
  )
}

function normalizeMobile(value: string) {
  return value.trim().replace(/[\s-]/g, '')
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isPakistaniMobile(value: string) {
  const normalized = normalizeMobile(value)
  return /^(\+92|0)3[0-9]{9}$/.test(normalized)
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --reg-cream:   #F8F5EF;
    --reg-paper:   #FFFDF9;
    --reg-ink:     #1C1A17;
    --reg-muted:   #7A7670;
    --reg-border:  #E2DDD5;
    --reg-green:   #1B5E3B;
    --reg-green-l: #2D7A52;
    --reg-green-bg:#EEF5EF;
    --reg-gold:    #B08A3E;
    --reg-red:     #C0392B;
    --reg-red-bg:  #FDF2F2;
    --reg-warn:    #9A6700;
    --reg-warn-bg: #FFF8E5;
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
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B5E3B' fill-opacity='0.03'%3E%3Cpath d='M20 20l8-8-8-8-8 8 8 8zm0 0l8 8-8 8-8-8 8-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .reg-card {
    position: relative;
    z-index: 1;
    max-width: 780px;
    margin: 0 auto;
    background: var(--reg-paper);
    border-radius: 20px;
    border: 1px solid var(--reg-border);
    box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08);
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
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--reg-green);
    background: var(--reg-green-bg);
    border: 1px solid rgba(27,94,59,0.2);
    padding: 5px 12px;
    border-radius: 100px;
    margin-bottom: 1rem;
  }

  .reg-title {
    font-family: 'Lora', serif;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--reg-ink);
    line-height: 1.2;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .reg-subtitle {
    font-size: 0.95rem;
    color: var(--reg-muted);
    margin: 0 0 1.25rem;
  }

  .reg-title-line {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, var(--reg-green), var(--reg-gold));
    border-radius: 2px;
  }

  .reg-banner {
    margin: 1.25rem 2.5rem 0;
    padding: 0.875rem 1.25rem;
    border-radius: 10px;
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

  .reg-banner-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .reg-banner--success .reg-banner-icon {
    background: var(--reg-green);
    color: white;
  }

  .reg-banner--warning .reg-banner-icon {
    background: var(--reg-warn);
    color: white;
  }

  .reg-banner--error .reg-banner-icon {
    background: var(--reg-red);
    color: white;
  }

  .reg-form {
    padding: 0 2.5rem 2.5rem;
  }

  .reg-section {
    margin-top: 2.25rem;
    border: 1px solid var(--reg-border);
    border-radius: 14px;
    overflow: hidden;
  }

  .reg-section-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F1EA 100%);
    border-bottom: 1px solid var(--reg-border);
  }

  .reg-section-num {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--reg-green);
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
    box-shadow: 0 2px 6px rgba(27,94,59,0.3);
  }

  .reg-section-title {
    font-family: 'Lora', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--reg-ink);
    margin: 0 0 2px;
  }

  .reg-section-desc {
    font-size: 0.8rem;
    color: var(--reg-muted);
    margin: 0;
  }

  .reg-section-body {
    padding: 1.5rem;
  }

  .reg-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  .span-2 {
    grid-column: span 2;
  }

  .reg-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .reg-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--reg-ink);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .reg-required {
    color: var(--reg-red);
  }

  .reg-hint {
    font-size: 0.74rem;
    color: var(--reg-muted);
    margin-top: -2px;
  }

  .reg-input {
    width: 100%;
    min-height: 44px;
    padding: 0.7rem 0.875rem;
    border: 1.5px solid var(--reg-border);
    border-radius: 8px;
    background: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: var(--reg-ink);
    transition: border-color 0.15s, box-shadow 0.15s;
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
    min-height: 90px;
    resize: vertical;
    line-height: 1.5;
  }

  .reg-photo-row {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .reg-photo-preview {
    flex-shrink: 0;
    width: 96px;
    height: 120px;
    border-radius: 10px;
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
    font-size: 0.7rem;
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
    padding: 0.625rem 1rem;
    border: 1.5px dashed var(--reg-border);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--reg-green);
    background: var(--reg-green-bg);
    transition: border-color 0.15s, background 0.15s;
    max-width: 280px;
    min-height: 44px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .reg-upload-btn:hover:not(.is-disabled) {
    border-color: var(--reg-green);
    background: #E2EFEA;
  }

  .reg-upload-btn.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .reg-upload-hint {
    font-size: 0.77rem;
    color: var(--reg-muted);
  }

  .reg-declaration {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 1.125rem 1.25rem;
    border-radius: 10px;
    border: 1.5px solid var(--reg-border);
    background: #FAFAF7;
    font-size: 0.875rem;
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
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--reg-border);
  }

  .reg-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.7rem 1.75rem;
    background: var(--reg-green);
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(27,94,59,0.3);
  }

  .reg-btn-primary:hover:not(:disabled) {
    background: var(--reg-green-l);
    box-shadow: 0 4px 16px rgba(27,94,59,0.35);
    transform: translateY(-1px);
  }

  .reg-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .reg-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.7rem 1.5rem;
    background: transparent;
    color: var(--reg-muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1.5px solid var(--reg-border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .reg-btn-secondary:hover {
    border-color: #C4BDB4;
    color: var(--reg-ink);
    background: #F5F3EF;
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
    border-radius: 50%;
    animation: reg-spin 0.7s linear infinite;
    display: inline-block;
  }

  .reg-spinner--sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }

  @keyframes reg-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .reg-page {
      padding: 1rem 0.75rem 2.5rem;
    }

    .reg-card {
      border-radius: 16px;
    }

    .reg-header {
      padding: 1.75rem 1.25rem 1.5rem;
    }

    .reg-form {
      padding: 0 1.25rem 1.75rem;
    }

    .reg-banner {
      margin-left: 1.25rem;
      margin-right: 1.25rem;
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
    .reg-btn-primary,
    .reg-btn-secondary {
      width: 100%;
      max-width: none;
    }

    .reg-actions {
      flex-direction: column;
    }

    .reg-btn-primary,
    .reg-btn-secondary {
      justify-content: center;
      min-height: 46px;
    }
  }
`