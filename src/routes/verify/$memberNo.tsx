import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { verifyMemberAction } from '../../lib/verify/actions'

export const Route = createFileRoute('/verify/$memberNo')({
  component: VerifyMemberPage,
})

type VerifyResult = {
  found: boolean
  verified: boolean
  member: {
    id: string
    member_no: string | null
    full_name: string
    district: string
    taluka: string | null
    status: 'pending' | 'approved' | 'rejected'
    approved_at: string | null
  } | null
  photoSignedUrl: string | null
}

function VerifyMemberPage() {
  const { memberNo } = Route.useParams()

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadVerification()
  }, [memberNo])

  async function loadVerification() {
    setLoading(true)
    setError('')

    try {
      const data = await verifyMemberAction({
        data: {
          memberNo,
        },
      })

      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to verify membership.',
      )
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          Verifying membership...
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-5 sm:space-y-6">
        <header className="rounded-2xl bg-white p-5 text-center shadow-sm sm:p-6">
          <p className="text-sm font-medium text-emerald-700">
            Jatt Alliance Sindh
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Membership Verification
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Public QR verification page for JAS digital membership cards.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!result?.found ? (
          <section className="rounded-2xl bg-white p-5 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              ×
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
              Member Not Found
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              No JAS member record was found for this membership number.
            </p>

            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              {memberNo}
            </p>
          </section>
        ) : result.verified && result.member ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-700">
                ✓
              </div>

              <div>
                <h2 className="text-2xl font-bold text-emerald-700 sm:text-3xl">
                  Verified Member
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  This membership is active and verified by Jatt Alliance Sindh.
                </p>
              </div>

              {result.photoSignedUrl ? (
                <img
                  src={result.photoSignedUrl}
                  alt={result.member.full_name}
                  className="h-36 w-36 rounded-2xl object-cover ring-1 ring-slate-200"
                />
              ) : null}

              <div className="grid w-full max-w-2xl gap-4 rounded-2xl bg-slate-50 p-5 text-left md:grid-cols-2">
                <Info label="Member Name" value={result.member.full_name} />
                <Info label="Member No" value={result.member.member_no ?? 'N/A'} />
                <Info label="District" value={result.member.district} />
                <Info label="Taluka" value={result.member.taluka || 'Not provided'} />
                <Info
                  label="Approved At"
                  value={
                    result.member.approved_at
                      ? new Date(result.member.approved_at).toLocaleDateString()
                      : 'N/A'
                  }
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-5 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-700">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
              Not a Verified Member
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              This record exists, but the membership is not currently approved.
            </p>

            <div className="mx-auto mt-5 max-w-md rounded-xl bg-slate-50 p-4 text-left">
              <Info label="Member No" value={memberNo} />
              <Info
                label="Status"
                value={result.member?.status ?? 'Unknown'}
              />
            </div>
          </section>
        )}

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
          >
            Go to JAS Home
          </Link>
        </div>
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
