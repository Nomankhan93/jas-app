// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HandHeart,
  HeartPulse,
  IdCard,
  QrCode,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useHomeCopy } from '../lib/home-i18n'

export const Route = createFileRoute('/')({ component: HomePage })

type ProgramCard = {
  title: string
  text: string
  to: string
  badge: string
  badgeTone: 'active' | 'manual' | 'soon'
  icon: LucideIcon
}

type PortalFeature = {
  title: string
  text: string
  icon: LucideIcon
}

function HomePage() {
  const { textDir } = useHomeCopy()

  return (
    <main className="home-page overflow-hidden" dir={textDir}>
      <div className="home-page-wrap page-wrap flex flex-col gap-14 pb-20 pt-8 sm:gap-16 sm:pb-24 sm:pt-10 lg:gap-20 lg:pt-12">
        <HeroSection />
        <MembershipFlow />
        <ProgramGateway />
        <PortalFeatures />
        <FinalCTA />
      </div>
    </main>
  )
}

function HeroSection() {
  const { copy, textDir, textAlignClass, arrowClass } = useHomeCopy()

  return (
    <section className="home-hero soft-panel animate-fade-up relative overflow-hidden rounded-[2rem] border-[#e8e0d1] bg-[linear-gradient(135deg,#fffdf8_0%,#f7f1e6_50%,#edf4ee_100%)] p-[clamp(1.35rem,4vw,3.5rem)] shadow-[0_30px_80px_rgba(11,42,29,0.10)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,145,44,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(11,42,29,0.10),transparent_30%)]"
        aria-hidden="true"
      />
      <AjrakPattern className="absolute right-[-2rem] top-[-2rem] h-64 w-64 opacity-[0.05]" />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className={textAlignClass} dir={textDir}>
          <div className="animate-fade-up glass-strip inline-flex items-center gap-2.5 rounded-full border border-emerald-900/10 px-3.5 py-2 shadow-sm backdrop-blur">
            <span className="brand-dot" />
            <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
              {copy.portalBadge}
            </span>
          </div>

          <p className="animate-fade-up delay-1 mt-7 text-[0.72rem] font-extrabold uppercase tracking-[0.24em] text-stone-500">
            {copy.brandLine}
          </p>

          <h1 className="home-hero-title animate-fade-up delay-2 mt-4 max-w-[760px] text-[clamp(2.35rem,12vw,5.6rem)] font-black uppercase leading-[0.94] tracking-[-0.06em] text-stone-950 sm:text-[clamp(2.8rem,5.8vw,5.6rem)]">
            {copy.heroTitleLine1}
            <br />
            <span className="text-[var(--forest)]">{copy.heroTitleLine2}</span>
          </h1>

          <div className="ajrak-rule animate-fade-in delay-2 my-6" />

          <p className="text-pretty animate-fade-up delay-3 m-0 max-w-[650px] text-[1.08rem] font-medium leading-8 text-stone-600">
            {copy.heroDescription}
          </p>

          <div className="home-hero-actions animate-fade-up delay-4 mt-9 flex flex-wrap gap-3.5">
            <Link to="/signup" className="primary-btn pressable lift-hover">
              {copy.actions.apply}
              <ArrowRight size={16} className={arrowClass} />
            </Link>
            <a href="#programs-gateway" className="secondary-btn pressable lift-hover">
              {copy.actions.viewPrograms}
            </a>
            <Link to="/donate" className="secondary-btn pressable lift-hover">
              {copy.actions.donate}
            </Link>
          </div>

          <div className="home-stat-grid mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.portalStats.map((item, index) => (
              <div
                key={item.label}
                className={`soft-panel animate-fade-up ${getDelayClass(index)} rounded-[1.1rem] border-white/70 bg-white/72 px-4 py-3 shadow-sm backdrop-blur`}
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

        <div className="animate-scale-in delay-3 flex justify-center lg:justify-end" dir="ltr">
          <PortalCardPreview />
        </div>
      </div>
    </section>
  )
}

function PortalCardPreview() {
  const { copy } = useHomeCopy()
  const preview = copy.preview

  return (
    <div className="home-card-preview lift-hover w-full max-w-[430px]" dir="ltr">
      <div className="overflow-hidden rounded-[1.75rem] border border-emerald-950/15 bg-white shadow-[0_36px_90px_rgba(11,42,29,0.22)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#06281b,#0b3a28,#115d46)] px-5 pb-6 pt-5 text-white">
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
                <p className="mt-1 text-[0.92rem] font-extrabold uppercase tracking-[-0.01em] text-white">
                  JATT ALLIANCE SINDH
                </p>
                <p className="mt-1 text-[0.72rem] font-medium text-emerald-50/80">
                  {preview.cardSubtitle}
                </p>
              </div>
            </div>

            <span className="badge-soft rounded-full bg-[#f2d48f] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide text-emerald-950">
              <CheckCircle2 size={11} />
              {preview.verified}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5">
          <img
            src="/jas/logo.jpeg"
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.04]"
          />

          <div className="home-card-preview-body relative grid grid-cols-[96px_1fr] gap-4">
            <div>
              <div className="flex h-24 w-24 items-center justify-center rounded-[1.35rem] border-4 border-white bg-slate-100 shadow-lg ring-2 ring-[#f2d48f]/70">
                <Users size={36} className="text-slate-300" />
              </div>
              <div className="mt-3 rounded-[1rem] border border-[#f2d48f] bg-emerald-950 p-2.5 text-center">
                <p className="text-[0.55rem] font-black uppercase tracking-wide text-[#f2d48f]">
                  {preview.memberNo}
                </p>
                <p className="mt-1 text-[0.74rem] font-black text-white">
                  JAS-2026-001
                </p>
              </div>
            </div>

            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">
                {preview.memberName}
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">
                {preview.memberNameValue}
              </h3>
              <div className="home-card-preview-info mt-4 grid grid-cols-2 gap-2">
                <PreviewInfo label={preview.status} value={preview.approved} />
                <PreviewInfo label={preview.district} value={preview.sindh} />
                <PreviewInfo label={preview.card} value={preview.qrVerified} />
                <PreviewInfo label={preview.access} value={preview.programs} />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <QrCode size={42} className="text-emerald-950" />
                <p className="m-0 text-[0.72rem] font-bold leading-5 text-emerald-950">
                  {preview.qrText}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="m-0 text-[0.72rem] leading-5 text-slate-500">
            {preview.footer}
          </p>
        </div>
      </div>

      <div className="soft-panel animate-fade-up delay-4 relative z-10 mx-auto -mt-4 flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
        <span className="text-[0.72rem] font-bold text-stone-600">{preview.signup}</span>
        <ArrowRight size={10} className="text-stone-400" />
        <span className="text-[0.72rem] font-bold text-stone-600">{preview.review}</span>
        <ArrowRight size={10} className="text-stone-400" />
        <span className="text-[0.72rem] font-bold text-emerald-900">
          {preview.digitalCard}
        </span>
      </div>
    </div>
  )
}

function MembershipFlow() {
  const { copy, textDir, textAlignClass, isRtl, arrowClass } = useHomeCopy()

  const membershipSteps = [
    { ...copy.membershipFlow.steps[0], icon: UserPlus },
    { ...copy.membershipFlow.steps[1], icon: FileCheck2 },
    { ...copy.membershipFlow.steps[2], icon: ClipboardCheck },
    { ...copy.membershipFlow.steps[3], icon: IdCard },
  ]

  return (
    <section className="home-section animate-fade-up">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className={textAlignClass} dir={textDir}>
          <p className="section-eyebrow mb-3">{copy.membershipFlow.eyebrow}</p>
          <h2 className="section-title text-balance">
            {copy.membershipFlow.titleLine1}
            <br />
            {copy.membershipFlow.titleLine2}
          </h2>
        </div>
        <p
          className={`text-pretty m-0 max-w-md text-sm leading-7 text-stone-600 ${textAlignClass}`}
          dir={textDir}
        >
          {copy.membershipFlow.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {membershipSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <article
              key={step.title}
              className={`soft-panel animate-fade-up ${getDelayClass(index)} relative overflow-hidden rounded-[1.35rem] border border-[#e8e0d1] bg-white/90 p-5 shadow-sm ${textAlignClass}`}
              dir={textDir}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon size={20} />
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-stone-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                {step.text}
              </p>
              {index < membershipSteps.length - 1 ? (
                <ArrowRight
                  size={18}
                  className={`absolute top-1/2 hidden -translate-y-1/2 text-stone-300 md:block ${
                    isRtl ? 'left-4' : 'right-4'
                  } ${arrowClass}`}
                />
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ProgramGateway() {
  const { copy, textDir, textAlignClass, arrowClass } = useHomeCopy()

  const programModules: ProgramCard[] = [
    {
      ...copy.programs.membership,
      to: '/signup',
      badgeTone: 'active',
      icon: IdCard,
    },
    {
      ...copy.programs.education,
      to: '/programs/education',
      badgeTone: 'active',
      icon: GraduationCap,
    },
    {
      ...copy.programs.health,
      to: '/programs/health',
      badgeTone: 'active',
      icon: HeartPulse,
    },
    {
      ...copy.programs.welfare,
      to: '/programs/welfare',
      badgeTone: 'soon',
      icon: HandHeart,
    },
    {
      ...copy.programs.employment,
      to: '/programs/employment',
      badgeTone: 'soon',
      icon: BriefcaseBusiness,
    },
    {
      ...copy.programs.donation,
      to: '/donate',
      badgeTone: 'manual',
      icon: BadgeIndianRupee,
    },
  ]

  return (
    <section id="programs-gateway" className="animate-fade-up scroll-mt-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className={textAlignClass} dir={textDir}>
          <p className="section-eyebrow mb-3">{copy.programs.eyebrow}</p>
          <h2 className="section-title text-balance">
            {copy.programs.titleLine1}
            <br />
            {copy.programs.titleLine2}
          </h2>
        </div>
        <p
          className={`text-pretty m-0 max-w-md text-sm leading-7 text-stone-600 ${textAlignClass}`}
          dir={textDir}
        >
          {copy.programs.description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {programModules.map((program, index) => {
          const Icon = program.icon
          return (
            <article
              key={program.title}
              className={`feature-card group animate-fade-up ${getDelayClass(index)} p-7 ${textAlignClass}`}
              dir={textDir}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-[#9a6a12]">
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <ProgramBadge tone={program.badgeTone}>{program.badge}</ProgramBadge>
              </div>

              <h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-stone-950">
                {program.title}
              </h3>
              <p className="m-0 text-[0.92rem] leading-7 text-stone-600">
                {program.text}
              </p>

              <Link
                to={program.to}
                className="jas-dark-action-link mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black no-underline transition"
              >
                {copy.actions.open}
                <ArrowRight size={15} className={arrowClass} />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PortalFeatures() {
  const { copy, textDir, textAlignClass } = useHomeCopy()

  const portalFeatures: PortalFeature[] = [
    {
      ...copy.features.qr,
      icon: QrCode,
    },
    {
      ...copy.features.admin,
      icon: ShieldCheck,
    },
    {
      ...copy.features.dashboard,
      icon: Users,
    },
  ]

  return (
    <section className="animate-fade-up rounded-[2rem] border border-[#e8e0d1] bg-white/80 p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className={textAlignClass} dir={textDir}>
          <p className="section-eyebrow mb-3">{copy.features.eyebrow}</p>
          <h2 className="section-title text-balance">
            {copy.features.titleLine1}
            <br />
            {copy.features.titleLine2}
          </h2>
        </div>
        <p
          className={`text-pretty m-0 max-w-md text-sm leading-7 text-stone-600 ${textAlignClass}`}
          dir={textDir}
        >
          {copy.features.description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {portalFeatures.map((feature, index) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.title}
              className={`soft-panel animate-fade-up ${getDelayClass(index)} rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm ${textAlignClass}`}
              dir={textDir}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-stone-950">
                {feature.title}
              </h3>
              <p className="m-0 text-[0.92rem] leading-7 text-stone-600">
                {feature.text}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FinalCTA() {
  const { copy, arrowClass } = useHomeCopy()

  return (
    <section className="animate-fade-up relative overflow-hidden rounded-[2rem] bg-[linear-gradient(140deg,#0b1f14_0%,#14321e_50%,#0e2a1a_100%)] p-[clamp(2.5rem,6vw,5rem)] text-center shadow-[0_40px_100px_rgba(10,28,18,0.35)]">
      <AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" />
      <div className="relative z-10">
        <div className="badge-soft mb-5 border border-white/10 bg-white/5 px-3 py-1.5 text-[#f2d48f]">
          <ShieldCheck size={14} />
          <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.24em]">
            {copy.finalCta.badge}
          </span>
        </div>
        <h2 className="display-title text-balance mx-auto mb-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] leading-tight text-white">
          {copy.finalCta.titleLine1}
          <br />
          <em className="text-[#d8a949]">{copy.finalCta.titleLine2}</em>
        </h2>
        <p className="text-pretty mx-auto mb-10 max-w-2xl text-base leading-8 text-white/70">
          {copy.finalCta.description}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/signup"
            className="pressable lift-hover inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-8 py-4 text-sm font-extrabold text-[#0B1F14] shadow-[0_10px_30px_rgba(176,125,42,0.4)]"
          >
            {copy.actions.apply}
            <ArrowRight size={16} className={arrowClass} />
          </Link>
          <a href="#programs-gateway" className="ghost-btn pressable lift-hover">
            {copy.actions.viewPrograms}
          </a>
          <Link to="/donate" className="ghost-btn pressable lift-hover">
            {copy.actions.donate}
          </Link>
        </div>
      </div>
    </section>
  )
}

function ProgramBadge({
  children,
  tone,
}: {
  children: string
  tone: ProgramCard['badgeTone']
}) {
  const className =
    tone === 'active'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
      : tone === 'manual'
        ? 'bg-amber-50 text-amber-800 ring-amber-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200'

  return (
    <span
      className={`rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ring-1 ${className}`}
    >
      {children}
    </span>
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
