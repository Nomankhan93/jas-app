import {
  Outlet,
  createFileRoute,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/programs/education")({
  component: EducationRoute,
});

const features = [
  {
    title: "Scholarship & Fee Support",
    description:
      "Students can apply for admission fee, monthly fee, exam fee, books, uniform, hostel or full scholarship support.",
    icon: GraduationCap,
  },
  {
    title: "Skills Development Programs",
    description:
      "Youth can register for computer, freelancing, digital skills, language, technical and career-focused training programs.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Merit & Need-Based Review",
    description:
      "Applications will be reviewed by education admins using documents, academic record, district/taluka and financial need.",
    icon: Award,
  },
];

const requiredDocuments = [
  "Student CNIC / B-form",
  "Guardian CNIC",
  "Latest marksheet",
  "Admission proof",
  "Fee challan",
  "Institute card or enrollment proof",
];

function EducationRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const normalizedPathname = pathname.replace(/\/+$/, "");

  if (normalizedPathname === "/programs/education") {
    return <EducationProgramPage />;
  }

  return <Outlet />;
}

function EducationProgramPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white md:py-24">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
              <BookOpenCheck className="h-4 w-4 text-amber-300" />
              JAS Education & Skills Development
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Education support, scholarships and skills training for JAS members
            </h1>

            <p className="max-w-3xl text-lg leading-8 text-white/75">
              Apply for scholarship, fee support, admission guidance, career
              counselling and skills development programs through a transparent
              membership-verified system.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                to="/programs/education/apply"
                className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950 no-underline transition hover:bg-amber-300"
              >
                Apply for Education Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                to="/programs/education/my-applications"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white no-underline transition hover:bg-white/20"
              >
                My Applications
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-600">
              Program Features
            </p>

            <h2 className="text-3xl font-black text-slate-950 md:text-5xl">
              What this module will support
            </h2>

            <p className="text-lg leading-8 text-slate-600">
              This portal is connected with membership verification. Applicant
              must provide an approved JAS membership number.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-8 text-white">
            <ShieldCheck className="mb-5 h-10 w-10 text-amber-300" />

            <h2 className="text-3xl font-black">Eligibility Rule</h2>

            <p className="mt-4 leading-8 text-white/75">
              Only approved JAS members, or students linked with an approved JAS
              member as son, daughter, brother, sister, guardian or family
              dependent, can submit applications.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white/85">
              Application form will verify the membership number before
              submission.
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
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-500">
              Documents upload is available in the application form. Please upload clear PDF, JPG, PNG or WEBP files up to 5MB for faster verification.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}