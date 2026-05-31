// src/routes/admin/cms.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Edit3,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  currentUserCanManageCms,
  fetchAllCmsPagesForAdmin,
  getCmsStatusClass,
  type CmsPage,
} from '../../lib/cms'

export const Route = createFileRoute('/admin/cms')({
  component: AdminCmsPage,
})

function AdminCmsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pages, setPages] = useState<CmsPage[]>([])
  const [error, setError] = useState('')

  const loadPages = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const allowed = await currentUserCanManageCms()
      if (!allowed) {
        await navigate({ to: '/admin' })
        return
      }

      const data = await fetchAllCmsPagesForAdmin()
      setPages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CMS pages.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadPages()
  }, [loadPages])

  const stats = useMemo(() => {
    return pages.reduce(
      (acc, page) => {
        acc.total += 1
        if (page.status === 'published') acc.published += 1
        if (page.status === 'draft') acc.draft += 1
        if (page.status === 'archived') acc.archived += 1
        return acc
      },
      { total: 0, published: 0, draft: 0, archived: 0 },
    )
  }, [pages])

  if (loading) {
    return (
      <main className="px-3 py-8 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading CMS pages...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Admin CMS
                </p>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Public Website Content
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Update public organization pages like About, Vision & Mission,
                  Manifesto, Constitution, CWC and Contact without editing code.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadPages(true)}
                disabled={refreshing}
                className="secondary-btn pressable w-fit disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Pages" value={stats.total} />
            <Stat label="Published" value={stats.published} />
            <Stat label="Drafts" value={stats.draft} />
            <Stat label="Archived" value={stats.archived} />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="m-0 font-semibold leading-6">
              Only published pages are visible to public visitors. Draft and
              archived content stays hidden from the public site.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <article
                key={page.slug}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${getCmsStatusClass(page.status)}`}>
                    {page.status}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-black text-slate-950">
                  {page.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {page.subtitle || page.content}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/admin/cms/$slug"
                    params={{ slug: page.slug }}
                    className="jas-dark-action-link inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black no-underline transition"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Link>
                  {page.status === 'published' ? (
                    <Link
                      to={`/${page.slug}` as never}
                      className="secondary-btn px-4 py-3 text-sm"
                    >
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {pages.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center ring-1 ring-slate-100">
              <LockKeyhole className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 text-lg font-black text-slate-950">
                No CMS pages found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Run the CMS migration to seed default pages.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}
