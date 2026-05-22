import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  HeartPulse,
  QrCode,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const focusAreas: Array<{
  title: string
  text: string
  icon: LucideIcon
  color: string
  bg: string
}> = [
  {
    title: 'Education Support',
    text: 'Scholarships, guidance, and academic support for deserving students across all districts.',
    icon: BookOpen,
    color: '#1A4D2E',
    bg: 'rgba(26,77,46,0.07)',
  },
  {
    title: 'Health Assistance',
    text: 'Helping families access healthcare, awareness programs, and emergency medical aid.',
    icon: HeartPulse,
    color: '#C0392B',
    bg: 'rgba(192,57,43,0.07)',
  },
  {
    title: 'Employment Guidance',
    text: 'Skills development, career counselling, and economic empowerment for the youth.',
    icon: Briefcase,
    color: '#B07D2A',
    bg: 'rgba(176,125,42,0.08)',
  },
  {
    title: 'Social Welfare',
    text: 'Transparent welfare support for vulnerable families and those in dire need.',
    icon: ShieldCheck,
    color: '#2E8B78',
    bg: 'rgba(46,139,120,0.08)',
  },
  {
    title: 'Community Unity',
    text: 'Fostering brotherhood, discipline, and mutual respect across the Jatt community in Sindh.',
    icon: Users,
    color: '#6B3E9C',
    bg: 'rgba(107,62,156,0.07)',
  },
  {
    title: 'Dignified Representation',
    text: 'A structured platform for verified membership and organized, dignified representation.',
    icon: Award,
    color: '#1A4D2E',
    bg: 'rgba(26,77,46,0.07)',
  },
]

function HomePage() {
  return (
    <main className="overflow-hidden">
      <div className="page-wrap flex flex-col gap-20 pb-20 pt-12">
        <HeroSection />
        <TrustStrip />
        <MissionSection />
        <FocusAreas />
        <FinalCTA />
      </div>
    </main>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--line-mid)] bg-[linear-gradient(140deg,#FFFEF9_0%,#F5F0E6_55%,#EDF4EE_100%)] p-[clamp(2rem,5vw,4rem)] shadow-[var(--shadow-xl)]">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,149,47,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-[450px] w-[450px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(26,77,46,0.1) 0%, transparent 70%)',
        }}
      />

      <AjrakPattern className="absolute right-0 top-0 opacity-[0.06]" />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[rgba(26,77,46,0.2)] bg-[rgba(26,77,46,0.06)] px-3.5 py-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--gold-light)] opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--gold-light)]" />
            </span>
            <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-[var(--forest)]">
              Official Membership Portal
            </span>
          </div>

          <p className="mb-3 text-[0.72rem] font-extrabold uppercase tracking-[0.25em] text-[var(--ink-muted)]">
            Jatt Alliance Sindh · JAS
          </p>

          <h1 className="display-title m-0 text-[clamp(2.8rem,6vw,5rem)]">
            Unity,
            <br />
            <em className="text-[var(--forest)]">Welfare</em>
            <br />
            &amp; Digital ID
          </h1>

          <div className="ajrak-rule my-6" />

          <p className="m-0 max-w-[520px] text-[1.05rem] leading-8 text-[var(--ink-soft)]">
            A disciplined, transparent, and dignified digital platform for
            organizing the Jatt community across Sindh — through education,
            health, welfare, and verified membership.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link to="/signup" className="primary-btn">
              Become a Member
              <ArrowRight size={16} />
            </Link>

            <Link to="/login" className="secondary-btn">
              Login to Dashboard
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <MemberCardPreview />
        </div>
      </div>
    </section>
  )
}

function MemberCardPreview() {
  return (
    <div className="w-full max-w-[410px]">
      <div className="overflow-hidden rounded-[1.75rem] border border-emerald-900/20 bg-white shadow-[0_30px_80px_rgba(10,30,20,0.26)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#052e22,#064e3b,#0f766e)] p-5 text-white">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-yellow-300/15" />
          <div className="absolute bottom-0 left-0 h-20 w-20 rounded-tr-full bg-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-yellow-300 bg-white p-0.5 shadow-xl">
                <img
                  src="/jas/logo.jpeg"
                  alt="Jatt Alliance Sindh logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <div>
                <p className="m-0 text-[0.6rem] font-black uppercase tracking-[0.22em] text-yellow-300">
                  Digital Member ID
                </p>
                <p className="mt-1 text-[0.92rem] font-black uppercase tracking-wide text-white">
                  JATT ALLIANCE SINDH
                </p>
                <p className="mt-1 text-[0.7rem] font-medium text-emerald-50">
                  Official verified membership card
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-300 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide text-emerald-950">
              <CheckCircle2 size={11} />
              Verified
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5">
          <img
            src="/jas/logo.jpeg"
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.04]"
          />

          <div className="relative grid grid-cols-[92px_1fr] gap-4">
            <div>
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-lg ring-2 ring-yellow-300/70">
                <Users size={36} className="text-slate-300" />
              </div>

              <div className="mt-3 rounded-2xl border border-yellow-300 bg-emerald-950 p-2 text-center">
                <p className="text-[0.55rem] font-black uppercase tracking-wide text-yellow-300">
                  Member No
                </p>
                <p className="mt-1 text-[0.72rem] font-black text-white">
                  JAS-2026-001
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">
                Member Name
              </p>
              <h3 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                Approved Member
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <PreviewInfo label="District" value="Sindh" />
                <PreviewInfo label="Status" value="Approved" />
                <PreviewInfo label="Taluka" value="Verified" />
                <PreviewInfo label="QR" value="Enabled" />
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-800">
                QR Verification
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Scan to confirm membership
              </p>
            </div>

            <div className="rounded-xl bg-white p-2 shadow-sm">
              <QrCode size={42} color="#052e22" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="m-0 text-[0.7rem] leading-5 text-slate-500">
            Digital ID is issued after admin approval and verified through a QR
            code.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-4 flex w-fit items-center gap-2 rounded-xl border border-[var(--line-mid)] bg-white px-4 py-2 shadow-[var(--shadow-md)]">
        <span className="text-[0.72rem] font-bold text-[var(--ink-soft)]">
          Signup
        </span>
        <ArrowRight size={10} color="var(--ink-muted)" />
        <span className="text-[0.72rem] font-bold text-[var(--ink-soft)]">
          Review
        </span>
        <ArrowRight size={10} color="var(--ink-muted)" />
        <span className="text-[0.72rem] font-bold text-[var(--forest)]">
          Digital Card
        </span>
      </div>
    </div>
  )
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-2">
      <p className="m-0 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="m-0 mt-1 text-[0.78rem] font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function TrustStrip() {
  const items = [
    'Non-Political',
    'Non-Profit',
    'Non-Sectarian',
    'Welfare Organization',
    'QR Verified ID',
  ]

  return (
    <section className="rounded-[1.25rem] border border-[var(--line)] bg-[linear-gradient(90deg,rgba(26,77,46,0.03),rgba(255,255,255,0.7),rgba(176,125,42,0.04))] px-8 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {items.map((item) => (
          <span
            key={item}
            className="text-[0.8rem] font-bold uppercase tracking-[0.06em] text-[var(--ink-soft)]"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

function MissionSection() {
  return (
    <section className="relative grid items-center gap-12 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-[clamp(2rem,4vw,3.5rem)] shadow-[var(--shadow-sm)] md:grid-cols-[0.85fr_1.15fr]">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,var(--forest),var(--teal),var(--gold-light))]" />

      <div className="pl-4">
        <p className="section-eyebrow mb-4">Our Mission</p>
        <h2 className="section-title">
          A transparent platform for community welfare
        </h2>
        <div className="ajrak-rule mt-5" />
      </div>

      <div>
        <p className="m-0 font-[var(--font-display)] text-[clamp(1.1rem,2.2vw,1.35rem)] italic leading-8 text-[var(--ink-soft)]">
          <strong className="not-italic text-[var(--forest)]">
            Jatt Alliance Sindh
          </strong>{' '}
          is a non-political, non-profit, non-sectarian welfare organization
          established to organize and support the Jatt community living across
          Sindh in the fields of education, health, employment, social welfare,
          unity, dignified representation, and service to humanity.
        </p>
      </div>
    </section>
  )
}

function FocusAreas() {
  return (
    <section>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="section-eyebrow mb-3">Focus Areas</p>
          <h2 className="section-title">
            Building a stronger
            <br />
            community together
          </h2>
        </div>

        <p className="m-0 max-w-sm text-sm leading-7 text-[var(--ink-soft)]">
          JAS focuses on six pillars of welfare, unity, and structured
          membership for long-term community development.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {focusAreas.map((area, index) => (
          <FeatureCard key={area.title} {...area} index={index} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({
  title,
  text,
  icon: Icon,
  color,
  bg,
  index,
}: {
  title: string
  text: string
  icon: LucideIcon
  color: string
  bg: string
  index: number
}) {
  return (
    <article
      className="feature-card p-7"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div
        className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl"
        style={{ background: bg }}
      >
        <Icon size={22} color={color} strokeWidth={1.75} />
      </div>

      <h3 className="mb-2 mt-0 font-[var(--font-display)] text-[1.35rem] font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h3>

      <p className="m-0 text-[0.875rem] leading-7 text-[var(--ink-soft)]">
        {text}
      </p>

      <div
        className="relative mt-6 h-0.5 overflow-hidden rounded-full"
        style={{ background: bg }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-40"
          style={{ background: color }}
        />
      </div>
    </article>
  )
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(140deg,#0B1F14_0%,#14321E_50%,#0E2A1A_100%)] p-[clamp(2.5rem,6vw,5rem)] text-center shadow-[0_40px_100px_rgba(10,28,18,0.35)]">
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse, rgba(26,77,46,0.6) 0%, transparent 70%)',
        }}
      />

      <AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" />

      <div className="absolute left-1/2 top-0 h-1 w-32 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,var(--gold-light),transparent)]" />

      <div className="relative z-10">
        <p className="mb-5 text-[0.72rem] font-extrabold uppercase tracking-[0.25em] text-[var(--gold-light)]">
          Join the Platform
        </p>

        <h2 className="mx-auto mb-6 max-w-3xl font-[var(--font-display)] text-[clamp(2rem,5vw,4rem)] font-bold leading-tight tracking-tight text-white">
          Become part of a disciplined,
          <br />
          <em className="text-[rgba(201,149,47,0.9)]">transparent</em>{' '}
          platform
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-base leading-8 text-white/65">
          Create your account, submit your membership form, and receive your
          official digital member ID after admin approval.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-light))] px-8 py-4 text-sm font-extrabold text-[#0B1F14] shadow-[0_8px_30px_rgba(176,125,42,0.4)] transition hover:-translate-y-0.5"
          >
            Apply for Membership
            <ArrowRight size={16} />
          </Link>

          <Link to="/login" className="ghost-btn">
            Login to Account
          </Link>
        </div>
      </div>
    </section>
  )
}

function AjrakPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      width="320"
      height="320"
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, column) => (
          <rect
            key={`${row}-${column}`}
            x={column * 40 + 20}
            y={row * 40 + 20}
            width="12"
            height="12"
            transform={`rotate(45 ${column * 40 + 26} ${row * 40 + 26})`}
            fill="#1A4D2E"
          />
        )),
      )}
    </svg>
  )
}