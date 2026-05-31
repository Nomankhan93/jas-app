import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/programs/employment')({
  component: EmploymentProgramPage,
})

const benefits = [
  {
    title: 'Verified Job Seeker Profile',
    text: 'Approved JAS members can submit education, skills, experience and employment preferences.',
    icon: Users,
  },
  {
    title: 'CV Database for Admins',
    text: 'Employment admins can search candidates by skill, education, district, taluka and job status.',
    icon: Search,
  },
  {
    title: 'Skills & Training Interest',
    text: 'Candidates can request skill development support for computer, language, technical and vocational training.',
    icon: GraduationCap,
  },
  {
    title: 'Placement Notes',
    text: 'Admins can shortlist candidates, add interview notes and track placed/unemployed status.',
    icon: BadgeCheck,
  },
]

function EmploymentProgramPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black">
            <BriefcaseBusiness className="h-4 w-4 text-emerald-300" />
            Employment Program
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Youth employment, CV database and skills placement support.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
                JAS Employment Program helps verified members register as job
                seekers, upload CVs, list skills, request training and connect
                with employment committee review.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/programs/employment/apply"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 font-black text-slate-950 no-underline transition hover:bg-emerald-300"
                >
                  Register as Job Seeker
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/programs/employment/my-applications"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-black text-white no-underline transition hover:bg-white/20"
                >
                  My Employment Profile
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
                Phase 1 Includes
              </p>
              <div className="mt-5 space-y-4 text-sm font-semibold text-white/80">
                <Info icon={<FileText className="h-4 w-4" />} text="CV upload and document review" />
                <Info icon={<MapPin className="h-4 w-4" />} text="Preferred job location and salary" />
                <Info icon={<Upload className="h-4 w-4" />} text="Skills, education and experience data" />
                <Info icon={<ShieldCheck className="h-4 w-4" />} text="Restricted admin CV database" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                Employment Support
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
                How the employment module helps
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
      <span className="text-emerald-200">{icon}</span>
      {text}
    </div>
  )
}
