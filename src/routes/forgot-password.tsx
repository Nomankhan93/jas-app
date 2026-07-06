// src/routes/forgot-password.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { t, direction } = useI18n()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function resetAlerts() {
    setError('')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError(t('forgot.error.invalidEmail'))
      return
    }

    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: getPasswordResetRedirectUrl(),
      },
    )

    setLoading(false)

    if (resetError) {
      setError(toFriendlyResetError(resetError.message))
      return
    }

    setMessage(t('forgot.message.sent'))
  }

  return (
    <main className="page-main">
      <div className="page-wrap page-stack" dir={direction}>
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <aside className="home-hero animate-fade-up">
            <div className="home-hero-inner !grid-cols-1">
              <div className="home-hero-copy">
                <div className="home-hero-badge animate-fade-up">
                  <span className="brand-dot" />
                  <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
                    {t('forgot.hero.badge')}
                  </span>
                </div>

                <p className="home-hero-kicker animate-fade-up delay-1">
                  {t('forgot.hero.kicker')}
                </p>

                <h1 className="home-hero-title text-balance animate-fade-up delay-2">
                  {t('forgot.hero.title')}
                  <br />
                  <span className="home-hero-accent">{t('forgot.hero.accent')}</span>
                </h1>

                <div className="home-hero-rule ajrak-rule animate-fade-in delay-2" />

                <p className="home-hero-text text-pretty animate-fade-up delay-3">
                  {t('forgot.hero.description')}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <FeaturePill
                    icon={<Mail size={16} />}
                    title={t('forgot.feature.email.title')}
                    text={t('forgot.feature.email.text')}
                    delay="delay-2"
                  />
                  <FeaturePill
                    icon={<ShieldCheck size={16} />}
                    title={t('forgot.feature.secure.title')}
                    text={t('forgot.feature.secure.text')}
                    delay="delay-3"
                  />
                </div>
              </div>
            </div>
          </aside>

          <section className="soft-panel animate-scale-in rounded-[2rem] border-[#e8e0d1] bg-white p-5 shadow-[0_24px_70px_rgba(20,18,16,0.08)] sm:p-7">
            <div className="mb-6">
              <div className="badge-soft bg-[var(--gold-pale)] text-[var(--gold)]">
                <Sparkles size={14} />
                {t('forgot.form.badge')}
              </div>

              <h2 className="section-title mt-4">{t('forgot.form.title')}</h2>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                {t('forgot.form.description')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label={t('authPage.common.email')} htmlFor="reset-email">
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    resetAlerts()
                  }}
                  required
                  className="input-clean"
                  placeholder={t('forgot.email.placeholder')}
                />
              </FormField>

              <AlertBlock error={error} message={message} />

              <button
                type="submit"
                disabled={loading}
                className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {loading ? t('forgot.submit.loading') : t('forgot.submit.cta')}
              </button>
            </form>

            <div className="mt-6 rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-7 text-stone-600">
              {t('forgot.form.emailOnlyNote')}
            </div>

            <p className="mt-6 text-center text-sm text-stone-600">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 font-bold text-[var(--forest)]">
                <ArrowLeft size={15} />
                {t('forgot.backToLogin')}
              </Link>
            </p>
          </section>
        </section>
      </div>
    </main>
  )
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-stone-700"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function AlertBlock({
  error,
  message,
}: {
  error: string
  message: string
}) {
  return (
    <>
      {error ? (
        <div
          className="flex items-start gap-2 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {message ? (
        <div
          className="flex items-start gap-2 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}
    </>
  )
}

function FeaturePill({
  icon,
  title,
  text,
  delay,
}: {
  icon: ReactNode
  title: string
  text: string
  delay: string
}) {
  return (
    <div
      className={`soft-panel animate-fade-up ${delay} rounded-[1.25rem] border-white/70 bg-white/72 px-4 py-4 shadow-sm backdrop-blur`}
    >
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-pale)] text-[var(--forest)]">
        {icon}
      </div>
      <p className="text-sm font-bold text-stone-900">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{text}</p>
    </div>
  )
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getPasswordResetRedirectUrl() {
  const configuredBase = (
    import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || ''
  )
    .trim()
    .replace(/\/+$/, '')

  const browserBase = typeof window !== 'undefined' ? window.location.origin : ''
  const baseUrl = configuredBase || browserBase

  return `${baseUrl}/reset-password`
}

function toFriendlyResetError(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many reset requests. Please wait a few minutes and try again.'
  }

  return message
}
