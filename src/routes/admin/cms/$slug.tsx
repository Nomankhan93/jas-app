// src/routes/admin/cms/$slug.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Save, ShieldAlert } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import {
  currentUserCanManageCms,
  fetchCmsPageForAdmin,
  getCmsConfig,
  saveCmsPage,
  type CmsPageStatus,
} from '../../../lib/cms'

export const Route = createFileRoute('/admin/cms/$slug')({
  component: AdminCmsEditPage,
})

function AdminCmsEditPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const fallback = getCmsConfig(slug as never)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<CmsPageStatus>('draft')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setError('')

      try {
        const allowed = await currentUserCanManageCms()
        if (!allowed) {
          await navigate({ to: '/admin' })
          return
        }

        const page = await fetchCmsPageForAdmin(slug)
        if (cancelled) return

        setTitle(page?.title || fallback.fallbackTitle)
        setSubtitle(page?.subtitle || fallback.fallbackSubtitle)
        setContent(page?.content || fallback.fallbackContent)
        setStatus((page?.status as CmsPageStatus) || 'draft')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load CMS page.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPage()

    return () => {
      cancelled = true
    }
  }, [fallback.fallbackContent, fallback.fallbackSubtitle, fallback.fallbackTitle, navigate, slug])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!title.trim()) throw new Error('Title is required.')
      if (!content.trim()) throw new Error('Content is required.')

      await saveCmsPage({
        slug,
        title,
        subtitle,
        content,
        status,
      })

      setMessage('CMS page saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save CMS page.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="px-3 py-8 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading CMS editor...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-8 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <div>
          <Link to="/admin/cms" className="secondary-btn w-fit px-4 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to CMS
          </Link>
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            CMS Editor
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Edit: {slug}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Use clear public-friendly text. Published content is visible on the
            public website immediately.
          </p>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-800">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-800">Subtitle</span>
              <input
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-800">Content</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={16}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium leading-7 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <span className="text-xs font-semibold text-slate-500">
                Use blank lines for paragraphs. Use lines starting with “- ” for bullet lists.
              </span>
            </label>

            <label className="grid gap-2 sm:max-w-xs">
              <span className="text-sm font-black text-slate-800">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as CmsPageStatus)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="primary-btn pressable disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Page'}
            </button>
            <Link to={`/${slug}` as never} className="secondary-btn">
              Preview Public Page
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
