import { createFileRoute, Link } from '@tanstack/react-router'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Copy,
  Download,
  ExternalLink,
  Landmark,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { forwardRef, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildOfficeBearerId,
  fetchMyDesignationCards,
  formatOfficeBearerDisplayText,
  formatTenure,
  getCommitteeLocation,
  getCommitteeTypeLabel,
  getInitials,
  getOfficeBearerVerificationUrl,
  type DesignationCardRecord,
} from '../lib/committees-public'

export const Route = createFileRoute('/designation-card')({
  component: DesignationCardPage,
})

const JAS_LOGO_PATH = '/jas/logo.jpeg'
const JAS_SIGNATURE_PATH = '/jas/signature.png'
const OFFICE_CARD_WIDTH = 1012
const OFFICE_CARD_HEIGHT = 638

type CardSide = 'front' | 'back'

function DesignationCardPage() {
  const [cards, setCards] = useState<DesignationCardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCards() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchMyDesignationCards()
        if (!cancelled) setCards(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load office bearer card.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCards()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-12">
      <div className="page-wrap space-y-7">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="relative bg-[linear-gradient(135deg,#031c18,#073827_45%,#102133)] p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 24px 24px,#f6d56f 2px,transparent 2px)', backgroundSize: '44px 44px' }} />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#f6d56f]/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#f6d56f]">
                  <Award className="h-4 w-4" />
                  Official Authority Card
                </p>
                <h1 className="mt-4 text-[clamp(2.3rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.06em]">
                  Office Bearer
                  <span className="block text-[#f6d56f]">Designation Card</span>
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/72">
                  Premium digital authority card for active JAS committee office bearers. This card is separate from the standard membership card and remains valid only while the designation is active.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white px-5 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-[#f6d56f]">
                  <Printer size={16} />
                  Print
                </button>
                <Link to="/committees" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#f6d56f] px-5 text-sm font-black text-emerald-950 no-underline shadow-sm transition hover:bg-amber-300">
                  Public Committees
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <StateCard message="Loading office bearer card..." />
        ) : error ? (
          <StateCard message={error} tone="error" />
        ) : cards.length === 0 ? (
          <EmptyDesignationState />
        ) : (
          <section className="space-y-8">
            {cards.map((card) => (
              <OfficeBearerCardPackage key={card.id} card={card} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export function OfficeBearerCardPackage({
  card,
  adminPreview = false,
}: {
  card: DesignationCardRecord
  adminPreview?: boolean
}) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [selectedSide, setSelectedSide] = useState<CardSide>('front')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState<CardSide | 'both' | null>(null)
  const [downloadError, setDownloadError] = useState('')
  const [copied, setCopied] = useState(false)

  const verificationUrl = useMemo(() => buildVerificationUrl(card), [card])
  const officeBearerId = useMemo(() => buildOfficeBearerId(card), [card])
  const displayDesignation = formatOfficeBearerDisplayText(card.designation_title)
  const displayMemberName = formatOfficeBearerDisplayText(card.member.full_name || card.full_name_snapshot)
  const cardTitle = adminPreview ? 'Admin office bearer card preview' : 'My office bearer card'

  useEffect(() => {
    let cancelled = false

    async function generateQr() {
      try {
        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 340,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#06130f',
            light: '#ffffff',
          },
        })

        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        if (!cancelled) setQrDataUrl('')
      }
    }

    void generateQr()

    return () => {
      cancelled = true
    }
  }, [verificationUrl])

  async function downloadSide(side: CardSide) {
    const target = side === 'front' ? frontRef.current : backRef.current

    if (!target) {
      throw new Error(`Unable to prepare ${side} side for download.`)
    }

    const dataUrl = await toPng(target, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })

    downloadDataUrl(dataUrl, `${officeBearerId}-${side}.png`)
  }

  async function handleDownload(target: CardSide | 'both') {
    setDownloadError('')
    setDownloading(target)

    try {
      if (target === 'both') {
        await downloadSide('front')
        await new Promise((resolve) => window.setTimeout(resolve, 250))
        await downloadSide('back')
      } else {
        await downloadSide(target)
      }
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Failed to download office bearer card.',
      )
    } finally {
      setDownloading(null)
    }
  }


  async function copyVerificationUrl() {
    try {
      await navigator.clipboard.writeText(verificationUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setDownloadError('Unable to copy verification link. Open the verification page and copy it manually.')
    }
  }

  return (
    <article className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5 print:p-0 print:shadow-none print:ring-0">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            {cardTitle}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {displayDesignation} · {displayMemberName}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Office bearer ID: <span className="font-black text-slate-700">{officeBearerId}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSide('front')}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${selectedSide === 'front' ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setSelectedSide('back')}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${selectedSide === 'back' ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void handleDownload(selectedSide)}
            disabled={Boolean(downloading)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f6d56f] px-4 py-2 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            {downloading === selectedSide ? 'Downloading...' : 'Download Side'}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload('both')}
            disabled={Boolean(downloading)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            Both Sides
          </button>
          <button
            type="button"
            onClick={() => void copyVerificationUrl()}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
          >
            <Copy size={16} />
            {copied ? 'Copied' : 'Copy Verify Link'}
          </button>
          <a
            href={verificationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            Open Verify
          </a>
        </div>
      </div>

      {downloadError ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100 print:hidden">
          {downloadError}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.65rem] bg-slate-100 p-3 print:overflow-visible print:bg-white print:p-0">
        <div className="relative mx-auto w-max">
          <div className={selectedSide === 'front' ? 'block' : 'absolute left-0 top-0 -z-10 opacity-0 print:static print:z-auto print:mb-6 print:opacity-100'}>
            <OfficeBearerCardFront ref={frontRef} card={card} officeBearerId={officeBearerId} />
          </div>
          <div className={selectedSide === 'back' ? 'block' : 'absolute left-0 top-0 -z-10 opacity-0 print:static print:z-auto print:opacity-100'}>
            <OfficeBearerCardBack ref={backRef} card={card} qrDataUrl={qrDataUrl} officeBearerId={officeBearerId} verificationUrl={verificationUrl} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function DesignationCard({ card }: { card: DesignationCardRecord }) {
  return <OfficeBearerCardPackage card={card} />
}

const OfficeBearerCardFront = forwardRef<HTMLDivElement, {
  card: DesignationCardRecord
  officeBearerId: string
}>(function OfficeBearerCardFront(
  { card, officeBearerId },
  ref,
) {
  const committee = card.committee
  const memberName = formatOfficeBearerDisplayText(card.member.full_name || card.full_name_snapshot)
  const fatherName = formatOfficeBearerDisplayText(card.member.father_name || card.father_name_snapshot || 'N/A')
  const designationTitle = formatOfficeBearerDisplayText(card.designation_title)
  const committeeName = formatOfficeBearerDisplayText(committee?.name || 'Committee record')
  const memberNo = card.member.member_no || card.member_no_snapshot || 'Not issued'
  const location = committee ? getCommitteeLocation(committee) : getSnapshotLocation(card)
  const tenure = formatTenure(card.tenure_start || committee?.tenure_start, card.tenure_end || committee?.tenure_end)
  const level = committee ? getCommitteeTypeLabel(committee.committee_type) : 'JAS Committee'
  const compactOfficeBearerId = officeBearerId.replace(/^JAS-OB-/, 'OB-')

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[34px] bg-[#06130f] text-white shadow-2xl ring-1 ring-amber-200/60"
      style={{ width: OFFICE_CARD_WIDTH, height: OFFICE_CARD_HEIGHT }}
    >
      <PremiumCardBackground />

      <div className="relative z-10 flex h-full flex-col p-[26px]">
        <div className="flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-[26px] border border-[#f6d56f]/50 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <img src={JAS_LOGO_PATH} alt="JAS" className="h-full w-full rounded-[20px] object-cover" draggable={false} />
            </div>

            <div className="min-w-0">
              <p className="text-[17px] font-black uppercase tracking-[0.42em] text-[#f6d56f]">Jatt Alliance Sindh</p>
              <h3 className="mt-2 text-[52px] font-black uppercase leading-[0.9] tracking-[-0.035em]">Office Bearer</h3>
              <p className="mt-2.5 text-[18px] font-black uppercase tracking-[0.18em] text-white/70">Official designation authority card</p>
            </div>
          </div>

          <div className="shrink-0 rounded-[28px] border border-[#f6d56f]/40 bg-[#f6d56f] px-7 py-4 text-right text-emerald-950 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
            <p className="text-[13px] font-black uppercase tracking-[0.2em]">Status</p>
            <p className="mt-1 flex items-center justify-end gap-2 text-[24px] font-black uppercase">
              <BadgeCheck className="h-6 w-6" /> Active
            </p>
          </div>
        </div>

        <div className="mt-6 grid min-h-0 flex-1 grid-cols-[214px_1fr_196px] gap-5">
          <div className="space-y-4">
            <div className="relative h-[214px] w-[214px] overflow-hidden rounded-[32px] border-[6px] border-white bg-white shadow-[0_22px_55px_rgba(0,0,0,0.33)]">
              {card.photoSignedUrl ? (
                <img src={card.photoSignedUrl} alt={memberName} className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#08251c,#0f5138)] text-[52px] font-black text-[#f6d56f]">
                  {getInitials(memberName)}
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-3.5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6d56f]">Member ID</p>
              <p className="mt-1 whitespace-nowrap text-[20px] font-black uppercase leading-tight text-white">{memberNo}</p>
            </div>
          </div>

          <div className="min-h-0 min-w-0 rounded-[32px] border border-white/12 bg-white/[0.08] p-5 backdrop-blur">
            <p className="text-[15px] font-black uppercase tracking-[0.25em] text-[#f6d56f]">{designationTitle}</p>
            <h4 className="mt-3 text-[48px] font-black leading-[0.96] tracking-[-0.05em] text-white">{memberName}</h4>
            <p className="mt-2.5 text-[19px] font-bold text-white/68">Father: {fatherName}</p>

            <div className="mt-5 grid grid-cols-2 gap-3.5">
              <PremiumInfo label="Committee" value={committeeName} icon={<Landmark className="h-5 w-5" />} />
              <PremiumInfo label="Level" value={level} icon={<ShieldCheck className="h-5 w-5" />} />
              <PremiumInfo label="Location" value={location} icon={<MapPin className="h-5 w-5" />} />
              <PremiumInfo label="Tenure" value={tenure} icon={<CalendarDays className="h-5 w-5" />} compact />
            </div>

            <div className="mt-4 rounded-[20px] border border-[#f6d56f]/30 bg-[#f6d56f]/10 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">Authority note</p>
              <p className="mt-1 line-clamp-1 text-[13px] font-bold leading-5 text-white/72">
                Valid only with an active JAS committee designation.
              </p>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-3">
            <div className="rounded-[24px] border border-[#f6d56f]/50 bg-[#f6d56f] px-4 py-4 text-emerald-950 shadow-[0_18px_42px_rgba(0,0,0,0.26)]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Card Type</p>
              <p className="mt-2 text-[24px] font-black uppercase leading-none">Authority</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] opacity-70">Office bearer designation</p>
            </div>

            <div className="rounded-[24px] border border-[#f6d56f]/40 bg-[#06130f]/78 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">Office Bearer ID</p>
              <p className="mt-2 whitespace-nowrap text-[16px] font-black leading-tight tracking-[-0.02em] text-white">{compactOfficeBearerId}</p>
              <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/42">Full ID and QR on reverse</p>
            </div>

            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)] backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-950">
                <QrCode className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">QR on back</p>
              <p className="mt-1.5 text-[12px] font-bold leading-4 text-white/68">
                Scan reverse side to verify the active authority record.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-[#f6d56f]" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/82">Active record</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
})

const OfficeBearerCardBack = forwardRef<HTMLDivElement, {
  card: DesignationCardRecord
  qrDataUrl: string
  officeBearerId: string
  verificationUrl: string
}>(function OfficeBearerCardBack(
  { card, qrDataUrl, officeBearerId, verificationUrl },
  ref,
) {
  const committee = card.committee
  const memberName = formatOfficeBearerDisplayText(card.member.full_name || card.full_name_snapshot)
  const designationTitle = formatOfficeBearerDisplayText(card.designation_title)
  const committeeName = formatOfficeBearerDisplayText(committee?.name || 'Committee record')
  const memberNo = card.member.member_no || card.member_no_snapshot || 'Not issued'
  const location = committee ? getCommitteeLocation(committee) : getSnapshotLocation(card)
  const tenure = formatTenure(card.tenure_start || committee?.tenure_start, card.tenure_end || committee?.tenure_end)
  const displayVerificationUrl = formatVerificationUrlForCard(verificationUrl)

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[34px] bg-[#f8faf7] text-slate-950 shadow-2xl ring-1 ring-amber-200/80"
      style={{ width: OFFICE_CARD_WIDTH, height: OFFICE_CARD_HEIGHT }}
    >
      <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle at 18% 16%,rgba(246,213,111,.32),transparent 24%),radial-gradient(circle at 88% 14%,rgba(6,83,61,.12),transparent 28%),linear-gradient(135deg,#ffffff,#fbf7e8 48%,#eef8f2)' }} />
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#06130f]/10" />
      <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-[#f6d56f]/30" />

      <div className="relative z-10 flex h-full flex-col p-[24px]">
        <div className="flex items-start justify-between gap-5 border-b-4 border-[#d5ad44] pb-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[20px] bg-[#06130f] p-1.5 shadow-xl">
              <img src={JAS_LOGO_PATH} alt="JAS" className="h-full w-full rounded-[16px] object-cover" draggable={false} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-800">Issuing Authority</p>
              <h3 className="mt-1 text-[31px] font-black uppercase leading-none tracking-[-0.01em] text-slate-950">Jatt Alliance Sindh</h3>
              <p className="mt-1 text-[13px] font-bold text-slate-500">Office bearer verification, authority and conditions</p>
            </div>
          </div>

          <div className="shrink-0 rounded-[22px] bg-[#06130f] px-5 py-3 text-right text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">Card Type</p>
            <p className="mt-1 text-[20px] font-black uppercase">Authority</p>
          </div>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_238px] gap-4">
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <BackInfo label="Bearer Name" value={memberName} />
              <BackInfo label="Member Number" value={memberNo} />
              <BackInfo label="Designation" value={designationTitle} />
              <BackInfo label="Office Bearer ID" value={officeBearerId} />
              <BackInfo label="Committee" value={committeeName} />
              <BackInfo label="Jurisdiction" value={location} />
              <BackInfo label="Tenure" value={tenure} wide />
              <BackInfo label="Verification Status" value="Active authority record" />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[1fr_286px] gap-3">
              <div className="rounded-[22px] border border-slate-200 bg-white/84 p-3.5 shadow-sm">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-800">Terms & Conditions</p>
                <ul className="mt-2.5 space-y-1.5 text-[12px] font-bold leading-[1.45] text-slate-700">
                  <li>• Valid only with active office bearer designation in official JAS records.</li>
                  <li>• Misuse, transfer, alteration or unauthorized use is prohibited.</li>
                  <li>• Verify through QR before accepting any office bearer authority.</li>
                </ul>
                <p className="mt-2.5 rounded-2xl bg-amber-50 px-3 py-2 text-[10.5px] font-black uppercase leading-4 tracking-[0.08em] text-amber-900 ring-1 ring-amber-100">
                  Expired, suspended, resigned or completed designations make this card invalid.
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/88 p-3.5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Authorized Signature</p>
                <div className="mt-1.5 flex h-[100px] items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                  <img src={JAS_SIGNATURE_PATH} alt="Authorized signature" className="h-[96px] w-[270px] scale-[1.16] object-contain brightness-75 contrast-150 saturate-0" draggable={false} />
                </div>
                <div className="mt-1.5 h-[2px] w-full bg-slate-500" />
                <p className="mt-1 text-[12.5px] font-black leading-none text-slate-950">Authorized Signature</p>
                <p className="mt-1 text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-500">JAS Central Office</p>
              </div>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-2.5 rounded-[28px] bg-[#06130f] p-3.5 text-white shadow-xl">
            <div className="rounded-[22px] bg-white p-2.5 text-center text-slate-950">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verification QR" className="mx-auto h-[152px] w-[152px]" draggable={false} />
              ) : (
                <div className="mx-auto flex h-[152px] w-[152px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><QrCode /></div>
              )}
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Scan to verify</p>
            </div>

            <div className="rounded-[20px] border border-white/12 bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">Verification URL</p>
              <p className="mt-1.5 break-all text-[9.8px] font-semibold leading-3.5 text-white/70">{displayVerificationUrl}</p>
            </div>

            <div className="rounded-[20px] border border-[#f6d56f]/40 bg-[#f6d56f] p-3 text-emerald-950">
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">Issuing Organization</p>
              <p className="mt-1 text-[16px] font-black leading-tight">Jatt Alliance Sindh</p>
              <p className="mt-0.5 text-[11px] font-bold opacity-75">Sindh, Pakistan</p>
            </div>

            <div className="rounded-[20px] border border-white/12 bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f6d56f]">Official Notice</p>
              <p className="mt-1 text-[10.5px] font-semibold leading-3.5 text-white/70">
                This card verifies current office bearer authority only and does not replace the membership card.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
})

function PremiumCardBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#06130f,#073827_42%,#0f172a)]" />
      <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(circle at 18% 18%,#f6d56f 0,transparent 28%),radial-gradient(circle at 88% 12%,#d5ad44 0,transparent 25%),radial-gradient(circle at 90% 90%,#10b981 0,transparent 30%)' }} />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[54px] border-[#f6d56f]/12" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#f6d56f]/10" />
      <div className="absolute inset-x-0 top-0 h-[10px] bg-[#f6d56f]" />
      <div className="absolute inset-x-0 bottom-0 h-[10px] bg-[#f6d56f]" />
    </>
  )
}

function PremiumInfo({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: ReactNode
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/18 p-3.5">
      <div className="flex items-center gap-2 text-[#f6d56f]">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">{label}</p>
      </div>
      <p className={`${compact ? 'text-[14px] leading-5' : 'text-[16px] leading-5'} mt-2 line-clamp-2 font-black text-white`}>{value}</p>
    </div>
  )
}

function BackInfo({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[18px] border border-slate-200 bg-white/82 px-3 py-2 shadow-sm ${wide ? 'col-span-1' : ''}`}>
      <p className="text-[9.8px] font-black uppercase tracking-[0.18em] text-emerald-800">{label}</p>
      <p className={`${wide ? 'line-clamp-1 text-[13.5px]' : 'line-clamp-2 text-[14.5px]'} mt-1 font-black leading-5 text-slate-950`}>{value}</p>
    </div>
  )
}

function EmptyDesignationState() {
  return (
    <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-10">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#06130f,#0f5138)] text-[#f6d56f] shadow-sm ring-1 ring-emerald-900/10">
        <UserRound size={32} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">No active office bearer designation found</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
        Your membership account does not currently have an active committee designation. If you were appointed, ask the admin to assign your committee role.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/card" className="primary-btn no-underline">Open Membership Card</Link>
        <Link to="/committees" className="secondary-btn no-underline">View Public Committees</Link>
      </div>
    </section>
  )
}

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`rounded-[1.5rem] p-5 text-sm font-bold ring-1 ${tone === 'error' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-white text-slate-600 ring-slate-200'}`}>
      {message}
    </div>
  )
}

function getSnapshotLocation(card: DesignationCardRecord) {
  return [card.taluka_snapshot, card.district_snapshot].filter(Boolean).join(', ') || 'Sindh'
}

function buildVerificationUrl(card: DesignationCardRecord) {
  const rawUrl = getOfficeBearerVerificationUrl(card)
  const publicBaseUrl = String(
    import.meta.env.VITE_PUBLIC_SITE_URL ||
      import.meta.env.VITE_APP_URL ||
      import.meta.env.VITE_SITE_URL ||
      '',
  )
    .trim()
    .replace(/\/+$/, '')

  if (!publicBaseUrl) return rawUrl

  try {
    const url = new URL(rawUrl, publicBaseUrl)
    return `${publicBaseUrl}${url.pathname}${url.search}${url.hash}`
  } catch {
    return rawUrl
  }
}

function formatVerificationUrlForCard(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url.replace(/^https?:\/\//, '')
  }
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
