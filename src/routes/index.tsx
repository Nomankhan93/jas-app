import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="px-4 py-14">
      <section className="page-wrap">
        <div className="island-shell rise-in rounded-[2rem] p-8 md:p-12">
          <p className="island-kicker">Jatt Alliance Sindh</p>

          <h1 className="display-title mt-4 max-w-4xl text-5xl font-bold leading-tight text-[var(--sea-ink)] md:text-7xl">
            Digital Membership Platform for JAS
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--sea-ink-soft)]">
            Register your profile, submit your membership form, wait for admin
            approval, and receive a digital ID card with QR verification.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-emerald-800"
            >
              Become a Member
            </Link>

            <Link
              to="/login"
              className="rounded-xl border border-[var(--line)] bg-white/70 px-6 py-3 text-sm font-semibold text-[var(--sea-ink)] no-underline hover:bg-white"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Submit Membership Form"
            text="Members create an account and submit CNIC, district, mobile number, profession, caste branch, and photo."
          />

          <FeatureCard
            title="Admin Review"
            text="Admins review pending applications, approve valid members, or reject with a reason."
          />

          <FeatureCard
            title="QR Verification"
            text="Approved members get a digital card with QR code linking to a public verification page."
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-card rounded-2xl border border-[var(--line)] p-6">
      <h2 className="text-xl font-bold text-[var(--sea-ink)]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
        {text}
      </p>
    </div>
  )
}