import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/card')({
  component: CardPage,
})

const JAS_LOGO_PATH = '/jas/logo.jpeg'
const JAS_FLAG_PATH = '/jas/flag.jpeg'

const CARD_WIDTH = 1280
const CARD_HEIGHT = 760

type Member = {
  id: string
  member_no: string | null
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
}

function CardPage() {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const cardStageRef = useRef<HTMLDivElement>(null)

  const [cardScale, setCardScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [flagUrl, setFlagUrl] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [verifyUrl, setVerifyUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCard()
  }, [])

  useEffect(() => {
    const updateScale = () => {
      const stageWidth = cardStageRef.current?.clientWidth || CARD_WIDTH
      const nextScale = Math.min(1, stageWidth / CARD_WIDTH)
      setCardScale(Number(nextScale.toFixed(4)))
    }

    updateScale()

    const node = cardStageRef.current
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScale)
        : null

    if (node && resizeObserver) {
      resizeObserver.observe(node)
    }

    window.addEventListener('resize', updateScale)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  async function loadCard() {
    setLoading(true)
    setError('')

    const [logoDataUrl, flagDataUrl] = await Promise.all([
      imageUrlToDataUrl(JAS_LOGO_PATH),
      imageUrlToDataUrl(JAS_FLAG_PATH),
    ])

    setLogoUrl(logoDataUrl || JAS_LOGO_PATH)
    setFlagUrl(flagDataUrl || JAS_FLAG_PATH)

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
        'id, member_no, full_name, father_name, cnic, mobile, district, taluka, profession, caste_branch, photo_url, status, approved_at',
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
      width: 280,
      margin: 1,
      color: {
        dark: '#111827',
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
    setError('')

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        canvasWidth: CARD_WIDTH * 2,
        canvasHeight: CARD_HEIGHT * 2,
        style: {
          margin: '0',
          transform: 'none',
        },
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
    } finally {
      setDownloading(false)
    }
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
            <section className="pb-2">
              <div ref={cardStageRef} className="w-full">
                <div
                  className="mx-auto"
                  style={{
                    width: `${CARD_WIDTH * cardScale}px`,
                    height: `${CARD_HEIGHT * cardScale}px`,
                  }}
                >
                  <div
                    style={{
                      width: `${CARD_WIDTH}px`,
                      height: `${CARD_HEIGHT}px`,
                      transform: `scale(${cardScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div
                      ref={cardRef}
                      className="flex shrink-0 flex-col overflow-hidden rounded-[2rem] border border-emerald-900/20 bg-white shadow-2xl"
                      style={{
                        width: `${CARD_WIDTH}px`,
                        minWidth: `${CARD_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`,
                      }}
                    >
                      <div className="relative h-[200px] overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 px-8 py-7 text-white">
                        <div className="absolute right-0 top-0 h-48 w-48 rounded-bl-full bg-yellow-300/12" />
                        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-tr-full bg-white/8" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_34%)]" />

                        <div className="relative flex items-start justify-between gap-6">
                          <div className="flex items-start gap-5">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="Jatt Alliance Sindh logo"
                                className="mt-1 h-24 w-24 rounded-full border-2 border-yellow-400 bg-white object-cover shadow-xl"
                              />
                            ) : null}

                            <div className="max-w-[760px]">
                              <p className="text-[14px] font-black uppercase tracking-[0.38em] text-yellow-300">
                                Digital Member ID
                              </p>

                              <h2 className="mt-3 whitespace-nowrap text-[66px] font-black uppercase leading-[0.94] tracking-tight text-white">
                                JATT ALLIANCE SINDH
                              </h2>

                              <p className="mt-3 text-[16px] font-medium text-emerald-50">
                                Official verified membership card
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[1.1rem] border border-yellow-300/70 bg-yellow-300 px-7 py-4 text-[18px] font-black uppercase tracking-wide text-emerald-950 shadow-lg">
                            VERIFIED
                          </div>
                        </div>
                      </div>

                      <div className="relative flex-1 overflow-hidden bg-white">
                        {flagUrl ? (
                          <>
                            <img
                              src={flagUrl}
                              alt=""
                              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.10] mix-blend-multiply"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-white/[0.78]" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.92] via-white/[0.82] to-white/[0.72]" />
                          </>
                        ) : null}

                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.045]"
                          />
                        ) : null}

                        <div className="relative grid h-full grid-cols-[250px_1fr_220px] gap-8 p-8">
                          <div className="space-y-4">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={member.full_name}
                                className="h-[240px] w-[240px] rounded-[2rem] border-4 border-white object-cover shadow-lg ring-2 ring-yellow-300/80"
                              />
                            ) : (
                              <div className="flex h-[240px] w-[240px] items-center justify-center rounded-[2rem] bg-slate-100 text-sm text-slate-500 shadow-sm ring-2 ring-yellow-300/60">
                                No photo
                              </div>
                            )}

                            <div className="rounded-[1.4rem] border border-yellow-300 bg-emerald-950 px-4 py-4 text-center shadow-sm">
                              <p className="text-[13px] font-black uppercase tracking-wide text-yellow-300">
                                Member No
                              </p>
                              <p className="mt-1 text-[20px] font-black text-white">
                                {member.member_no}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <p className="text-[18px] font-bold uppercase tracking-wide text-slate-500">
                                Member Name
                              </p>
                              <h3 className="mt-2 text-[44px] font-black leading-tight text-slate-950">
                                {member.full_name}
                              </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                              <Info
                                label="Father Name"
                                value={member.father_name}
                              />
                              <Info label="CNIC" value={member.cnic} />
                              <Info label="Mobile" value={member.mobile} />
                              <Info label="District" value={member.district} />
                              <Info label="Taluka" value={member.taluka || 'Not provided'} />
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
                                    ? new Date(
                                        member.approved_at,
                                      ).toLocaleDateString()
                                    : 'N/A'
                                }
                              />
                              <Info label="Status" value="Approved" />
                            </div>
                          </div>

                          <div className="flex items-center justify-center">
                            <div className="flex h-[340px] w-[200px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt="Verification QR"
                                  className="h-[150px] w-[150px] rounded-xl bg-white p-2"
                                />
                              ) : (
                                <div className="h-[150px] w-[150px] rounded-xl bg-slate-100" />
                              )}

                              <p className="mt-5 text-center text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                                Scan to verify
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 bg-slate-50 px-8 py-5">
                        <p className="text-[14px] leading-6 text-slate-500">
                          This card is digitally generated by Jatt Alliance
                          Sindh. QR verification confirms current membership
                          status.
                          {verifyUrl ? (
                            <span className="ml-1 break-all">
                              Verification URL: {verifyUrl}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
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
      <p className="text-[14px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-bold leading-tight text-slate-950">
        {value}
      </p>
    </div>
  )
}

async function imageUrlToDataUrl(url: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}