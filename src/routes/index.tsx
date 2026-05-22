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
}> = [
  {
    title: 'Education Support',
    text: 'Promoting education, guidance, scholarships, and support for deserving students.',
    icon: BookOpen,
  },
  {
    title: 'Health Assistance',
    text: 'Helping families access health support, awareness, and emergency assistance.',
    icon: HeartPulse,
  },
  {
    title: 'Employment Guidance',
    text: 'Connecting youth with skills, opportunities, career guidance, and economic empowerment.',
    icon: Briefcase,
  },
  {
    title: 'Social Welfare',
    text: 'Supporting poor, deserving, and vulnerable families through a transparent welfare platform.',
    icon: ShieldCheck,
  },
  {
    title: 'Community Unity',
    text: 'Building love, brotherhood, discipline, and respect among Jatt communities across Sindh.',
    icon: Users,
  },
  {
    title: 'Dignified Representation',
    text: 'Creating a structured platform for verified members and organized representation.',
    icon: Award,
  },
]

function HomePage() {
  return (
    <main className="overflow-hidden bg-slate-50/50 px-4 py-10 md:py-14">
      <section className="page-wrap">
        <HeroSection />

        <TrustStrip />

        <MissionSection />

        <FocusAreas />

        <FinalCTA />
      </section>
    </main>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-emerald-900/10 bg-white p-6 shadow-[0_20px_80px_-15px_rgba(16,185,129,0.20)] md:p-10 lg:p-14">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 animate-pulse rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 animate-pulse rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.10),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(5,150,105,0.08),transparent_34%)]" />

      <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-800 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            Official Membership Portal
          </div>

          <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.3em] text-emerald-900/60">
            JATT ALLIANCE SINDH — JAS
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[1.08] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            Unity, Welfare and{' '}
            <span className="bg-gradient-to-r from-emerald-700 to-emerald-400 bg-clip-text text-transparent">
              Verified Digital
            </span>{' '}
            Membership
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            A disciplined, transparent, and dignified digital platform for
            organizing the Jatt community across Sindh through education,
            health, employment, social welfare, representation, and service to
            humanity.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="group flex items-center rounded-2xl bg-emerald-800 px-7 py-3.5 text-sm font-bold text-white no-underline shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-1 hover:bg-emerald-900 hover:shadow-emerald-900/30"
            >
              Become a Member
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/login"
              className="rounded-2xl border-2 border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 no-underline transition-all hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md [perspective:1000px]">
          <div className="group rounded-[2rem] border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-emerald-900/20 transition-transform duration-500 hover:rotate-1 hover:scale-[1.02]">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6">
              <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[520%] group-hover:opacity-100" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-amber-300 bg-white p-1">
                    <img
                      src="/jas/logo.jpeg"
                      alt="JATT ALLIANCE SINDH logo"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      Digital Member ID
                    </p>
                    <h2 className="mt-1 font-black uppercase tracking-wide text-white">
                      JATT ALLIANCE SINDH
                    </h2>
                  </div>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300 ring-1 ring-emerald-500/50">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              </div>

              <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Member Name
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    Approved Member
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <PreviewInfo label="Member No" value="JAS-2026-001" />
                  <PreviewInfo label="District" value="Sindh" />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
                <div>
                  <p className="text-xs font-bold uppercase text-amber-300">
                    QR Verification
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    Scan to confirm membership
                  </p>
                </div>

                <div className="rounded-lg bg-white p-1.5 text-slate-900">
                  <QrCode className="h-10 w-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-8 hidden rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-xl backdrop-blur-md md:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
              Secure Workflow
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
              Signup
              <ArrowRight className="h-3 w-3 text-slate-400" />
              Review
              <ArrowRight className="h-3 w-3 text-slate-400" />
              Card
            </p>
          </div>
        </div>
      </div>
    </section>
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
    <section className="mt-8 flex flex-wrap justify-center gap-3 md:gap-6">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-4">
          <span className="text-sm font-bold tracking-wide text-slate-600">
            {item}
          </span>

          {index !== items.length - 1 ? (
            <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-500/30 md:block" />
          ) : null}
        </div>
      ))}
    </section>
  )
}

function MissionSection() {
  return (
    <section className="relative mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-12">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-amber-50 opacity-70 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-px w-6 bg-amber-500" />
            <p className="text-sm font-bold uppercase tracking-widest text-amber-600">
              Our Mission
            </p>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            A transparent platform for community welfare
          </h2>
        </div>

        <p className="border-l-2 border-emerald-100 pl-6 text-base leading-8 text-slate-600 md:text-lg">
          <strong className="font-semibold text-emerald-900">
            JATT ALLIANCE SINDH
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
    <section className="mt-16">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
            Focus Areas
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Building a stronger community
          </h2>
        </div>

        <p className="max-w-md text-sm leading-7 text-slate-600">
          JAS focuses on welfare, guidance, unity, and structured membership
          management for long-term community development.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {focusAreas.map((area) => (
          <FeatureCard
            key={area.title}
            title={area.title}
            text={area.text}
            Icon={area.icon}
          />
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="relative mt-16 overflow-hidden rounded-[2rem] bg-slate-950 p-10 text-center text-white shadow-2xl md:p-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-900/30 blur-[80px]" />

      <div className="relative z-10">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-400">
          Join the Platform
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
          Become part of a disciplined, transparent, and dignified platform
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300">
          Create your account, submit your membership form, and receive your
          official digital member ID after admin approval.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-2xl bg-amber-400 px-8 py-4 text-sm font-bold text-slate-950 no-underline transition-transform hover:-translate-y-1 hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/20"
          >
            Apply for Membership
          </Link>

          <Link
            to="/login"
            className="rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white no-underline backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/10"
          >
            Login to Account
          </Link>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  title,
  text,
  Icon,
}: {
  title: string
  text: string
  Icon: LucideIcon
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.18)]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-900/10 transition-colors duration-300 group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:ring-amber-500/20">
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-colors hover:bg-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  )
}