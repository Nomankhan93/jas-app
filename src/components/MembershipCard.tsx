import type { ReactNode } from 'react'
import {
  getMemberDesignationTitle,
  type MemberCardDesignation,
} from '../lib/member-card-designation'

import { buildMemberCardIssueLabel } from '../lib/member-card-config'

export const CARD_WIDTH = 1280
export const CARD_HEIGHT = 760

export type CardSide = 'front' | 'back'

export type MembershipCardMember = {
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
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null

  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
  activeDesignation?: MemberCardDesignation | null
}

type MembershipCardProps = {
  side: CardSide
  member: MembershipCardMember
  photoUrl: string | null
  logoUrl: string | null
  flagUrl: string | null
  qrUrl: string | null
  verifyUrl: string
}

const SIGNATURE_PATH = '/jas/signature.png'

export function MembershipCard({
  side,
  member,
  photoUrl,
  logoUrl,
  flagUrl,
  qrUrl,
  verifyUrl,
}: MembershipCardProps) {
  return (
    <article
      className="relative isolate flex shrink-0 flex-col overflow-hidden rounded-[2rem] border border-yellow-500/40 bg-white text-slate-950 shadow-2xl ring-1 ring-emerald-950/10"
      style={{
        width: `${CARD_WIDTH}px`,
        minWidth: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
      }}
    >
      {side === 'front' ? (
        <CardFront
          member={member}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          flagUrl={flagUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
        />
      ) : (
        <CardBack
          member={member}
          logoUrl={logoUrl}
          flagUrl={flagUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
        />
      )}
    </article>
  )
}

function CardFront({
  member,
  photoUrl,
  logoUrl,
  flagUrl,
  qrUrl,
  verifyUrl,
}: Omit<MembershipCardProps, 'side'>) {
  const profession = member.profession || 'Not provided'
  const designationTitle = getMemberDesignationTitle(member.activeDesignation)

  return (
    <>
      <CardHeader
        logoUrl={logoUrl}
        label="Digital Member ID"
        title="JATT ALLIANCE SINDH"
        subtitle="Official verified membership card"
        badge="Verified"
      />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <SoftBackground logoUrl={logoUrl} flagUrl={flagUrl} />

        <div className="relative grid h-full grid-cols-[270px_1fr_230px] gap-8 p-8">
          <section className="space-y-4">
            <div className="rounded-[2.2rem] bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-500 p-[5px] shadow-xl">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${member.full_name} profile photo`}
                  className="h-[250px] w-[250px] rounded-[1.9rem] border-4 border-white object-cover object-top"
                  draggable={false}
                />
              ) : (
                <div className="flex h-[250px] w-[250px] items-center justify-center rounded-[1.9rem] border-4 border-white bg-slate-100 text-[16px] font-bold text-slate-500">
                  No photo
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-yellow-400 bg-slate-950 px-5 py-4 text-center shadow-lg">
              <p className="text-[13px] font-black uppercase tracking-[0.22em] text-yellow-300">
                Member No
              </p>
              <p className="mt-2 break-all text-[22px] font-black leading-tight text-white">
                {member.member_no || 'Not issued'}
              </p>
            </div>

            {designationTitle ? (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                  JAS Designation
                </p>
                <p className="mt-1 line-clamp-2 break-words text-[18px] font-black leading-tight text-slate-950">
                  {designationTitle}
                </p>
              </div>
            ) : null}
          </section>

          <section className="flex flex-col justify-between">
            <div>
              <p className="text-[16px] font-black uppercase tracking-[0.18em] text-slate-500">
                Member Name
              </p>
              <h3 className="mt-2 text-[46px] font-black leading-[1.04] tracking-tight text-slate-950">
                {member.full_name}
              </h3>

              <div className="mt-5 h-[3px] w-28 rounded-full bg-gradient-to-r from-slate-950 via-yellow-500 to-yellow-300" />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <Info label="Father Name" value={member.father_name} />
              <Info label="District" value={member.district} />
              <Info label="Taluka" value={member.taluka || 'Not provided'} />
              <Info label="Profession" value={profession} />
              <Info
                label="Approved Date"
                value={formatDate(member.approved_at)}
              />
              <Info label="Status" value="Approved" />
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
              <p className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
                Verification Notice
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-700">
                This card is valid only when the QR verification page confirms
                the current membership status.
              </p>
            </div>
          </section>

          <QrPanel
            qrUrl={qrUrl}
            verifyUrl={verifyUrl}
          />
        </div>
      </div>

      <CardFooter>
        This card is digitally generated by Jatt Alliance Sindh. QR verification
        confirms the current membership record.
      </CardFooter>
    </>
  )
}

function CardBack({
  member,
  logoUrl,
  flagUrl,
  qrUrl,
  verifyUrl,
}: Omit<MembershipCardProps, 'side' | 'photoUrl'>) {
  return (
    <>
      <CardHeader
        logoUrl={logoUrl}
        label="Jatt Alliance Sindh"
        title="CARDHOLDER DETAILS"
        subtitle="Address, emergency contact, verification and issuing authority"
        badge="Card Details"
      />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <SoftBackground logoUrl={logoUrl} flagUrl={flagUrl} />

        <div className="relative grid h-full min-h-0 grid-cols-[1fr_260px] gap-4 p-5">
          <section className="grid h-full min-h-0 grid-cols-2 grid-rows-[1fr_1.1fr_1.25fr] gap-3.5">
            <BackPanel title="Residential Address" tone="gold">
              <p className="line-clamp-2 break-words text-[14px] font-black leading-snug text-slate-950">
                {member.address || 'Full street address not provided.'}
              </p>
              <p className="mt-1.5 break-words text-[12.5px] font-bold text-slate-800">
                {member.taluka || 'Taluka not provided'}, {member.district}
              </p>
            </BackPanel>

            <BackPanel title="Emergency Contact">
              {member.emergency_contact_name || member.emergency_contact_mobile ? (
                <div className="space-y-1">
                  <p className="line-clamp-1 break-words text-[14px] font-black text-slate-950">
                    {member.emergency_contact_name || 'Name not provided'}
                  </p>
                  <p className="text-[12px] font-bold text-slate-700">
                    <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Relation:</span>
                    {member.emergency_contact_relation || 'N/A'}
                  </p>
                  <p className="text-[14px] font-black text-slate-950">
                    {formatMobile(member.emergency_contact_mobile)}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] font-bold text-slate-500">Not provided.</p>
              )}
            </BackPanel>

            <BackPanel title="Member Information">
              <div className="grid w-full grid-cols-3 gap-x-3 gap-y-1.5">
                <MiniInfo label="DOB" value={formatDate(member.date_of_birth)} />
                <MiniInfo label="Gender" value={member.gender || 'N/A'} />
                <MiniInfo label="Blood" value={member.blood_group || 'N/A'} />
                <MiniInfo label="Education" value={member.education || 'N/A'} />
                <MiniInfo
                  label="Designation"
                  value={getMemberDesignationTitle(member.activeDesignation) || 'Member'}
                />
                <MiniInfo label="CNIC" value={formatCnic(member.cnic)} />
                <MiniInfo label="Mobile" value={formatMobile(member.mobile)} />
              </div>
            </BackPanel>

            <BackPanel title="Verification Instructions">
              <p className="text-[12px] font-semibold leading-relaxed text-slate-700">
                Scan the QR code or visit the verification URL. Match verified name, member number, district and approval status before accepting this card as valid.
              </p>
            </BackPanel>

            <BackPanel title="Terms and Conditions">
              <ul className="list-disc space-y-1 pl-3.5 text-[11.5px] font-semibold leading-tight text-slate-700">
                <li>This card remains property of Jatt Alliance Sindh.</li>
                <li>Misuse, alteration or transfer is strictly prohibited.</li>
                <li>Validity depends on live QR verification status.</li>
              </ul>
            </BackPanel>

            <BackPanel
              title="Issuing Authority"
              tone="dark"
              contentClassName="flex flex-1 flex-col justify-between"
            >
              <div className="flex h-[75px] items-center overflow-hidden rounded-xl bg-white/80 px-2 ring-1 ring-slate-200">
                <img
                  src={SIGNATURE_PATH}
                  alt="Authorized signature"
                  className="h-[70px] w-full object-contain object-left brightness-75 contrast-150 saturate-0"
                  draggable={false}
                />
              </div>

              <div>
                <div className="h-[1.5px] w-full bg-slate-400" />
                <p className="mt-1 text-[15px] font-black leading-none text-slate-950">
                  Authorized Signature
                </p>
                <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
                  GENERAL SECRETARY
                </p>
              </div>
            </BackPanel>
          </section>

          <aside className="flex h-full min-h-0 flex-col justify-between gap-2.5 rounded-[1.25rem] border border-slate-200 bg-white/95 p-3.5 shadow-md">
            <div className="rounded-xl border border-yellow-400 bg-slate-950 px-3 py-2.5 text-center shadow-sm">
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-yellow-300">
                Issue No / Version
              </p>
              <p className="mt-0.5 break-all text-[15px] font-black text-white">
                {buildMemberCardIssueLabel(member.member_no)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-2 text-center shadow-sm ring-1 ring-slate-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Verification QR code"
                  className="mx-auto h-[160px] w-[160px] rounded-lg bg-white p-1"
                  draggable={false}
                />
              ) : (
                <div className="mx-auto flex h-[160px] w-[160px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-slate-500 ring-1 ring-slate-200">
                  QR unavailable
                </div>
              )}

              <p className="mt-1.5 text-center text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Scan to verify
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Verification URL
              </p>
              <p className="mt-0.5 text-[10.5px] font-bold leading-tight text-slate-900 break-words [overflow-wrap:anywhere]">
                {formatVerifyUrlForDisplay(verifyUrl) || 'Verification link unavailable'}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-300 bg-yellow-50/80 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-yellow-800">
                Organization
              </p>
              <p className="mt-0.5 text-[13px] font-black leading-tight text-slate-950">
                Jatt Alliance Sindh
              </p>
              <p className="text-[10.5px] font-semibold text-slate-600">
                Sindh, Pakistan
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CardFooter>
        This card is valid only when the QR verification page confirms the membership as approved and active.
      </CardFooter>
    </>
  )
}

function CardHeader({
  logoUrl,
  label,
  title,
  subtitle,
  badge,
}: {
  logoUrl: string | null
  label: string
  title: string
  subtitle: string
  badge: string
}) {
  return (
    <header className="relative h-[160px] shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 px-8 py-5 text-white">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-bl-full bg-yellow-300/15" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-tr-full bg-white/8" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.20),transparent_34%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-yellow-500 via-yellow-300 to-amber-600" />

      <div className="relative flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <LogoMark logoUrl={logoUrl} />

          <div className="min-w-0 max-w-[830px]">
            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-yellow-300">
              {label}
            </p>

            <h2 className="mt-1.5 whitespace-nowrap text-[48px] font-black uppercase leading-none tracking-tight text-white">
              {title}
            </h2>

            <p className="mt-2 text-[14px] font-semibold text-emerald-50">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="min-w-[150px] whitespace-nowrap rounded-xl border border-yellow-300/80 bg-yellow-400/90 px-5 py-2.5 text-center text-[15px] font-black uppercase tracking-wider text-slate-950 shadow-md backdrop-blur-sm">
          {badge}
        </div>
      </div>
    </header>
  )
}

function LogoMark({ logoUrl }: { logoUrl: string | null }) {
  return logoUrl ? (
    <img
      src={logoUrl}
      alt="Jatt Alliance Sindh logo"
      className="h-20 w-20 rounded-full border-2 border-yellow-400 bg-white object-cover object-top shadow-xl"
      draggable={false}
    />
  ) : (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400 bg-slate-950 text-lg font-black text-yellow-300 shadow-xl">
      JAS
    </div>
  )
}

function SoftBackground({
  logoUrl,
  flagUrl,
}: {
  logoUrl: string | null
  flagUrl: string | null
}) {
  return (
    <>
      {flagUrl ? (
        <>
          <img
            src={flagUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.09] mix-blend-multiply"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-white/[0.80]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.94] via-white/[0.84] to-white/[0.74]" />
        </>
      ) : null}

      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.04]"
          draggable={false}
        />
      ) : null}
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-[21px] font-black leading-tight text-slate-950">
        {value}
      </p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-black uppercase tracking-wider text-emerald-800">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-[12.5px] font-black leading-tight text-slate-950"
        title={value}
      >
        {value}
      </p>
    </div>
  )
}

function BackPanel({
  title,
  children,
  tone = 'light',
  contentClassName = '',
}: {
  title: string
  children: ReactNode
  tone?: 'light' | 'gold' | 'dark'
  contentClassName?: string
}) {
  const toneClass =
    tone === 'gold'
      ? 'border-amber-300/80 bg-amber-50/60'
      : tone === 'dark'
        ? 'border-slate-300 bg-slate-50/80'
        : 'border-slate-200 bg-white/90'

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[1rem] border p-3 shadow-sm ${toneClass}`}
    >
      <h3 className="shrink-0 text-[10.5px] font-black uppercase tracking-[0.16em] text-emerald-800">
        {title}
      </h3>

      <div
        className={`mt-1.5 min-h-0 text-[12.5px] font-semibold leading-normal text-slate-700 ${contentClassName}`}
      >
        {children}
      </div>
    </section>
  )
}

function QrPanel({
  qrUrl,
  verifyUrl,
}: {
  qrUrl: string | null
  verifyUrl: string
}) {
  return (
    <aside className="flex items-center justify-center">
      <div className="flex h-[365px] w-[220px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white/95 px-4 py-5 shadow-lg">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Verification QR code"
            className="h-[170px] w-[170px] rounded-xl bg-white p-1.5 ring-1 ring-slate-200"
            draggable={false}
          />
        ) : (
          <div className="flex h-[170px] w-[170px] items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-500 ring-1 ring-slate-200">
            QR unavailable
          </div>
        )}

        <p className="mt-5 text-center text-[14px] font-black uppercase tracking-[0.16em] text-slate-500">
          Scan to verify
        </p>

        <p className="mt-3 line-clamp-3 break-all text-center text-[11px] font-bold leading-4 text-slate-500">
          {formatVerifyUrlForDisplay(verifyUrl) || 'Verification link unavailable'}
        </p>
      </div>
    </aside>
  )
}

function formatVerifyUrlForDisplay(value: string | null | undefined) {
  if (!value) return ''

  try {
    const url = new URL(value)
    return `${url.host}${url.pathname}`
  } catch {
    return value.replace(/^https?:\/\//, '')
  }
}

function CardFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-slate-100 px-8 py-2">
      <p className="text-[12px] font-bold leading-5 text-slate-700">
        {children}
      </p>
    </footer>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
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