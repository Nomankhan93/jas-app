// src/routes/card.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  MembershipCard,
  type CardSide,
  type MembershipCardMember,
} from '../components/MembershipCard'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/card')({
  component: CardPage,
})

const JAS_LOGO_PATH = '/jas/logo.jpeg'
const JAS_FLAG_PATH = '/jas/flag.jpeg'

function CardPage() {
  const navigate = useNavigate()
  const visibleStageRef = useRef<HTMLDivElement>(null)
  const frontExportRef = useRef<HTMLDivElement>(null)
  const backExportRef = useRef<HTMLDivElement>(null)

  const [cardScale, setCardScale] = useState(1)
  const [selectedSide, setSelectedSide] = useState<CardSide>('front')
  const [loading, setLoading] = useState(true)
  const [downloadingSide, setDownloadingSide] = useState<CardSide | null>(null)
  const [member, setMember] = useState<MembershipCardMember | null>(null)
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
      const stageWidth = visibleStageRef.current?.clientWidth || CARD_WIDTH
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : stageWidth
      const minReadableScale = viewportWidth < 640 ? 0.44 : 0.58
      const nextScale = Math.min(1, Math.max(minReadableScale, stageWidth / CARD_WIDTH))
      setCardScale(Number(nextScale.toFixed(4)))
    }

    updateScale()

    const node = visibleStageRef.current
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
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate({ to: '/login' })
      return
    }

    const { data: rawData, error } = await supabase
      .from('members')
      .select(
        [
          'id',
          'member_no',
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
          'approved_at',
          'address',
          'date_of_birth',
          'gender',
          'education',
          'blood_group',
          'emergency_contact_name',
          'emergency_contact_relation',
          'emergency_contact_mobile',
          'declaration_accepted',
        ].join(', '),
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const data = rawData as unknown as MembershipCardMember | null

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

    const publicVerifyUrl = `${window.location.origin}/verify/${encodeURIComponent(
      data.member_no,
    )}`
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

  async function handleDownload(side: CardSide) {
    if (!member?.member_no) return

    const targetRef = side === 'front' ? frontExportRef : backExportRef
    if (!targetRef.current) return

    setDownloadingSide(side)
    setError('')

    try {
      const dataUrl = await toPng(targetRef.current, {
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
      link.download = `${member.member_no}-JAS-card-${side}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to download ${side} side. Please try again.`,
      )
    } finally {
      setDownloadingSide(null)
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
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-5 sm:space-y-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-emerald-700 no-underline"
          >
            Back to Dashboard
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Digital Membership Card
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Download the front or back side of your official JAS card.
              </p>
            </div>

            {member?.status === 'approved' && member.member_no ? (
              <CardSideToggle
                selectedSide={selectedSide}
                onSelect={setSelectedSide}
              />
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {member?.status === 'approved' && member.member_no ? (
          <>
            <section className="rounded-2xl bg-white/70 p-3 pb-2 shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
              <p className="mb-2 text-center text-xs font-medium text-slate-500 sm:hidden">Swipe sideways to preview the full card.</p>
              <div ref={visibleStageRef} className="w-full overflow-x-auto pb-2">
                <ScaledCardShell scale={cardScale}>
                  <MembershipCard
                    side={selectedSide}
                    member={member}
                    photoUrl={photoUrl}
                    logoUrl={logoUrl}
                    flagUrl={flagUrl}
                    qrUrl={qrUrl}
                    verifyUrl={verifyUrl}
                  />
                </ScaledCardShell>
              </div>
            </section>

            <div className="grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
              <button
                type="button"
                onClick={() => handleDownload('front')}
                disabled={downloadingSide !== null}
                className="h-11 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {downloadingSide === 'front'
                  ? 'Downloading front...'
                  : 'Download Front as PNG'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload('back')}
                disabled={downloadingSide !== null}
                className="h-11 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {downloadingSide === 'back'
                  ? 'Downloading back...'
                  : 'Download Back as PNG'}
              </button>

              <Link
                to="/verify/$memberNo"
                params={{ memberNo: member.member_no }}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
              >
                Open Verification Page
              </Link>
            </div>

            <ExportCards
              member={member}
              photoUrl={photoUrl}
              logoUrl={logoUrl}
              flagUrl={flagUrl}
              qrUrl={qrUrl}
              verifyUrl={verifyUrl}
              frontRef={frontExportRef}
              backRef={backExportRef}
            />
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

function CardSideToggle({
  selectedSide,
  onSelect,
}: {
  selectedSide: CardSide
  onSelect: (side: CardSide) => void
}) {
  const labels: Record<CardSide, string> = {
    front: 'Front',
    back: 'Back',
  }

  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
      {(['front', 'back'] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => onSelect(side)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
            selectedSide === side
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          {labels[side]}
        </button>
      ))}
    </div>
  )
}

function ScaledCardShell({
  scale,
  children,
}: {
  scale: number
  children: React.ReactNode
}) {
  return (
    <div
      className="mx-auto"
      style={{
        width: `${CARD_WIDTH * scale}px`,
        height: `${CARD_HEIGHT * scale}px`,
      }}
    >
      <div
        style={{
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ExportCards({
  member,
  photoUrl,
  logoUrl,
  flagUrl,
  qrUrl,
  verifyUrl,
  frontRef,
  backRef,
}: {
  member: MembershipCardMember
  photoUrl: string | null
  logoUrl: string | null
  flagUrl: string | null
  qrUrl: string | null
  verifyUrl: string
  frontRef: React.RefObject<HTMLDivElement | null>
  backRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      className="pointer-events-none fixed left-[-10000px] top-0"
      aria-hidden="true"
    >
      <div ref={frontRef}>
        <MembershipCard
          side="front"
          member={member}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          flagUrl={flagUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
        />
      </div>

      <div ref={backRef}>
        <MembershipCard
          side="back"
          member={member}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          flagUrl={flagUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
        />
      </div>
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