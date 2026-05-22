import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

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
  Badin: ['Badin', 'Matli', 'Shaheed Fazil Rahu (Golarchi)', 'Talhar', 'Tando Bago'],

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

  Tharparkar: ['Chachro', 'Dahli', 'Diplo', 'Islamkot', 'Kaloi', 'Mithi', 'Nagarparkar'],

  Umerkot: ['Kunri', 'Pithoro', 'Samaro', 'Umerkot'],

  'Naushahro Firoze': ['Bhiria', 'Kandiaro', 'Mehrabpur', 'Moro', 'Naushahro Firoze'],

  Sanghar: ['Jam Nawaz Ali', 'Khipro', 'Sanghar', 'Shahdadpur', 'Sinjhoro', 'Tando Adam'],

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

type ExistingMember = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
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
  const [photo, setPhoto] = useState<File | null>(null)

  const [error, setError] = useState('')

  const talukaOptions = useMemo(() => {
    return district ? talukasByDistrict[district] || [] : []
  }, [district])

  useEffect(() => {
    loadExisting()
  }, [])

  async function loadExisting() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate({ to: '/login' })
      return
    }

    setUserId(user.id)

    const { data, error } = await supabase
      .from('members')
      .select(
        'id, status, full_name, father_name, cnic, mobile, district, taluka, profession, caste_branch, photo_url',
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

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
    }

    setLoading(false)
  }

  function handleDistrictChange(value: string) {
    setDistrict(value)
    setTaluka('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!userId) {
      setError('You must be logged in.')
      return
    }

    if (existingMember && existingMember.status !== 'pending') {
      setError('Only pending membership forms can be edited.')
      return
    }

    if (!existingMember && !photo) {
      setError('Photo is required.')
      return
    }

    if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(cnic)) {
      setError('CNIC format must be 12345-1234567-1')
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

    setSubmitting(true)

    let photoPath = existingMember?.photo_url ?? ''

    if (photo) {
      const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      photoPath = `${userId}/photo-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(photoPath, photo, {
          upsert: true,
          contentType: photo.type,
        })

      if (uploadError) {
        setError(uploadError.message)
        setSubmitting(false)
        return
      }
    }

    if (existingMember) {
      const { error: updateError } = await supabase
        .from('members')
        .update({
          full_name: fullName,
          father_name: fatherName,
          cnic,
          mobile,
          district,
          taluka,
          profession: profession || null,
          caste_branch: casteBranch || null,
          photo_url: photoPath,
        })
        .eq('id', existingMember.id)

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('members').insert({
        user_id: userId,
        full_name: fullName,
        father_name: fatherName,
        cnic,
        mobile,
        district,
        taluka,
        profession: profession || null,
        caste_branch: casteBranch || null,
        photo_url: photoPath,
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
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading form...</p>
        </div>
      </main>
    )
  }

  const locked = existingMember?.status === 'approved'

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-700">
            Jatt Alliance Sindh
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Membership Registration
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit your profile and photo for admin review.
          </p>
        </div>

        {existingMember?.status === 'approved' ? (
          <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Your membership is approved. You cannot edit this form now.
          </div>
        ) : null}

        {existingMember?.status === 'rejected' ? (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            Your application was rejected. Editing rejected forms is not enabled
            yet.
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name">
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={locked}
                required
                className="input"
                placeholder="Enter full name"
              />
            </Field>

            <Field label="Father Name">
              <input
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
                disabled={locked}
                required
                className="input"
                placeholder="Enter father name"
              />
            </Field>

            <Field label="CNIC">
              <input
                value={cnic}
                onChange={(event) => setCnic(event.target.value)}
                disabled={locked}
                required
                className="input"
                placeholder="12345-1234567-1"
              />
            </Field>

            <Field label="Mobile">
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                disabled={locked}
                required
                className="input"
                placeholder="03001234567"
              />
            </Field>

            <Field label="District">
              <select
                value={district}
                onChange={(event) => handleDistrictChange(event.target.value)}
                disabled={locked}
                required
                className="input"
              >
                <option value="">Select district</option>
                {sindhDistricts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Taluka / Town / Sub-division">
              <select
                value={taluka}
                onChange={(event) => setTaluka(event.target.value)}
                disabled={locked || !district}
                required
                className="input"
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

            <Field label="Profession">
              <input
                value={profession}
                onChange={(event) => setProfession(event.target.value)}
                disabled={locked}
                className="input"
                placeholder="Optional"
              />
            </Field>

            <Field label="Caste Branch">
              <input
                value={casteBranch}
                onChange={(event) => setCasteBranch(event.target.value)}
                disabled={locked}
                className="input"
                placeholder="Optional"
              />
            </Field>

            <Field label="Photo">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                disabled={locked}
                required={!existingMember}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-800"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                submitting || locked || existingMember?.status === 'rejected'
              }
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting
                ? 'Saving...'
                : existingMember
                  ? 'Update Form'
                  : 'Submit Form'}
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: '/dashboard' })}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  )
}