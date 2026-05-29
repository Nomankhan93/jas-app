import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileHeart,
  HeartPulse,
  Hospital,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

export const Route = createFileRoute('/programs/health')({
  component: HealthRoute,
})

const features = [
  {
    title: 'Medical Help Application',
    description:
      'Members can request medical support for treatment, medicines, hospital admission, surgery, lab tests or emergency cases.',
    icon: HeartPulse,
  },
  {
    title: 'Private Medical Documents',
    description:
      'CNIC, reports, prescription, hospital estimate and lab reports are uploaded to a private restricted bucket.',
    icon: FileHeart,
  },
  {
    title: 'Health Committee Review',
    description:
      'Only authorized health admins or committee reviewers can open full case details and verify documents.',
    icon: ShieldCheck,
  },
]

const requiredDocuments = [
  'Patient CNIC / B-form',
  'Member CNIC',
  'Medical reports',
  'Doctor prescription',
  'Hospital estimate or bill',
  'Lab reports if available',
]

function HealthRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const normalizedPathname = pathname.replace(/\/+$/, '')

  if (normalizedPathname === '/programs/health') {
    return <HealthProgramPage />
  }

  return <Outlet />
}

function HealthProgramPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-500 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
              <HeartPulse className="h-4 w-4 text-red-300" />
              JAS Health & Medical Support
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Medical help requests with restricted health-admin review
            </h1>

            <p className="max-w-3xl text-lg leading-8 text-white/75">
              Apply for treatment, prescription, hospital estimate, lab report,
              medicine or emergency support through a membership-verified and
              privacy-first medical assistance workflow.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                to="/programs/health/apply"
                className="inline-flex items-center justify-center rounded-xl bg-red-400 px-6 py-3 font-black text-slate-950 no-underline transition hover:bg-red-300"
              >
                Apply for Medical Help
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                to="/programs/health/my-applications"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white no-underline transition hover:bg-white/20"
              >
                My Health Applications
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-600">
              Health Support Features
            </p>

            <h2 className="text-3xl font-black text-slate-950 md:text-5xl">
              Designed for sensitive medical cases
            </h2>

            <p className="text-lg leading-8 text-slate-600">
              This module keeps medical case details restricted. Applicants can
              track status, while full details are limited to authorized health
              committee/admin users.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-8 text-white">
            <LockKeyhole className="mb-5 h-10 w-10 text-red-300" />

            <h2 className="text-3xl font-black">Privacy Rule</h2>

            <p className="mt-4 leading-8 text-white/75">
              Medical data is sensitive. Full patient details, disease summary
              and medical documents must only be visible to the applicant and
              authorized health committee/admin users.
            </p>

            <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-semibold text-white/85">
              Public verification pages must never display medical case data.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-3xl font-black text-slate-950">
              Required Documents
            </h2>

            <div className="mt-6 grid gap-3">
              {requiredDocuments.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-500">
              Upload clear PDF, JPG, PNG or WEBP files up to 8MB. Emergency
              cases should be marked during application submission.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <InfoCard
            icon={<Stethoscope className="h-6 w-6" />}
            title="Treatment Details"
            text="Disease, treatment type, doctor, hospital and estimated cost are recorded for committee review."
          />
          <InfoCard
            icon={<Hospital className="h-6 w-6" />}
            title="Emergency Flag"
            text="Urgent cases can be highlighted in the admin panel for faster medical committee review."
          />
          <InfoCard
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Restricted Access"
            text="Only admin, super admin, health admin or authorized health assignment users can review full cases."
          />
        </div>
      </section>
    </main>
  )
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </article>
  )
}
