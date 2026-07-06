// src/routes/reset-password.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t, direction } = useI18n()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let retryTimer: number | undefined

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (session) {
        setHasRecoverySession(true)
        setCheckingSession(false)
        setError('')
        return
      }

      if (hasRecoveryUrlParams()) {
        retryTimer = window.setTimeout(async () => {
          const {
            data: { session: delayedSession },
          } = await supabase.auth.getSession()

          if (cancelled) return

          setHasRecoverySession(Boolean(delayedSession))
          setCheckingSession(false)
          setError(delayedSession ? '' : t('reset.error.linkInvalid'))
        }, 1200)
        return
      }

      setHasRecoverySession(false)
      setCheckingSession(false)
      setError(t('reset.error.linkInvalid'))
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return

        if (event === 'PASSWORD_RECOVERY' || session) {
          setHasRecoverySession(true)
          setCheckingSession(false)
          setError('')
        }
      },
    )

    void checkRecoverySession()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      authListener.subscription.unsubscribe()
    }
  }, [t])

  function resetAlerts() {
    setError('')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    if (!hasRecoverySession) {
      setError(t('reset.error.linkInvalid'))
      return
    }

    if (password.length < 6) {
      setError(t('reset.error.passwordShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('reset.error.passwordMismatch'))
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPassword('')
    setConfirmPassword('')
    setMessage(t('reset.message.updated'))

    window.setTimeout(() => {
      void (async () => {
        await supabase.auth.signOut()
        await navigate({ to: '/login', replace: true })
      })()
    }, 1500)
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
                    {t('reset.hero.badge')}
                  </span>
                </div>

                <p className="home-hero-kicker animate-fade-up delay-1">
                  {t('reset.hero.kicker')}
                </p>

                <h1 className="home-hero-title text-balance animate-fade-up delay-2">
                  {t('reset.hero.title')}
                  <br />
                  <span className="home-hero-accent">{t('reset.hero.accent')}</span>
                </h1>

                <div className="home-hero-rule ajrak-rule animate-fade-in delay-2" />

                <p className="home-hero-text text-pretty animate-fade-up delay-3">
                  {t('reset.hero.description')}
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur animate-fade-up delay-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-pale)] text-[var(--forest)]">
                    <ShieldCheck size={16} />
                  </div>
                  <p className="text-sm font-bold text-stone-900">{t('reset.security.title')}</p>
                  <p className="mt-1 text-sm leading-7 text-stone-600">{t('reset.security.text')}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="soft-panel animate-scale-in rounded-[2rem] border-[#e8e0d1] bg-white p-5 shadow-[0_24px_70px_rgba(20,18,16,0.08)] sm:p-7">
            <div className="mb-6">
              <div className="badge-soft bg-[var(--gold-pale)] text-[var(--gold)]">
                <Sparkles size={14} />
                {t('reset.form.badge')}
              </div>

              <h2 className="section-title mt-4">{t('reset.form.title')}</h2>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                {t('reset.form.description')}
              </p>
            </div>

            {checkingSession ? (
              <div className="flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 text-sm font-bold text-stone-700">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                {t('reset.checking')}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label={t('reset.newPassword.label')} htmlFor="new-password">
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(value) => {
                      setPassword(value)
                      resetAlerts()
                    }}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((value) => !value)}
                    placeholder={t('reset.newPassword.placeholder')}
                    showLabel={t('authPage.common.showPassword')}
                    hideLabel={t('authPage.common.hidePassword')}
                  />
                </FormField>

                <FormField label={t('authPage.common.confirmPassword')} htmlFor="confirm-new-password">
                  <PasswordInput
                    id="confirm-new-password"
                    value={confirmPassword}
                    onChange={(value) => {
                      setConfirmPassword(value)
                      resetAlerts()
                    }}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((value) => !value)}
                    placeholder={t('reset.confirmPassword.placeholder')}
                    showLabel={t('authPage.common.showPassword')}
                    hideLabel={t('authPage.common.hidePassword')}
                  />
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading || !hasRecoverySession}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {loading ? t('reset.submit.loading') : t('reset.submit.cta')}
                </button>
              </form>
            )}

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

function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  placeholder,
  showLabel,
  hideLabel,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  showPassword: boolean
  onTogglePassword: () => void
  placeholder: string
  showLabel: string
  hideLabel: string
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="input-clean pr-12"
        placeholder={placeholder}
      />

      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        aria-label={showPassword ? hideLabel : showLabel}
      >
        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
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

function hasRecoveryUrlParams() {
  if (typeof window === 'undefined') return false

  const url = new URL(window.location.href)
  const hash = window.location.hash.toLowerCase()

  return (
    url.searchParams.has('code') ||
    url.searchParams.get('type') === 'recovery' ||
    hash.includes('type=recovery') ||
    hash.includes('access_token=')
  )
}
