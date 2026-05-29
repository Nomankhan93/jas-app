// src/routes/programs/welfare.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  FileCheck2,
  HandHeart,
  Home,
  PackageCheck,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/programs/welfare')({
  component: WelfareProgramPage,
})

function WelfareProgramPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-4 py-16 text-white md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">
              <HandHeart className="h-4 w-4 text-amber-300" />
              Welfare Case Management
            </div>
            <h1 className="mt-5 text-4xl font-black md:text-6xl">
              JAS Welfare Support Cases
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Financial help, ration support, widow/orphan support, emergency help, marriage support, disaster relief, legal help aur family support ke liye transparent case workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/programs/welfare/apply" className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950 no-underline transition hover:bg-amber-300">
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/programs/welfare/my-applications" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-black text-white no-underline transition hover:bg-white/20">
                My Welfare Cases
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <h2 className="text-2xl font-black">Professional Workflow</h2>
            <div className="mt-5 grid gap-3 text-sm font-semibold text-white/80">
              {[
                'Case submitted',
                'District/Taluka verification',
                'Documents checked',
                'Assigned to welfare committee',
                'Approval decision',
                'Fund/payment issued',
                'Case closed with report',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard icon={<BadgeIndianRupee />} title="Financial Help" text="Income crisis, urgent needs, family hardship and approved support amount tracking." />
            <FeatureCard icon={<PackageCheck />} title="Ration & Emergency" text="Ration support, emergency relief and disaster response cases with priority queue." />
            <FeatureCard icon={<Users />} title="Family Support" text="Widow, orphan, marriage, legal and family support cases with committee review." />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MiniStep icon={<Home />} label="Applicant details" />
              <MiniStep icon={<FileCheck2 />} label="Documents upload" />
              <MiniStep icon={<ShieldCheck />} label="Verification" />
              <MiniStep icon={<Scale />} label="Committee decision" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        {icon}
      </div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  )
}

function MiniStep({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">{icon}</span>
      {label}
    </div>
  )
}
