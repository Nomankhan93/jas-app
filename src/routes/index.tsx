// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HeartPulse,
  IdCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const highlights = [
  { label: 'Verified Digital ID', value: 'QR Based' },
  { label: 'Application Review', value: 'Admin Approved' },
  { label: 'Community Scope', value: 'Across Sindh' },
]

const trustItems = [
  'Non-Political',
  'Non-Profit',
  'Non-Sectarian',
  'Welfare Organization',
  'Admin Approved',
  'QR Verified ID',
]

const membershipSteps: Array<{
  title: string
  text: string
  icon: LucideIcon
}> = [
  {
    title: 'Create Account',
    text: 'Signup with email or mobile OTP to access the member portal.',
    icon: Users,
  },
  {
    title: 'Submit Form',
    text: 'Complete your membership profile, address, district and photo.',
    icon: FileCheck2,
  },
  {
    title: 'Admin Review',
    text: 'JAS admin verifies the application before approval.',
    icon: ClipboardCheck,
  },
  {
    title: 'Digital Card',
    text: 'Approved members receive a QR-based digital membership card.',
    icon: IdCard,
  },
]

const focusAreas: Array<{
  title: string
  text: string
  icon: LucideIcon
  color: string
  bg: string
}> = [
  {
    title: 'Education Support',
    text: 'Scholarships, guidance, and academic support for deserving students across Sindh.',
    icon: BookOpen,
    color: '#1A4D2E',
    bg: 'rgba(26,77,46,0.07)',
  },
  {
    title: 'Health Assistance',
    text: 'Healthcare awareness, support guidance, and emergency medical help for families.',
    icon: HeartPulse,
    color: '#C0392B',
    bg: 'rgba(192,57,43,0.07)',
  },
  {
    title: 'Employment Guidance',
    text: 'Skills development, career counselling, and economic empowerment for youth.',
    icon: Briefcase,
    color: '#B07D2A',
    bg: 'rgba(176,125,42,0.08)',
  },
  {
    title: 'Social Welfare',
    text: 'Transparent welfare support for vulnerable families and deserving community members.',
    icon: ShieldCheck,
    color: '#2E8B78',
    bg: 'rgba(46,139,120,0.08)',
  },
  {
    title: 'Community Unity',
    text: 'Promoting brotherhood, discipline, mutual respect, and organized community connection.',
    icon: Users,
    color: '#6B3E9C',
    bg: 'rgba(107,62,156,0.07)',
  },
  {
    title: 'Dignified Representation',
    text: 'A structured platform for verified membership and respectful community representation.',
    icon: Award,
    color: '#1A4D2E',
    bg: 'rgba(26,77,46,0.07)',
  },
]

function HomePage() {
  return (
    <main className="overflow-hidden">
      <div className="page-wrap flex flex-col gap-20 pb-24 pt-10 lg:gap-24 lg:pt-12">
        <HeroSection />
        <TrustStrip />
        <MembershipFlow />
        <MissionSection />
        <FocusAreas />
        <FinalCTA />
      </div>
    </main>
  )
}

function HeroSection() {
  return (
    <section className="soft-panel animate-fade-up relative overflow-hidden rounded-[2.5rem] border-[#e8e0d1] bg-[linear-gradient(135deg,#fffdf8_0%,#f7f1e6_50%,#edf4ee_100%)] p-[clamp(1.5rem,4vw,3.5rem)] shadow-[0_30px_80px_rgba(11,42,29,0.10)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,145,44,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(11,42,29,0.10),transparent_30%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-bl-[5rem] bg-[rgba(255,255,255,0.28)]"
        aria-hidden="true"
      />
      <AjrakPattern className="absolute right-[-2rem] top-[-2rem] h-64 w-64 opacity-[0.05]" />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="animate-fade-up glass-strip inline-flex items-center gap-2.5 rounded-full border border-emerald-900/10 px-3.5 py-2 shadow-sm backdrop-blur">
            <span className="brand-dot" />
            <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
              Official Membership Portal
            </span>
          </div>

          <p className="animate-fade-up delay-1 mt-7 text-[0.72rem] font-extrabold uppercase tracking-[0.24em] text-stone-500">
            Jatt Alliance Sindh · JAS
          </p>

          <h1 className="display-title text-balance animate-fade-up delay-2 mt-3 text-[clamp(3rem,6vw,5.3rem)]">
            Unity,
            <br />
            <span className="text-[var(--forest)]">Welfare</span>
            <br />
            &amp; Digital Identity
          </h1>

          <div className="ajrak-rule animate-fade-in delay-2 my-6" />

          <p className="text-pretty animate-fade-up delay-3 m-0 max-w-[620px] text-[1.02rem] leading-8 text-stone-600">
            A disciplined, transparent, and dignified platform for organizing the
            Jatt community across Sindh through verified membership, admin
            approval, QR verification, and digital member cards.
          </p>

          <div className="animate-fade-up delay-4 mt-9 flex flex-wrap gap-3.5">
            <Link to="/signup" className="primary-btn pressable lift-hover">
              Become a Member
              <ArrowRight size={16} />
            </Link>

            <Link to="/login" className="secondary-btn pressable lift-hover">
              Login to Dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item, index) => (
              <div
                key={item.label}
                className={`soft-panel animate-fade-up ${getDelayClass(index)} rounded-[1.25rem] border-white/70 bg-white/72 px-4 py-3 shadow-sm backdrop-blur`}
              >
                <p className="m-0 text-[0.66rem] font-extrabold uppercase tracking-[0.18em] text-stone-400">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-black text-stone-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-scale-in delay-3 flex justify-center lg:justify-end">
          <MemberCardPreview />
        </div>
      </div>
    </section>
  )
}

function MemberCardPreview() {
  return (
    <div className="lift-hover w-full max-w-[420px]">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-950/15 bg-white shadow-[0_36px_90px_rgba(11,42,29,0.22)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#06281b,#0b3a28,#115d46)] px-5 pb-6 pt-5 text-white">
          <div
            className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#d8a949]/15"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-[3rem] bg-white/10"
            aria-hidden="true"
          />
          <AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[#d8a949] bg-white p-0.5 shadow-xl">
                <img
                  src="/jas/logo.jpeg"
                  alt="Jatt Alliance Sindh logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <div>
                <p className="m-0 text-[0.6rem] font-black uppercase tracking-[0.22em] text-[#f2d48f]">
                  Digital Member ID
                </p>
                <p className="mt-1 text-[0.92rem] font-black uppercase tracking-wide text-white">
                  JATT ALLIANCE SINDH
                </p>
                <p className="mt-1 text-[0.72rem] font-medium text-emerald-50/80">
                  Official verified membership card
                </p>
              </div>
            </div>

            <span className="badge-soft rounded-full bg-[#f2d48f] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide text-emerald-950">
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

          <div className="relative grid grid-cols-[96px_1fr] gap-4">
            <div>
              <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] border-4 border-white bg-slate-100 shadow-lg ring-2 ring-[#f2d48f]/70">
                <Users size={36} className="text-slate-300" />
              </div>

              <div className="mt-3 rounded-[1.25rem] border border-[#f2d48f] bg-emerald-950 p-2.5 text-center">
                <p className="text-[0.55rem] font-black uppercase tracking-wide text-[#f2d48f]">
                  Member No
                </p>
                <p className="mt-1 text-[0.74rem] font-black text-white">
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

          <div className="soft-panel mt-5 flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="m-0 text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-800">
                QR Verification
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Scan to confirm membership
              </p>
            </div>

            <div className="soft-panel lift-hover rounded-xl bg-white p-2 shadow-sm">
              <QrCode size={42} color="#052e22" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="m-0 text-[0.72rem] leading-5 text-slate-500">
            Digital ID is issued after admin approval and verified through a QR
            code.
          </p>
        </div>
      </div>

      <div className="soft-panel animate-fade-up delay-4 relative z-10 mx-auto -mt-4 flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
        <span className="text-[0.72rem] font-bold text-stone-600">Signup</span>
        <ArrowRight size={10} className="text-stone-400" />
        <span className="text-[0.72rem] font-bold text-stone-600">Review</span>
        <ArrowRight size={10} className="text-stone-400" />
        <span className="text-[0.72rem] font-bold text-emerald-900">
          Digital Card
        </span>
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section className="glass-strip animate-fade-up rounded-[1.5rem] border border-[#e8e0d1] px-6 py-5 shadow-sm sm:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {trustItems.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-stone-600"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4912c]" />
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

function MembershipFlow() {
  return (
    <section className="animate-fade-up">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="section-eyebrow mb-3">How Membership Works</p>
          <h2 className="section-title text-balance">
            Simple, verified,
            <br />
            and transparent process
          </h2>
        </div>

        <p className="text-pretty m-0 max-w-md text-sm leading-7 text-stone-600">
          JAS membership portal focuses on registration, admin approval, digital
          ID card generation, and public QR verification.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {membershipSteps.map((step, index) => {
          const Icon = step.icon

          return (
            <article
              key={step.title}
              className={`soft-panel animate-fade-up ${getDelayClass(index)} relative overflow-hidden rounded-[1.5rem] border border-[#e8e0d1] bg-white/90 p-5 shadow-sm`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon size={20} />
                </div>

                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <h3 className="font-[Cormorant_Garamond,serif] text-2xl font-bold tracking-tight text-stone-950">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-7 text-stone-600">{step.text}</p>

              {index < membershipSteps.length - 1 ? (
                <ArrowRight
                  size={18}
                  className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-stone-300 md:block"
                />
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function MissionSection() {
  return (
    <section className="soft-panel animate-fade-up relative overflow-hidden rounded-[2rem] border border-[#e8e0d1] bg-white/90 p-[clamp(2rem,4vw,3.5rem)] shadow-[0_20px_55px_rgba(11,42,29,0.07)]">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#1a4d2e,#2e8b78,#d8a949)]" />

      <div className="grid items-center gap-12 md:grid-cols-[0.85fr_1.15fr]">
        <div className="pl-4">
          <p className="section-eyebrow mb-4">Our Mission</p>
          <h2 className="section-title text-balance">
            A transparent platform for community welfare
          </h2>
          <div className="ajrak-rule mt-5" />
        </div>

        <div className="soft-panel lift-hover rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,#fffdf9,#faf7f1)] p-6">
          <p className="m-0 font-[Cormorant_Garamond,serif] text-[clamp(1.15rem,2.2vw,1.42rem)] italic leading-8 text-stone-600">
            <strong className="not-italic text-emerald-900">
              Jatt Alliance Sindh
            </strong>{' '}
            is a non-political, non-profit, non-sectarian welfare organization
            established to organize and support the Jatt community living across
            Sindh in the fields of education, health, employment, social
            welfare, unity, dignified representation, and service to humanity.
          </p>
        </div>
      </div>
    </section>
  )
}

function FocusAreas() {
  return (
    <section className="animate-fade-up">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="section-eyebrow mb-3">Focus Areas</p>
          <h2 className="section-title text-balance">
            Building a stronger
            <br />
            community together
          </h2>
        </div>

        <p className="text-pretty m-0 max-w-sm text-sm leading-7 text-stone-600">
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
    <article className={`feature-card group animate-fade-up ${getDelayClass(index)} p-7`}>
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: bg }}
      >
        <Icon size={22} color={color} strokeWidth={1.75} />
      </div>

      <h3 className="mb-2 mt-0 font-[Cormorant_Garamond,serif] text-[1.5rem] font-bold tracking-tight text-stone-950">
        {title}
      </h3>

      <p className="m-0 text-[0.92rem] leading-7 text-stone-600">{text}</p>

      <div className="mt-6 flex items-center justify-between">
        <div
          className="h-0.5 flex-1 overflow-hidden rounded-full"
          style={{ background: bg }}
        >
          <div
            className="h-full w-1/2 rounded-full opacity-50"
            style={{ background: color }}
          />
        </div>

        <span className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 text-stone-400 transition group-hover:bg-emerald-50 group-hover:text-emerald-900">
          <ArrowRight size={16} />
        </span>
      </div>
    </article>
  )
}

function FinalCTA() {
  return (
    <section className="animate-fade-up relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(140deg,#0b1f14_0%,#14321e_50%,#0e2a1a_100%)] p-[clamp(2.5rem,6vw,5rem)] text-center shadow-[0_40px_100px_rgba(10,28,18,0.35)]">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,77,46,0.6)_0%,transparent_70%)]" />
      <AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" />
      <div className="absolute left-1/2 top-0 h-1 w-32 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,#f2d48f,transparent)]" />

      <div className="relative z-10">
        <div className="badge-soft mb-5 border border-white/10 bg-white/5 px-3 py-1.5 text-[#f2d48f]">
          <Sparkles size={14} />
          <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.24em]">
            Join the Platform
          </span>
        </div>

        <h2 className="display-title text-balance mx-auto mb-6 max-w-3xl text-[clamp(2.2rem,5vw,4.3rem)] leading-tight text-white">
          Become part of a disciplined,
          <br />
          <em className="text-[#d8a949]">transparent</em> platform
        </h2>

        <p className="text-pretty mx-auto mb-10 max-w-2xl text-base leading-8 text-white/70">
          Create your account, submit your membership form, and receive your
          official digital member ID after admin approval.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/signup"
            className="pressable lift-hover inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-8 py-4 text-sm font-extrabold text-[#0B1F14] shadow-[0_10px_30px_rgba(176,125,42,0.4)]"
          >
            Apply for Membership
            <ArrowRight size={16} />
          </Link>

          <Link to="/login" className="ghost-btn pressable lift-hover">
            Login to Account
          </Link>
        </div>
      </div>
    </section>
  )
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel lift-hover rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <p className="m-0 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="m-0 mt-1 text-[0.78rem] font-bold text-slate-950">
        {value}
      </p>
    </div>
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

function getDelayClass(index: number) {
  const delays = ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5']
  return delays[index] ?? 'delay-5'
}