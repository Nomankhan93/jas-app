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
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
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
      className="relative flex shrink-0 flex-col overflow-hidden rounded-[2rem] border border-yellow-500/35 bg-[#090806] text-white shadow-2xl"
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
  const shortVerifyUrl = getShortVerifyUrl(verifyUrl)
  const professionOrCaste =
    member.profession || member.caste_branch || 'Not provided'

  return (
    <>
      <div className="relative h-[210px] overflow-hidden bg-[linear-gradient(135deg,#050505_0%,#064e3b_45%,#3a2606_100%)] px-9 py-7">
        <GoldPattern />

        <div className="relative flex items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            <LogoMark logoUrl={logoUrl} size="large" />

            <div>
              <p className="text-[14px] font-black uppercase tracking-[0.4em] text-yellow-300">
                Official Digital Member ID
              </p>
              <h2 className="mt-4 whitespace-nowrap text-[64px] font-black uppercase leading-[0.92] text-white">
                JATT ALLIANCE SINDH
              </h2>
              <p className="mt-4 text-[17px] font-semibold text-yellow-100">
                Verified membership card for identity and QR confirmation
              </p>
            </div>
          </div>

          <div className="rounded-[1.15rem] border border-yellow-300/80 bg-yellow-300 px-7 py-4 text-[18px] font-black uppercase tracking-wide text-emerald-950 shadow-[0_18px_45px_rgba(250,204,21,0.24)]">
            Approved
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#07120d]">
        <Watermark logoUrl={logoUrl} flagUrl={flagUrl} />

        <div className="relative grid h-full grid-cols-[270px_1fr_235px] gap-8 p-8">
          <div className="space-y-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={member.full_name}
                className="h-[250px] w-[250px] rounded-[1.6rem] border-4 border-yellow-300/85 object-cover shadow-[0_22px_55px_rgba(0,0,0,0.45)]"
              />
            ) : (
              <div className="flex h-[250px] w-[250px] items-center justify-center rounded-[1.6rem] border-4 border-yellow-300/70 bg-zinc-900 text-[18px] font-semibold text-yellow-100">
                No photo
              </div>
            )}

            <div className="rounded-[1.3rem] border border-yellow-300/70 bg-emerald-950 px-4 py-4 text-center shadow-lg">
              <p className="text-[13px] font-black uppercase tracking-[0.22em] text-yellow-300">
                Member No
              </p>
              <p className="mt-2 text-[24px] font-black text-white">
                {member.member_no}
              </p>
            </div>
          </div>

          <div className="space-y-6 py-1">
            <div>
              <p className="text-[17px] font-black uppercase tracking-[0.2em] text-yellow-300">
                Member Name
              </p>
              <h3 className="mt-3 text-[48px] font-black leading-tight text-white">
                {member.full_name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <Info label="Father Name" value={member.father_name} />
              <Info label="District" value={member.district} />
              <Info label="Taluka" value={member.taluka || 'Not provided'} />
              <Info label="Profession / Caste" value={professionOrCaste} />
              <Info label="Approved Date" value={formatDate(member.approved_at)} />
              <Info label="Status" value="Approved" />
            </div>

            <div className="rounded-[1.25rem] border border-yellow-300/30 bg-emerald-950/70 px-5 py-4">
              <p className="text-[13px] font-black uppercase tracking-[0.22em] text-yellow-300">
                Short Verify URL
              </p>
              <p className="mt-2 break-all text-[16px] font-semibold leading-6 text-yellow-50">
                {shortVerifyUrl}
              </p>
            </div>
          </div>

          <QrPanel qrUrl={qrUrl} verifyUrl={verifyUrl} />
        </div>
      </div>

      <CardFooter
        left="Official verified membership card"
        right="Scan QR to confirm current membership status"
      />
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
  const shortVerifyUrl = getShortVerifyUrl(verifyUrl)

  return (
    <>
      <div className="relative h-full overflow-hidden bg-[linear-gradient(135deg,#050505_0%,#052e22_50%,#2b1d08_100%)] p-8">
        <GoldPattern />
        <Watermark logoUrl={logoUrl} flagUrl={flagUrl} />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-5">
              <LogoMark logoUrl={logoUrl} size="small" />
              <div>
                <p className="text-[13px] font-black uppercase tracking-[0.36em] text-yellow-300">
                  Jatt Alliance Sindh
                </p>
                <h2 className="mt-2 text-[38px] font-black uppercase leading-none text-white">
                  Cardholder Details
                </h2>
              </div>
            </div>

            <div className="rounded-[1rem] border border-yellow-300/55 bg-emerald-950/65 px-5 py-3 text-right">
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-yellow-300">
                Issue No / Version
              </p>
              <p className="mt-1 text-[18px] font-black text-white">
                {member.member_no ? `${member.member_no} / v1` : 'Pending / v1'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid flex-1 grid-cols-[1fr_315px] gap-7">
            <div className="grid grid-cols-2 gap-5">
              <BackPanel title="Residential Address">
                <p>{member.taluka || 'Taluka not provided'}</p>
                <p>{member.district}</p>
                <p className="mt-2 text-yellow-100/70">
                  Full street address not collected yet.
                </p>
              </BackPanel>

              <BackPanel title="Emergency Contact">
                <p>Not collected yet.</p>
                <p className="mt-2 text-yellow-100/70">
                  Add emergency contact fields in a later schema phase.
                </p>
              </BackPanel>

              <BackPanel title="Verification Instructions">
                <p>Scan the QR code or open the short verification URL.</p>
                <p className="mt-2">
                  Match the verified name, member number, and status with this
                  card before accepting it as valid.
                </p>
              </BackPanel>

              <BackPanel title="Terms and Conditions">
                <ul className="list-disc space-y-1 pl-5">
                  <li>This card remains property of Jatt Alliance Sindh.</li>
                  <li>Misuse, alteration, or transfer is not permitted.</li>
                  <li>Validity depends on the live verification status.</li>
                </ul>
              </BackPanel>

              <BackPanel title="Organization Contact">
                <p>Jatt Alliance Sindh</p>
                <p>Sindh, Pakistan</p>
                <p className="mt-2">Official contact details pending setup.</p>
              </BackPanel>

              <BackPanel title="Issuing Authority">
                <div className="mt-8 h-px w-64 bg-yellow-300/70" />
                <p className="mt-3 font-black text-white">Authorized Signature</p>
                <p className="mt-1 text-yellow-100/70">
                  Digital membership office
                </p>
              </BackPanel>
            </div>

            <div className="flex flex-col justify-between rounded-[1.5rem] border border-yellow-300/45 bg-emerald-950/60 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.26)]">
              <div>
                <p className="text-[13px] font-black uppercase tracking-[0.28em] text-yellow-300">
                  QR Verification
                </p>
                <p className="mt-3 text-[17px] font-semibold leading-7 text-yellow-50">
                  This code confirms whether the member record is currently
                  approved in the JAS system.
                </p>
              </div>

              <div className="mx-auto rounded-[1.35rem] bg-white p-4">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Verification QR"
                    className="h-[205px] w-[205px]"
                  />
                ) : (
                  <div className="h-[205px] w-[205px] bg-slate-100" />
                )}
              </div>

              <div className="rounded-[1rem] border border-yellow-300/30 bg-yellow-300/10 p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-yellow-300">
                  Short URL
                </p>
                <p className="mt-2 break-all text-[15px] font-bold leading-6 text-white">
                  {shortVerifyUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function LogoMark({
  logoUrl,
  size,
}: {
  logoUrl: string | null
  size: 'small' | 'large'
}) {
  const className =
    size === 'large'
      ? 'h-24 w-24 border-2'
      : 'h-20 w-20 border-2'

  return logoUrl ? (
    <img
      src={logoUrl}
      alt="Jatt Alliance Sindh logo"
      className={`${className} rounded-full border-yellow-300 bg-white object-cover shadow-xl`}
    />
  ) : (
    <div
      className={`${className} flex items-center justify-center rounded-full border-yellow-300 bg-emerald-950 text-[18px] font-black text-yellow-300`}
    >
      JAS
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-black uppercase tracking-[0.2em] text-yellow-300/85">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-black leading-tight text-white">
        {value}
      </p>
    </div>
  )
}

function BackPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.15rem] border border-yellow-300/25 bg-black/45 p-5">
      <h3 className="text-[13px] font-black uppercase tracking-[0.22em] text-yellow-300">
        {title}
      </h3>
      <div className="mt-3 text-[16px] font-semibold leading-6 text-yellow-50">
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
  const shortVerifyUrl = getShortVerifyUrl(verifyUrl)

  return (
    <div className="flex items-center justify-center">
      <div className="flex h-[360px] w-[215px] flex-col items-center justify-center rounded-[1.6rem] border border-yellow-300/55 bg-emerald-950/80 p-4 shadow-lg">
        <div className="rounded-[1rem] bg-white p-3">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Verification QR"
              className="h-[155px] w-[155px]"
            />
          ) : (
            <div className="h-[155px] w-[155px] bg-slate-100" />
          )}
        </div>

        <p className="mt-5 text-center text-[14px] font-black uppercase tracking-[0.18em] text-yellow-300">
          Scan to verify
        </p>
        <p className="mt-3 line-clamp-4 break-all text-center text-[11px] font-semibold leading-5 text-yellow-50/80">
          {shortVerifyUrl}
        </p>
      </div>
    </div>
  )
}

function CardFooter({ left, right }: { left: string; right: string }) {
  return (
    <footer className="flex items-center justify-between gap-5 border-t border-yellow-300/25 bg-[linear-gradient(90deg,#020403,#052e22,#020403)] px-8 py-5 text-[14px] font-bold text-yellow-100/85">
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  )
}

function Watermark({
  logoUrl,
  flagUrl,
}: {
  logoUrl: string | null
  flagUrl: string | null
}) {
  return (
    <>
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen"
        />
      ) : null}

      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.055]"
        />
      ) : null}
    </>
  )
}

function GoldPattern() {
  return (
    <>
      <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-bl-full bg-yellow-300/15" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-tr-full bg-yellow-100/8" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_34%)]" />
    </>
  )
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : 'N/A'
}

function getShortVerifyUrl(value: string) {
  return value.replace(/^https?:\/\//, '')
}
