// src/components/MembershipCard.tsx

import type { CSSProperties, ReactNode } from 'react'

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

const DEFAULT_LOGO_PATH = '/jas/logo.png'
const SIGNATURE_STAMP_PATH = '/jas/signature-stamp.png'
const SINDH_MAP_PATH = '/jas/sindh-map-card.png'

export function MembershipCard({
  side,
  member,
  photoUrl,
  logoUrl,
  flagUrl,
  qrUrl,
  verifyUrl,
}: MembershipCardProps) {
  const finalLogoUrl = logoUrl || DEFAULT_LOGO_PATH

  return (
    <article
      className="relative isolate flex shrink-0 flex-col overflow-hidden rounded-[34px] border border-[#d5ab31]/80 bg-white text-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
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
          logoUrl={finalLogoUrl}
          flagUrl={flagUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
        />
      ) : (
        <CardBack
          member={member}
          logoUrl={finalLogoUrl}
          flagUrl={flagUrl}
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
  return (
    <section className="relative h-full overflow-hidden bg-white">
      <BaseBackground logoUrl={logoUrl} flagUrl={flagUrl} side="front" />
      <FrontTopBand />
      <FrontFooterBand />

      <div className="pointer-events-none absolute inset-x-0 top-[282px] z-[1] flex justify-center">
        <Watermark logoUrl={logoUrl} size={382} opacity={0.075} />
      </div>

      <div className="relative z-10 h-full">
        <header className="relative h-[262px]">
          <div className="absolute left-[44px] top-[16px] z-20">
            <FrontSeal logoUrl={logoUrl} />
          </div>

          <div className="absolute left-[292px] top-[38px] right-[258px] z-10">
            <p className="text-[22px] font-black uppercase leading-none tracking-[0.34em] text-[#f4cf5b] drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]">
              Digital Member ID
            </p>

            <h1 className="mt-5 whitespace-nowrap text-[61px] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white drop-shadow-[0_5px_6px_rgba(0,0,0,0.38)]">
              Jatt Alliance Sindh
            </h1>

            <div className="mt-7 flex items-center gap-6 text-[#f4cf5b] drop-shadow-[0_2px_2px_rgba(0,0,0,0.30)]">
              <span className="h-[2px] w-[96px] bg-gradient-to-r from-transparent via-[#e3b436] to-[#f5d66c]" />
              <span className="h-2.5 w-2.5 rotate-45 bg-[#efbf3d]" />
              <p className="whitespace-nowrap text-[24px] font-black leading-none tracking-[-0.015em]">
                Official Verified Membership Card
              </p>
              <span className="h-2.5 w-2.5 rotate-45 bg-[#efbf3d]" />
              <span className="h-[2px] w-[96px] bg-gradient-to-r from-[#f5d66c] via-[#e3b436] to-transparent" />
            </div>
          </div>

          <div className="absolute right-[26px] top-[22px] z-20">
            <VerifiedBadge />
          </div>
        </header>

        <main className="relative h-[398px]">
          <div className="absolute left-[50px] top-[14px]">
            <PhotoFrame photoUrl={photoUrl} name={member.full_name} />
          </div>

          <section className="absolute left-[356px] top-[36px] grid w-[570px] grid-cols-[302px_258px] gap-x-2.5 gap-y-[34px]">
            <FrontInfoItem icon="person" label="Member Name" value={member.full_name} />
            <FrontInfoItem icon="building" label="Taluka" value={member.taluka || 'Not provided'} />
            <FrontInfoItem icon="family" label="Father Name" value={member.father_name} />
            <FrontInfoItem
              icon="id"
              label="Member No"
              value={member.member_no || 'Not issued'}
              badge
            />
            <FrontInfoItem icon="location" label="District" value={member.district} />
            <FrontInfoItem icon="shield" label="Status" value={formatStatus(member.status)} status />
          </section>

          <div className="absolute right-[18px] top-[6px]">
            <QrPanel qrUrl={qrUrl} verifyUrl={verifyUrl} />
          </div>
        </main>

        <SloganStrip />
      </div>
    </section>
  )
}

function CardBack({
  member,
  logoUrl,
  flagUrl,
}: Omit<MembershipCardProps, 'side' | 'photoUrl' | 'qrUrl'>) {
  return (
    <section className="relative h-full overflow-hidden bg-white">
      <BaseBackground logoUrl={logoUrl} flagUrl={flagUrl} side="back" />
      <BackTopBand />
      <BackFooterBand />

      <div className="pointer-events-none absolute inset-x-0 top-[198px] z-[1] flex justify-center">
        <Watermark logoUrl={logoUrl} size={400} opacity={0.03} />
      </div>

      <div className="relative z-10 h-full">
        <header className="relative h-[170px]">
          <div className="absolute left-[42px] top-[22px] z-20 rounded-full border-[4px] border-[#f0cf61] bg-[#06351f] p-[4px] shadow-[0_14px_20px_rgba(0,0,0,0.26)]">
            <img
              src={logoUrl ?? undefined}
              alt="Jatt Alliance Sindh logo"
              className="h-[126px] w-[126px] rounded-full object-cover"
              draggable={false}
            />
          </div>

          <div className="absolute left-[205px] right-[52px] top-[52px] flex items-center gap-5">
            <HexBadge icon="person" size="lg" />
            <h2 className="whitespace-nowrap text-[40px] font-black uppercase leading-none tracking-[-0.035em] text-white drop-shadow-[0_4px_5px_rgba(0,0,0,0.36)]">
              Cardholder Details
            </h2>
            <span className="h-[48px] w-[2px] bg-[#d4af37]" />
            <p className="max-w-[430px] text-[21px] font-bold leading-[1.12] text-[#f1cf5a] drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]">
              Address, verification and issuing authority
            </p>
          </div>
        </header>

        <main className="relative h-[590px] px-10">
          <BackPanel
            title="Personal Information"
            icon="person"
            className="absolute left-[40px] top-[8px] h-[322px] w-[390px]"
          >
            <div className="space-y-[2px] pt-1">
              <DetailRow label="Date of Birth" value={formatDate(member.date_of_birth)} />
              <DetailRow label="Gender" value={member.gender || 'Not provided'} />
              <DetailRow label="Blood Group" value={member.blood_group || 'Not provided'} />
              <DetailRow label="Education" value={member.education || 'Not provided'} />
              <DetailRow label="Profession" value={member.profession || 'Not provided'} />
              <DetailRow label="Caste Branch" value={member.caste_branch || 'Not provided'} />
              <DetailRow label="CNIC" value={formatCnic(member.cnic)} />
              <DetailRow label="Mobile" value={formatMobile(member.mobile)} />
            </div>
          </BackPanel>

          <BackPanel
            title="Residential Address"
            icon="home"
            className="absolute left-[455px] top-[8px] h-[158px] w-[360px]"
          >
            <div className="pt-0.5 text-[19px] font-semibold leading-[1.28] text-slate-950">
              <p className="break-words">{member.address || 'Full street address not provided.'}</p>
              <p className="mt-2 font-bold">
                {member.taluka || 'Taluka not provided'}, {member.district}
              </p>
            </div>
          </BackPanel>

          <BackPanel
            title="Emergency Contact"
            icon="phone"
            className="absolute left-[455px] top-[176px] h-[154px] w-[360px]"
          >
            <div className="space-y-[2px] pt-0.5">
              <DetailRow label="Name" value={member.emergency_contact_name || 'Not provided'} />
              <DetailRow label="Relation" value={member.emergency_contact_relation || 'Not provided'} />
              <DetailRow label="Mobile" value={formatMobile(member.emergency_contact_mobile)} />
            </div>
          </BackPanel>

          <section className="absolute right-[48px] top-[-2px] flex h-[332px] w-[355px] items-center justify-center rounded-[22px] bg-white/65 p-3">
            <img
              src={SINDH_MAP_PATH}
              alt="Sindh District Map"
              className="h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.16)]"
              draggable={false}
            />
          </section>

          <BackPanel
            title="Issuing Authority"
            icon="signature"
            className="absolute left-[40px] top-[338px] h-[166px] w-[390px]"
          >
            <div className="flex h-[50px] items-center justify-center overflow-visible pt-0">
              <img
                src={SIGNATURE_STAMP_PATH}
                alt="Authorized signature and stamp"
                className="h-[74px] max-w-[238px] object-contain"
                draggable={false}
              />
            </div>
            <div className="mx-auto -mt-1 h-[2px] w-[210px] bg-slate-700" />
            <p className="mt-1 text-center text-[13px] font-semibold leading-tight text-slate-950">
              Authorized Signature
            </p>
            <p className="text-center text-[11px] font-bold leading-tight text-slate-700">
              General Secretary
            </p>
          </BackPanel>

          <BackPanel
            title="Terms & Conditions"
            icon="shield"
            className="absolute left-[455px] top-[338px] h-[166px] w-[360px]"
          >
            <ul className="list-disc space-y-1.5 pl-5 pt-0 text-[12.5px] font-semibold leading-[1.22] text-slate-950">
              <li>This card is property of Jatt Alliance Sindh.</li>
              <li>Misuse, alteration or transfer is not permitted.</li>
              <li>Validity depends on live QR verification status.</li>
            </ul>
          </BackPanel>

          <BackPanel
            title="Organization"
            icon="building"
            className="absolute right-[48px] top-[338px] h-[166px] w-[385px]"
          >
            <div className="flex h-full -translate-y-[12px] flex-col justify-center pt-0">
              <p className="text-center text-[22px] font-black leading-tight text-slate-950">
                Jatt Alliance Sindh,
              </p>
              <p className="mt-1.5 text-center text-[18px] text-slate-950">Sindh, Pakistan</p>
            </div>
          </BackPanel>
        </main>
      </div>
    </section>
  )
}

function FrontTopBand() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[276px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[242px] bg-[linear-gradient(90deg,#001f12_0%,#00321f_34%,#064b2f_66%,#001f12_100%)]" />
      <div className="absolute inset-x-0 top-0 h-[242px] bg-[radial-gradient(circle_at_13%_4%,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_83%_13%,rgba(241,204,76,0.10),transparent_26%)]" />
      <div className="absolute right-[148px] top-[-18px] h-[174px] w-[440px] rotate-[-2deg] rounded-full opacity-[0.13] [background-image:radial-gradient(circle,#23a65f_1.6px,transparent_1.6px)] [background-size:8px_8px]" />
      <div className="absolute right-[34px] top-[44px] h-[122px] w-[310px] opacity-[0.11] [background-image:radial-gradient(circle,#30ba72_1.4px,transparent_1.4px)] [background-size:8px_8px]" />
      <div className="absolute inset-x-0 bottom-0 h-[118px]">
        <svg
          viewBox="0 0 1280 118"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M0 40 C130 115 255 47 405 64 C605 86 750 55 925 78 C1085 99 1192 82 1280 4 L1280 128 L0 128 Z"
            fill="white"
          />
          <path
            d="M0 36 C130 108 255 42 405 58 C605 80 750 49 925 72 C1085 93 1192 75 1280 0"
            fill="none"
            stroke="#fff2b7"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M0 40 C130 115 255 47 405 64 C605 86 750 55 925 78 C1085 99 1192 82 1280 4"
            fill="none"
            stroke="#d99b18"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M0 53 C145 128 290 61 455 77 C630 95 760 72 915 91 C1080 111 1195 100 1280 27"
            fill="none"
            stroke="#1b1203"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  )
}

function FrontFooterBand() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[146px] overflow-hidden">
      <svg
        viewBox="0 0 1280 146"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M0 55 C185 101 310 93 480 117 C665 143 828 126 1010 94 C1135 72 1218 56 1280 38 L1280 146 L0 146 Z"
          fill="#002817"
        />
        <path
          d="M0 47 C185 93 310 85 480 109 C665 135 828 118 1010 86 C1135 64 1218 48 1280 30"
          fill="none"
          stroke="#fff0ad"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M0 54 C185 100 310 92 480 116 C665 142 828 125 1010 93 C1135 71 1218 55 1280 37"
          fill="none"
          stroke="#dc9b13"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M0 68 C185 114 310 106 480 130 C665 156 828 139 1010 107 C1135 85 1218 69 1280 51"
          fill="none"
          stroke="#000"
          strokeWidth="3"
          opacity="0.45"
        />
        <path
          d="M0 80 C192 123 330 116 505 136 C690 158 850 145 1034 112 C1150 92 1228 77 1280 61 L1280 146 L0 146 Z"
          fill="url(#frontFooterGreen)"
          opacity="0.92"
        />
        <defs>
          <linearGradient id="frontFooterGreen" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#001f12" />
            <stop offset="0.5" stopColor="#06492d" />
            <stop offset="1" stopColor="#001f12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function BackTopBand() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[190px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[150px] bg-[linear-gradient(90deg,#001f12_0%,#04301d_35%,#06492d_66%,#001f12_100%)]" />
      <div className="absolute inset-x-0 top-0 h-[150px] bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.09),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(241,204,76,0.12),transparent_26%)]" />
      <div className="absolute right-[98px] top-[-18px] h-[140px] w-[520px] opacity-[0.11] [background-image:radial-gradient(circle,#2bb96d_1.45px,transparent_1.45px)] [background-size:8px_8px]" />
      <div className="absolute inset-x-0 bottom-0 h-[92px]">
        <svg
          viewBox="0 0 1280 92"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M0 42 C130 8 280 36 455 30 C650 21 790 35 985 26 C1110 20 1208 8 1280 0 L1280 92 L0 92 Z"
            fill="white"
          />
          <path
            d="M0 39 C130 4 280 32 455 26 C650 17 790 31 985 22 C1110 16 1208 4 1280 -4"
            fill="none"
            stroke="#fff0ad"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M0 43 C130 9 280 37 455 31 C650 22 790 36 985 27 C1110 21 1208 9 1280 1"
            fill="none"
            stroke="#dc9b13"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M0 57 C135 23 300 50 475 45 C650 38 805 50 990 41 C1120 35 1215 24 1280 18"
            fill="none"
            stroke="#000"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.42"
          />
        </svg>
      </div>
    </div>
  )
}

function BackFooterBand() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[82px] overflow-hidden">
      <svg
        viewBox="0 0 1280 92"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M0 54 C190 78 345 78 520 72 C704 66 810 52 955 44 C1110 36 1212 40 1280 14 L1280 92 L0 92 Z"
          fill="#002817"
        />
        <path
          d="M0 44 C190 68 345 68 520 62 C704 56 810 42 955 34 C1110 26 1212 30 1280 4"
          fill="none"
          stroke="#fff0ad"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M0 50 C190 74 345 74 520 68 C704 62 810 48 955 40 C1110 32 1212 36 1280 10"
          fill="none"
          stroke="#dc9b13"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M0 66 C195 88 350 88 535 82 C714 76 828 62 978 52 C1128 43 1220 48 1280 22"
          fill="none"
          stroke="#000"
          strokeWidth="3"
          opacity="0.42"
        />
        <path
          d="M880 92 C985 64 1105 70 1280 38 L1280 92 Z"
          fill="#06351f"
          opacity="0.72"
        />
      </svg>
    </div>
  )
}

function FrontSeal({ logoUrl }: { logoUrl: string | null }) {
  return (
    <div className="relative h-[206px] w-[206px]">
      <div className="absolute inset-0 rounded-full border-[5px] border-[#f3d86f] bg-[#073a25] p-[5px] shadow-[0_15px_22px_rgba(0,0,0,0.32)]">
        <img
          src={logoUrl ?? undefined}
          alt="Jatt Alliance Sindh logo"
          className="h-full w-full rounded-full object-cover"
          draggable={false}
        />
      </div>
    </div>
  )
}

function VerifiedBadge() {
  return (
    <div className="relative h-[70px] w-[205px] drop-shadow-[0_7px_9px_rgba(0,0,0,0.28)]">
      <div className="absolute left-0 top-[-6px] z-20 flex h-[80px] w-[80px] items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff1a8] via-[#d9a12b] to-[#8b5e0c] [clip-path:polygon(50%_2%,86%_16%,86%_50%,50%_97%,14%_50%,14%_16%)]" />
        <div className="absolute inset-[8px] bg-gradient-to-br from-[#fff2a6] via-[#d9a12c] to-[#a96f11] [clip-path:polygon(50%_3%,82%_18%,82%_50%,50%_91%,18%_50%,18%_18%)]" />
        <ShieldCheckIcon className="relative z-10 h-[38px] w-[38px] text-[#073b27]" />
      </div>

      <div className="absolute left-[58px] top-[4px] h-[34px] w-[142px] bg-gradient-to-r from-[#f5d361] via-[#efc248] to-[#d08d16] [clip-path:polygon(0_0,100%_0,90%_50%,100%_100%,0_100%)]" />
      <div className="absolute left-[78px] top-[9px] text-[18px] font-black uppercase leading-none tracking-wide text-[#073b27]">
        Verified
      </div>
      <div className="absolute left-[70px] top-[39px] rounded-r-[3px] bg-[#0a3c29] px-3 py-[3px] text-[15px] font-black uppercase leading-none tracking-wide text-white">
        Active Member
      </div>
    </div>
  )
}

function PhotoFrame({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  return (
    <div className="rounded-[30px] bg-gradient-to-br from-[#ffe47d] via-[#e7b33a] to-[#b97908] p-[6px] shadow-[0_16px_20px_rgba(0,0,0,0.18)]">
      <div className="rounded-[25px] bg-white p-[8px] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.04)]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${name} profile photo`}
            className="h-[300px] w-[270px] rounded-[20px] bg-slate-100 object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className="flex h-[300px] w-[270px] items-center justify-center rounded-[20px] bg-slate-100 text-[18px] font-black text-slate-500">
            No photo
          </div>
        )}
      </div>
    </div>
  )
}

function QrPanel({ qrUrl, verifyUrl }: { qrUrl: string | null; verifyUrl: string }) {
  return (
    <div className="flex w-[284px] flex-col items-center">
      <div className="rounded-[22px] border-[4px] border-[#d99b17] bg-white px-[18px] pb-3 pt-[18px] shadow-[0_12px_20px_rgba(0,0,0,0.14)]">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Verification QR code"
            className="h-[202px] w-[202px] bg-white"
            draggable={false}
          />
        ) : (
          <div className="flex h-[202px] w-[202px] items-center justify-center bg-slate-100 text-[14px] font-black text-slate-500">
            QR unavailable
          </div>
        )}

        <div className="mt-3 rounded-[10px] bg-[#06351f] px-4 py-2.5 text-center text-[18px] font-black uppercase tracking-[0.12em] text-white shadow-[0_7px_9px_rgba(0,0,0,0.22)]">
          Scan to Verify
        </div>
      </div>

      <div className="mt-3 flex w-[318px] max-w-[318px] items-center gap-2 rounded-[12px] bg-[#06351f] px-3 py-2.5 text-[12px] font-black text-white shadow-[0_8px_12px_rgba(0,0,0,0.24)] ring-1 ring-[#d99b17]/65">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/45 text-[14px] leading-none">
          🌐
        </span>
        <span className="min-w-0 flex-1 truncate">{formatVerifyUrlForDisplay(verifyUrl)}</span>
      </div>
    </div>
  )
}

function SloganStrip() {
  return (
    <div className="absolute bottom-[86px] left-[205px] right-[350px] z-20 flex items-center justify-center gap-4 whitespace-nowrap text-[#073b27]">
      <span className="h-[2px] w-[66px] bg-gradient-to-r from-transparent via-[#dca323] to-[#f1c94e]" />
      <span className="h-2.5 w-2.5 rotate-45 bg-[#e2a821]" />
      {['Unity', 'Respect', 'Welfare', 'Progress'].map((word, index) => (
        <span key={word} className="flex items-center gap-4">
          <span
            className="text-[26px] font-bold italic leading-none"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {word}
          </span>
          {index < 3 ? <span className="h-2.5 w-2.5 rotate-45 bg-[#e2a821]" /> : null}
        </span>
      ))}
      <span className="h-[2px] w-[66px] bg-gradient-to-r from-[#f1c94e] via-[#dca323] to-transparent" />
    </div>
  )
}

function FrontInfoItem({
  icon,
  label,
  value,
  badge = false,
  status = false,
}: {
  icon: IconName
  label: string
  value: string
  badge?: boolean
  status?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <HexBadge icon={icon} size="md" />

      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-[17px] font-black uppercase leading-none tracking-[0.02em] text-[#a46d08]">
          {label}
        </p>

        {badge ? (
          <div className="mt-2 inline-flex w-[220px] max-w-[220px] justify-center rounded-[11px] border-2 border-[#d5a01c] bg-[#06351f] px-3 py-2 text-[20px] font-black leading-none text-white shadow-[0_7px_8px_rgba(0,0,0,0.25)]">
            <span className="whitespace-nowrap">{value}</span>
          </div>
        ) : status ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[34px] font-black uppercase leading-none tracking-[-0.04em] text-[#073b27]">
              {value}
            </span>
            <span className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#f2be3b] text-[23px] font-black text-[#073b27] shadow-[0_5px_8px_rgba(0,0,0,0.18)]">
              ✓
            </span>
          </div>
        ) : (
          <p className="mt-2 max-w-full whitespace-nowrap text-[28px] font-black leading-[1.02] tracking-[-0.035em] text-[#073b27]">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

function BackPanel({
  title,
  icon,
  children,
  className = '',
}: {
  title: string
  icon: IconName
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[24px] border border-[#e0aa23] bg-white/94 px-5 pb-3 pt-4 shadow-[0_9px_22px_rgba(0,0,0,0.06)] ${className}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <HexBadge icon={icon} size="sm" />
        <h3 className="text-[17px] font-black uppercase leading-tight tracking-wide text-[#0a4a32]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[44%_6%_50%] text-[15px] leading-[1.42] text-slate-950">
      <span>{label}</span>
      <span>:</span>
      <span className="break-words font-semibold">{value}</span>
    </div>
  )
}

type IconName =
  | 'person'
  | 'family'
  | 'location'
  | 'building'
  | 'id'
  | 'shield'
  | 'home'
  | 'phone'
  | 'signature'
  | 'taluka'

type HexBadgeSize = 'sm' | 'md' | 'lg'

function HexBadge({ icon, size }: { icon: IconName; size: HexBadgeSize }) {
  const dimension =
    size === 'lg'
      ? 'h-[60px] w-[60px]'
      : size === 'sm'
        ? 'h-[46px] w-[46px]'
        : 'h-[58px] w-[58px]'

  return (
    <span className={`relative inline-flex shrink-0 ${dimension} drop-shadow-[0_6px_5px_rgba(0,0,0,0.22)]`}>
      <span
        className="absolute inset-0 bg-gradient-to-br from-[#fff0a4] via-[#d6a224] to-[#a56507]"
        style={hexClipStyle}
      />
      <span
        className="absolute inset-[3px] flex items-center justify-center bg-[linear-gradient(180deg,#064b2d_0%,#052b1b_100%)] text-white shadow-[inset_0_2px_7px_rgba(255,255,255,0.16)]"
        style={hexClipStyle}
      >
        <Icon
          name={icon}
          className={size === 'sm' ? 'h-[22px] w-[22px]' : size === 'lg' ? 'h-8 w-8' : 'h-[29px] w-[29px]'}
        />
      </span>
    </span>
  )
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = className || 'h-7 w-7'

  if (name === 'person') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </svg>
    )
  }

  if (name === 'family') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 21a6 6 0 0 1 12 0" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M14.5 21a4.5 4.5 0 0 1 7 0" />
      </svg>
    )
  }

  if (name === 'location') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M12 22s7-7.1 7-13a7 7 0 0 0-14 0c0 5.9 7 13 7 13Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    )
  }

  if (name === 'building') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M3.5 21h17" />
        <path d="M5 9.5 12 4l7 5.5" />
        <path d="M6.5 10h11" />
        <path d="M8 10v8M12 10v8M16 10v8" />
        <path d="M6 18h12" />
      </svg>
    )
  }

  if (name === 'id') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2.5" />
        <path d="M6 17a3 3 0 0 1 6 0" />
        <path d="M14 10h4M14 14h4" />
      </svg>
    )
  }

  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    )
  }

  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    )
  }

  if (name === 'phone') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />
      </svg>
    )
  }

  if (name === 'taluka') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
        <path d="M4 20h16" />
        <path d="M6 20V9l6-5 6 5v11" />
        <path d="M8 10h8" />
        <path d="M10 20v-5h4v5" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="2">
      <path d="M16 3 21 8 8 21H3v-5L16 3Z" />
      <path d="m14 5 5 5" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m8.8 12.4 2.2 2.2 4.6-5.1" />
    </svg>
  )
}

function BaseBackground({
  logoUrl,
  flagUrl,
  side,
}: {
  logoUrl: string | null
  flagUrl: string | null
  side: CardSide
}) {
  return (
    <>
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
            side === 'front' ? 'opacity-[0.022]' : 'opacity-[0.022]'
          }`}
          draggable={false}
        />
      ) : null}

      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ${
            side === 'front'
              ? 'h-[430px] w-[430px] opacity-[0.028]'
              : 'h-[410px] w-[410px] opacity-[0.03]'
          }`}
          draggable={false}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.06)_48%,rgba(255,255,255,0)_100%)]" />
    </>
  )
}

function Watermark({ logoUrl, size, opacity }: { logoUrl: string | null; size: number; opacity: number }) {
  if (!logoUrl) return null

  return (
    <img
      src={logoUrl}
      alt=""
      draggable={false}
      className="pointer-events-none rounded-full object-cover"
      style={{ width: size, height: size, opacity } as CSSProperties}
    />
  )
}

const hexClipStyle: CSSProperties = {
  clipPath: 'polygon(25% 6%, 75% 6%, 94% 50%, 75% 94%, 25% 94%, 6% 50%)',
}

function formatStatus(status: MembershipCardMember['status']) {
  if (status === 'approved') return 'ACTIVE'
  if (status === 'pending') return 'PENDING'
  return 'REJECTED'
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

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
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
