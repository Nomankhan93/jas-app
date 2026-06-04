// src/routes/signup.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useI18n, type TranslationKey } from '../lib/i18n'
import { supabase } from '../lib/supabase/client'
import {
  MEMBERSHIP_BASE_FEE,
  formatMembershipMoney,
} from '../lib/membership-fee'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

type SignupMethod = 'email' | 'phone'
type PhoneStep = 'phone' | 'otp'

function SignupPage() {
  const navigate = useNavigate()
  const { t, direction } = useI18n()

  const [method, setMethod] = useState<SignupMethod>('email')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone')

  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (user) {
        await navigate({ to: '/dashboard', replace: true })
        return
      }

      setCheckingSession(false)
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [navigate])

  function resetAlerts() {
    setError('')
    setMessage('')
  }

  function switchMethod(nextMethod: SignupMethod) {
    setMethod(nextMethod)
    setPhoneStep('phone')
    setOtp('')
    resetAlerts()
  }

  function validateFullName() {
    const name = fullName.trim()

    if (!name) {
      setError(t('signup.error.fullNameRequired'))
      return null
    }

    if (name.length < 3) {
      setError(t('signup.error.fullNameShort'))
      return null
    }

    return name
  }

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    const name = validateFullName()
    if (!name) return

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError(t('signup.error.invalidEmail'))
      return
    }

    if (password.length < 6) {
      setError(t('signup.error.passwordShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('signup.error.passwordMismatch'))
      return
    }

    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    setLoading(false)

    if (signupError) {
      setError(toFriendlyAuthError(signupError.message, t))
      return
    }

    if (data.session) {
      await navigate({ to: '/dashboard', replace: true })
      return
    }

    setMessage(
      t('signup.message.created'),
    )

    window.setTimeout(() => {
      void navigate({ to: '/login', replace: true })
    }, 1200)
  }

  async function sendSignupOtp(phoneInput: string) {
    const name = validateFullName()

    if (!name) {
      throw new Error(t('signup.error.fullNameRequired'))
    }

    const phoneNumber = normalizePakistanPhone(phoneInput)

    if (!isValidPakistanMobile(phoneNumber)) {
      throw new Error(
        t('signup.error.invalidPhone'),
      )
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
        data: {
          full_name: name,
        },
      },
    })

    if (otpError) {
      throw new Error(toFriendlyAuthError(otpError.message, t))
    }

    return phoneNumber
  }

  async function handleSendSignupOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()
    setLoading(true)

    try {
      const phoneNumber = await sendSignupOtp(phone)
      setPhone(phoneNumber)
      setPhoneStep('otp')
      setMessage(
        t('login.message.otpSent').replace('{phone}', formatPakistanPhoneForDisplay(phoneNumber)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.error.sendOtpFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    resetAlerts()
    setLoading(true)

    try {
      const phoneNumber = await sendSignupOtp(phone)
      setPhone(phoneNumber)
      setMessage(
        t('login.message.otpResent').replace('{phone}', formatPakistanPhoneForDisplay(phoneNumber)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.error.resendOtpFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifySignupOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    const cleanOtp = otp.replace(/\D/g, '')

    if (cleanOtp.length !== 6) {
      setError(t('signup.error.otpLength'))
      return
    }

    setLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizePakistanPhone(phone),
      token: cleanOtp,
      type: 'sms',
    })

    setLoading(false)

    if (verifyError) {
      setError(toFriendlyAuthError(verifyError.message, t))
      return
    }

    await navigate({ to: '/dashboard', replace: true })
  }

  if (checkingSession) {
    return (
      <main className="page-main">
        <div className="page-wrap">
          <div className="rounded-[2rem] border border-[#e8e0d1] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-bold text-stone-700">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
              {t('authPage.common.checkingSession')}
            </div>
          </div>
        </div>
      </main>
    )
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
                    {t('signup.hero.badge')}
                  </span>
                </div>

                <p className="home-hero-kicker animate-fade-up delay-1">
                  {t('signup.hero.kicker')}
                </p>

                <h1 className="home-hero-title text-balance animate-fade-up delay-2">
                  {t('signup.hero.title')}
                  <br />
                  <span className="home-hero-accent">{t('signup.hero.accent')}</span>
                </h1>

                <div className="home-hero-rule ajrak-rule animate-fade-in delay-2" />

                <p className="home-hero-text text-pretty animate-fade-up delay-3">
                  {t('signup.hero.description')}
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 shadow-sm animate-fade-up delay-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-700">
                    {t('signup.fee.label')}
                  </p>
                  <p className="mt-2 text-lg font-black text-stone-950">
                    {formatMembershipMoney(MEMBERSHIP_BASE_FEE)} + {t('signup.fee.processingCharges')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {t('signup.fee.subtext')}
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <FeaturePill
                    icon={<UserRound size={16} />}
                    title={t('signup.feature.profile.title')}
                    text={t('signup.feature.profile.text')}
                    delay="delay-2"
                  />
                  <FeaturePill
                    icon={<Smartphone size={16} />}
                    title={t('signup.feature.otp.title')}
                    text={t('signup.feature.otp.text')}
                    delay="delay-3"
                  />
                  <FeaturePill
                    icon={<CheckCircle2 size={16} />}
                    title={t('signup.feature.ready.title')}
                    text={t('signup.feature.ready.text')}
                    delay="delay-4"
                  />
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur animate-fade-up delay-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-stone-500">
                    {t('signup.already.label')}
                  </p>

                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {t('signup.already.text')}
                  </p>

                  <div className="mt-4">
                    <Link to="/login" className="secondary-btn pressable lift-hover">
                      {t('signup.already.cta')}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="soft-panel animate-scale-in rounded-[2rem] border-[#e8e0d1] bg-white p-5 shadow-[0_24px_70px_rgba(20,18,16,0.08)] sm:p-7">
            <div className="mb-6">
              <div className="badge-soft bg-[var(--gold-pale)] text-[var(--gold)]">
                <Sparkles size={14} />
                {t('signup.form.badge')}
              </div>

              <h2 className="section-title mt-4">{t('signup.form.title')}</h2>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                {t('signup.form.description')}
              </p>
            </div>

            <div className="mb-6 rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-1">
              <div className="grid grid-cols-2 gap-1">
                <MethodTab
                  active={method === 'email'}
                  onClick={() => switchMethod('email')}
                  icon={<Mail size={15} />}
                >
                  {t('authPage.common.emailMethod')}
                </MethodTab>

                <MethodTab
                  active={method === 'phone'}
                  onClick={() => switchMethod('phone')}
                  icon={<Smartphone size={15} />}
                >
                  {t('authPage.common.mobileOtp')}
                </MethodTab>
              </div>
            </div>

            {method === 'email' ? (
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <FormField label={t('authPage.common.fullName')} htmlFor="fullName">
                  <input
                    id="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value)
                      resetAlerts()
                    }}
                    required
                    className="input-clean"
                    placeholder={t('signup.fullName.placeholder')}
                  />
                </FormField>

                <FormField label={t('authPage.common.email')} htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      resetAlerts()
                    }}
                    required
                    className="input-clean"
                    placeholder={t('login.email.placeholder')}
                  />
                </FormField>

                <FormField label={t('authPage.common.password')} htmlFor="password">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        resetAlerts()
                      }}
                      required
                      minLength={6}
                      className="input-clean pr-12"
                      placeholder={t('signup.password.placeholder')}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                      aria-label={showPassword ? t('authPage.common.hidePassword') : t('authPage.common.showPassword')}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </FormField>

                <FormField label={t('authPage.common.confirmPassword')} htmlFor="confirmPassword">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      resetAlerts()
                    }}
                    required
                    minLength={6}
                    className="input-clean"
                    placeholder={t('signup.confirmPassword.placeholder')}
                  />
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  {loading ? t('signup.submit.loading') : t('signup.submit.cta')}
                </button>
              </form>
            ) : null}

            {method === 'phone' && phoneStep === 'phone' ? (
              <form onSubmit={handleSendSignupOtp} className="space-y-4">
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-stone-500">
                    {t('authPage.common.step1')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {t('signup.phone.step1Text')}
                  </p>
                </div>

                <FormField label={t('authPage.common.fullName')} htmlFor="phoneFullName">
                  <input
                    id="phoneFullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value)
                      resetAlerts()
                    }}
                    required
                    className="input-clean"
                    placeholder={t('signup.fullName.placeholder')}
                  />
                </FormField>

                <FormField label={t('authPage.common.mobileNumber')} htmlFor="phone">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value)
                      resetAlerts()
                    }}
                    required
                    className="input-clean"
                    placeholder="03333300393"
                  />
                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    {t('authPage.common.phoneHint')}
                  </p>
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Smartphone size={16} />
                  )}
                  {loading ? t('authPage.common.sendingOtp') : t('authPage.common.sendOtp')}
                </button>
              </form>
            ) : null}

            {method === 'phone' && phoneStep === 'otp' ? (
              <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                    {t('authPage.common.step2')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {t('signup.otp.step2Text').replace('{phone}', formatPakistanPhoneForDisplay(phone))}
                  </p>
                </div>

                <FormField label={t('authPage.common.enterOtp')} htmlFor="otp">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                      resetAlerts()
                    }}
                    required
                    minLength={6}
                    maxLength={6}
                    className="input-clean text-center text-xl tracking-[0.35em]"
                    placeholder="123456"
                  />
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {loading ? t('authPage.common.verifying') : t('signup.otp.verifyCta')}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="secondary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    {t('authPage.common.resendOtp')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtp('')
                      setPhoneStep('phone')
                      resetAlerts()
                    }}
                    disabled={loading}
                    className="secondary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('authPage.common.changeNumber')}
                  </button>
                </div>
              </form>
            ) : null}

            <p className="mt-6 text-center text-sm text-stone-600">
              {t('signup.haveAccount')}{' '}
              <Link to="/login" className="font-bold text-[var(--forest)]">
                {t('signup.loginLink')}
              </Link>
            </p>
          </section>
        </section>
      </div>
    </main>
  )
}

function MethodTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
        active
          ? 'bg-white text-[var(--forest)] shadow-sm'
          : 'text-stone-600 hover:text-stone-900'
      }`}
      aria-pressed={active}
    >
      {icon}
      {children}
    </button>
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

function normalizePakistanPhone(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('0092')) return `92${digits.slice(4, 14)}`
  if (digits.startsWith('92')) return digits.slice(0, 12)
  if (digits.startsWith('0')) return `92${digits.slice(1, 11)}`
  if (digits.startsWith('3')) return `92${digits.slice(0, 10)}`

  return digits
}

function isValidPakistanMobile(value: string) {
  return /^923\d{9}$/.test(value)
}

function formatPakistanPhoneForDisplay(value: string) {
  const phone = normalizePakistanPhone(value)

  if (/^923\d{9}$/.test(phone)) {
    return `0${phone.slice(2)}`
  }

  return value
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function toFriendlyAuthError(message: string, t: (key: TranslationKey) => string) {
  const lower = message.toLowerCase()

  if (lower.includes('user already registered')) {
    return t('signup.auth.alreadyRegistered')
  }

  if (lower.includes('already registered')) {
    return t('signup.auth.accountExists')
  }

  if (lower.includes('password')) {
    return t('signup.auth.passwordInvalid')
  }

  if (lower.includes('otp')) {
    return t('signup.auth.invalidOtp')
  }

  if (lower.includes('phone')) {
    return t('signup.auth.phoneFailed')
  }

  if (lower.includes('email')) {
    return t('signup.auth.emailFailed')
  }

  return message
}