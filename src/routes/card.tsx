import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/card')({
  component: CardPage,
})

type Member = {
  id: string
  member_no: string | null
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  profession: string | null
  caste_branch: string | null
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
}

function CardPage() {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [verifyUrl, setVerifyUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCard()
  }, [])

  async function loadCard() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate({ to: '/login' })
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select(
        'id, member_no, full_name, father_name, cnic, mobile, district, profession, caste_branch, photo_url, status, approved_at',
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data) {
      setError('Membership form not found.')
      setLoading(false)
      return
    }

    setMember(data)

    if (data.status !== 'approved' || !data.member_no) {
      setError('Your membership is not approved yet.')
      setLoading(false)
      return
    }

    const encodedMemberNo = encodeURIComponent(data.member_no)
    const publicVerifyUrl = `${window.location.origin}/verify/${encodedMemberNo}`
    setVerifyUrl(publicVerifyUrl)

    const generatedQr = await QRCode.toDataURL(publicVerifyUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })

    setQrUrl(generatedQr)

    const { data: signed } = await supabase.storage
      .from('member-photos')
      .createSignedUrl(data.photo_url, 60 * 60)

    if (signed?.signedUrl) {
      const dataUrl = await imageUrlToDataUrl(signed.signedUrl)
      setPhotoUrl(dataUrl || signed.signedUrl)
    }

    setLoading(false)
  }

  async function handleDownload() {
    if (!cardRef.current || !member?.member_no) return

    setDownloading(true)

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `${member.member_no}-JAS-card.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to download card. Please try again.',
      )
    }

    setDownloading(false)
  }

  if (loading) {
    return (
      <main className="px-4 py-10">
        <div className="page-wrap rounded-2xl bg-white p-6 shadow-sm">
          Loading digital card...
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-10">
      <div className="page-wrap space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-emerald-700 no-underline"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Digital Membership Card
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Download your official JAS digital ID card with QR verification.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {member?.status === 'approved' && member.member_no ? (
          <>
            <section className="flex justify-center">
              <div
                ref={cardRef}
                className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-emerald-900/20 bg-white shadow-2xl"
              >
                <div className="relative bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 p-7 text-white">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-white/10" />
                  <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-white/10" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                        Jatt Alliance Sindh
                      </p>
                      <h2 className="mt-2 text-4xl font-black tracking-tight">
                        Digital Member ID
                      </h2>
                      <p className="mt-2 text-sm text-emerald-50">
                        Verified membership card
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold">
                      VERIFIED
                    </div>
                  </div>
                </div>

                <div className="grid gap-7 p-7 md:grid-cols-[180px_1fr_170px]">
                  <div className="space-y-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={member.full_name}
                        className="h-44 w-44 rounded-3xl object-cover ring-4 ring-emerald-50"
                      />
                    ) : (
                      <div className="flex h-44 w-44 items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-500">
                        No photo
                      </div>
                    )}

                    <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Member No
                      </p>
                      <p className="mt-1 text-sm font-black text-emerald-950">
                        {member.member_no}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Member Name
                      </p>
                      <h3 className="mt-1 text-3xl font-black text-slate-950">
                        {member.full_name}
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Info label="Father Name" value={member.father_name} />
                      <Info label="CNIC" value={member.cnic} />
                      <Info label="Mobile" value={member.mobile} />
                      <Info label="District" value={member.district} />
                      <Info
                        label="Profession"
                        value={member.profession || 'Not provided'}
                      />
                      <Info
                        label="Caste Branch"
                        value={member.caste_branch || 'Not provided'}
                      />
                      <Info
                        label="Approved Date"
                        value={
                          member.approved_at
                            ? new Date(member.approved_at).toLocaleDateString()
                            : 'N/A'
                        }
                      />
                      <Info label="Status" value="Approved" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt="Verification QR"
                        className="h-36 w-36 rounded-xl bg-white p-2"
                      />
                    ) : (
                      <div className="h-36 w-36 rounded-xl bg-slate-100" />
                    )}

                    <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Scan to verify
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 px-7 py-4">
                  <p className="text-xs leading-5 text-slate-500">
                    This card is digitally generated by Jatt Alliance Sindh.
                    Verification URL: {verifyUrl}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {downloading ? 'Downloading...' : 'Download Card as PNG'}
              </button>

              <Link
                to="/verify/$memberNo"
                params={{ memberNo: member.member_no }}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
              >
                Open Verification Page
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-slate-700">
              Your digital card will be available after admin approval.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  )
}

async function imageUrlToDataUrl(url: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}