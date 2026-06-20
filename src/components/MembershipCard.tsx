// src/components/MembershipCard.tsx
import type { ReactNode } from 'react'
import {
  getMemberDesignationList,
  getMemberDesignationSummary,
  type MemberCardDesignation,
} from '../lib/member-card-designation'

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
  activeDesignations?: MemberCardDesignation[] | null
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
  const cardDesignations = getMemberDesignationList(member, 2)

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
          <section className="space-y-3">
            <div className="rounded-[2.2rem] bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-500 p-[5px] shadow-xl">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${member.full_name} profile photo`}
                  className="h-[224px] w-[224px] rounded-[1.9rem] border-4 border-white object-cover object-top"
                  draggable={false}
                />
              ) : (
                <div className="flex h-[224px] w-[224px] items-center justify-center rounded-[1.9rem] border-4 border-white bg-slate-100 text-[15px] font-bold text-slate-500">
                  No photo
                </div>
              )}
            </div>

            <div className="rounded-[1.35rem] border border-yellow-400 bg-slate-950 px-4 py-3 text-center shadow-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-300">
                Member No
              </p>
              <p className="mt-1.5 break-all text-[20px] font-black leading-tight text-white">
                {member.member_no || 'Not issued'}
              </p>
            </div>

            {cardDesignations.length ? (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/95 px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                  JAS Designations
                </p>
                <div className="mt-1.5 space-y-1">
                  {cardDesignations.map((designation) => (
                    <div
                      key={`${designation.title}-${designation.committeeName ?? designation.committeeLevelLabel ?? ''}`}
                      className="rounded-xl bg-white/70 px-2 py-1 ring-1 ring-emerald-100"
                    >
                      <p className="line-clamp-1 break-words text-[14px] font-black leading-tight text-slate-950">
                        {designation.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 break-words text-[8.5px] font-black uppercase tracking-wide text-emerald-800">
                        {[designation.committeeLevelLabel, designation.committeeLocationLabel]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
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

        <div className="relative grid h-full min-h-0 grid-cols-[1fr_260px] gap-5 p-5">
          <section className="grid h-full min-h-0 grid-cols-2 grid-rows-[0.95fr_1.2fr_1.2fr] gap-4">
            <BackPanel title="Residential Address" tone="gold">
              <p className="line-clamp-3 break-words text-[15px] font-black leading-snug text-slate-950">
                {member.address || 'Full street address not provided.'}
              </p>
              <p className="mt-2 break-words text-[13px] font-bold text-slate-800">
                {member.taluka || 'Taluka not provided'}, {member.district}
              </p>
            </BackPanel>

            <BackPanel title="Emergency Contact">
              {member.emergency_contact_name || member.emergency_contact_mobile ? (
                <>
                  <p className="line-clamp-1 break-words text-[15px] font-black text-slate-950">
                    {member.emergency_contact_name || 'Name not provided'}
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-slate-700">
                    {member.emergency_contact_relation || 'Relation not provided'}
                  </p>
                  <p className="mt-1 text-[15px] font-black text-slate-950">
                    {formatMobile(member.emergency_contact_mobile)}
                  </p>
                </>
              ) : (
                <p className="text-[14px] font-black text-slate-950">Not provided.</p>
              )}
            </BackPanel>

            <BackPanel title="Member Information">
              <div className="grid w-full grid-cols-3 items-start gap-x-4 gap-y-2">
                <MiniInfo label="DOB" value={formatDate(member.date_of_birth)} />
                <MiniInfo label="Gender" value={member.gender || 'Not provided'} />
                <MiniInfo label="Blood" value={member.blood_group || 'Not provided'} />
                <MiniInfo label="Education" value={member.education || 'Not provided'} />
                <MiniInfo label="CNIC" value={formatCnic(member.cnic)} />
                <MiniInfo label="Mobile" value={formatMobile(member.mobile)} />
                <MiniInfo
                  label="Designation"
                  value={getMemberDesignationSummary(member, 2) || 'Member'}
                  className="col-span-3 rounded-xl bg-white/65 px-2.5 py-1.5 ring-1 ring-emerald-100"
                  valueClassName="line-clamp-2 text-[12px] leading-[1.16]"
                />
              </div>
            </BackPanel>

            <BackPanel title="Verification Instructions">
              <p>Scan the QR code or open the verification URL.</p>
              <p className="mt-1">
                Match verified name, member number, district and approval status
                before accepting this card as valid.
              </p>
            </BackPanel>

            <BackPanel title="Terms and Conditions">
              <ul className="list-disc space-y-1 pl-4">
                <li>This card remains property of Jatt Alliance Sindh.</li>
                <li>Misuse, alteration or transfer is not permitted.</li>
                <li>Validity depends on live QR verification status.</li>
              </ul>
            </BackPanel>

            <BackPanel
              title="Issuing Authority"
              tone="dark"
              contentClassName="flex flex-1 flex-col justify-end"
            >
              <div className="flex h-[108px] items-center overflow-hidden rounded-2xl bg-white/80 px-2 ring-1 ring-slate-200">
                <img
                  src={SIGNATURE_PATH}
                  alt="Authorized signature"
                  className="h-[104px] w-[520px] max-w-full object-contain object-left brightness-75 contrast-150 saturate-0"
                  style={{ transform: 'scaleX(1.1)', transformOrigin: 'left center' }}
                  draggable={false}
                />
              </div>

              <div className="mt-2 h-[2px] w-full bg-slate-500" />

              <p className="mt-2 text-[17px] font-black leading-none text-slate-950">
                Authorized Signature
              </p>
              <p className="mt-1 text-[12px] font-black uppercase tracking-[0.08em] text-slate-600">
                GENERAL SECRETARY
              </p>
            </BackPanel>
          </section>

          <aside className="flex h-full min-h-0 flex-col justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-lg">
            <div className="rounded-2xl border border-yellow-400 bg-slate-950 px-3 py-3 text-center shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-yellow-300">
                Issue No / Version
              </p>
              <p className="mt-1 break-all text-[16px] font-black text-white">
                {member.member_no ? `${member.member_no} / v1` : 'Pending / v1'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-2 text-center shadow-sm ring-1 ring-slate-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Verification QR code"
                  className="mx-auto h-[176px] w-[176px] rounded-xl bg-white p-1"
                  draggable={false}
                />
              ) : (
                <div className="mx-auto flex h-[176px] w-[176px] items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-500 ring-1 ring-slate-200">
                  QR unavailable
                </div>
              )}

              <p className="mt-2 text-center text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">
                Scan to verify
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                Verification URL
              </p>
              <p className="mt-1 break-all text-[11px] font-bold leading-4 text-slate-950">
                {formatVerifyUrlForDisplay(verifyUrl) || 'Verification link unavailable'}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-yellow-800">
                Organization
              </p>
              <p className="mt-1 text-[14px] font-black leading-4 text-slate-950">
                Jatt Alliance Sindh
              </p>
              <p className="text-[11px] font-semibold text-slate-600">
                Sindh, Pakistan
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CardFooter>
        This card is valid only when the QR verification page confirms the
        membership as approved and active.
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
    <header className="relative h-[182px] shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 px-8 py-6 text-white">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-bl-full bg-yellow-300/15" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-tr-full bg-white/8" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.20),transparent_34%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[5px] bg-gradient-to-r from-yellow-500 via-yellow-300 to-amber-600" />

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-start gap-5">
          <LogoMark logoUrl={logoUrl} />

          <div className="min-w-0 max-w-[830px]">
            <p className="text-[13px] font-black uppercase tracking-[0.34em] text-yellow-300">
              {label}
            </p>

            <h2 className="mt-3 whitespace-nowrap text-[54px] font-black uppercase leading-[0.94] tracking-tight text-white">
              {title}
            </h2>

            <p className="mt-3 text-[15px] font-semibold text-emerald-50">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="min-w-[160px] whitespace-nowrap rounded-[1.1rem] border border-yellow-300/70 bg-yellow-300 px-6 py-4 text-center text-[17px] font-black uppercase tracking-wide text-slate-950 shadow-lg">
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
      className="mt-1 h-24 w-24 rounded-full border-2 border-yellow-400 bg-white object-cover object-top shadow-xl"
      draggable={false}
    />
  ) : (
    <div className="mt-1 flex h-24 w-24 items-center justify-center rounded-full border-2 border-yellow-400 bg-slate-950 text-xl font-black text-yellow-300 shadow-xl">
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

function MiniInfo({
  label,
  value,
  className = '',
  valueClassName = '',
}: {
  label: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800">
        {label}
      </p>
      <p
        className={
          valueClassName
            ? `mt-0.5 break-words font-black text-slate-950 ${valueClassName}`
            : 'mt-0.5 break-words text-[13px] font-black leading-[1.15] text-slate-950'
        }
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
      ? 'border-yellow-300 bg-yellow-50/95'
      : tone === 'dark'
        ? 'border-slate-300 bg-slate-50/95'
        : 'border-slate-200 bg-white/90'

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[1.05rem] border p-3.5 shadow-sm ${toneClass}`}
    >
      <h3 className="shrink-0 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
        {title}
      </h3>

      <div
        className={`mt-2 min-h-0 text-[13px] font-semibold leading-[1.38] text-slate-700 ${contentClassName}`}
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
    <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-8 py-2">
      <p className="text-[11.5px] font-semibold leading-5 text-slate-500">
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