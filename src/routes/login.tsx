// src/routes/login.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type LoginMethod = 'email' | 'phone'
type PhoneStep = 'phone' | 'otp'

function LoginPage() {
  const navigate = useNavigate()

  const [method, setMethod] = useState<LoginMethod>('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  function switchMethod(nextMethod: LoginMethod) {
    setMethod(nextMethod)
    setPhoneStep('phone')
    setOtp('')
    resetAlerts()
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    setLoading(false)

    if (loginError) {
      setError(toFriendlyAuthError(loginError.message))
      return
    }

    await navigate({ to: '/dashboard', replace: true })
  }

  async function sendOtp(phoneInput: string) {
    const phoneNumber = normalizePakistanPhone(phoneInput)

    if (!isValidPakistanMobile(phoneNumber)) {
      throw new Error(
        'Please enter a valid Pakistan mobile number, for example 03341013222.',
      )
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      throw new Error(toFriendlyAuthError(otpError.message))
    }

    return phoneNumber
  }

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()
    setLoading(true)

    try {
      const phoneNumber = await sendOtp(phone)
      setPhone(phoneNumber)
      setPhoneStep('otp')
      setMessage(
        `OTP sent successfully to ${formatPakistanPhoneForDisplay(phoneNumber)}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    resetAlerts()
    setLoading(true)

    try {
      const phoneNumber = await sendOtp(phone)
      setPhone(phoneNumber)
      setMessage(
        `A new OTP was sent to ${formatPakistanPhoneForDisplay(phoneNumber)}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetAlerts()

    const cleanOtp = otp.replace(/\D/g, '')

    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.')
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
      setError(toFriendlyAuthError(verifyError.message))
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
              Checking session...
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-main">
      <div className="page-wrap page-stack">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <aside className="home-hero animate-fade-up">
            <div className="home-hero-inner !grid-cols-1">
              <div className="home-hero-copy">
                <div className="home-hero-badge animate-fade-up">
                  <span className="brand-dot" />
                  <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
                    Secure Member Access
                  </span>
                </div>

                <p className="home-hero-kicker animate-fade-up delay-1">
                  Jatt Alliance Sindh · Member Portal
                </p>

                <h1 className="home-hero-title text-balance animate-fade-up delay-2">
                  Member Login
                  <br />
                  <span className="home-hero-accent">Portal Access</span>
                </h1>

                <div className="home-hero-rule ajrak-rule animate-fade-in delay-2" />

                <p className="home-hero-text text-pretty animate-fade-up delay-3">
                  Access your membership status, submitted profile, and digital
                  member card after admin approval.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <FeaturePill
                    icon={<ShieldCheck size={16} />}
                    title="Protected access"
                    text="Secure sign in"
                    delay="delay-2"
                  />
                  <FeaturePill
                    icon={<Smartphone size={16} />}
                    title="OTP login"
                    text="Mobile friendly"
                    delay="delay-3"
                  />
                  <FeaturePill
                    icon={<CheckCircle2 size={16} />}
                    title="Member tools"
                    text="Dashboard ready"
                    delay="delay-4"
                  />
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur animate-fade-up delay-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-stone-500">
                    Need an account?
                  </p>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    Create your account to start your JAS membership journey and
                    receive your verified digital member access.
                  </p>

                  <div className="mt-4">
                    <Link to="/signup" className="secondary-btn pressable lift-hover">
                      Create account
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
                Sign in
              </div>

              <h2 className="section-title mt-4">Member Login</h2>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                Access your membership dashboard using your preferred login
                method.
              </p>
            </div>

            <div className="mb-6 rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-1">
              <div className="grid grid-cols-2 gap-1">
                <MethodTab
                  active={method === 'email'}
                  onClick={() => switchMethod('email')}
                  icon={<Mail size={15} />}
                >
                  Email
                </MethodTab>

                <MethodTab
                  active={method === 'phone'}
                  onClick={() => switchMethod('phone')}
                  icon={<Smartphone size={15} />}
                >
                  Mobile OTP
                </MethodTab>
              </div>
            </div>

            {method === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <FormField label="Email" htmlFor="email">
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
                    placeholder="you@example.com"
                  />
                </FormField>

                <FormField label="Password" htmlFor="password">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        resetAlerts()
                      }}
                      required
                      className="input-clean pr-12"
                      placeholder="Your password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {loading ? 'Logging in...' : 'Access Portal'}
                </button>
              </form>
            ) : null}

            {method === 'phone' && phoneStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-stone-500">
                    Step 1
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    Enter your mobile number to receive an OTP.
                  </p>
                </div>

                <FormField label="Mobile Number" htmlFor="phone">
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
                    placeholder="03341013222"
                  />
                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    Enter 03XXXXXXXXX. The app will convert it to
                    923XXXXXXXXX for Supabase OTP.
                  </p>
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : null}

            {method === 'phone' && phoneStep === 'otp' ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                    Step 2
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    Enter the 6-digit OTP sent to{' '}
                    {formatPakistanPhoneForDisplay(phone)}.
                  </p>
                </div>

                <FormField label="Enter OTP" htmlFor="otp">
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
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="secondary-btn pressable w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    Resend OTP
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
                    Change Number
                  </button>
                </div>
              </form>
            ) : null}

            <p className="mt-6 text-center text-sm text-stone-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-bold text-[var(--forest)]">
                Create account
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

function toFriendlyAuthError(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your details and try again.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before logging in.'
  }

  if (lower.includes('otp')) {
    return 'Invalid or expired OTP. Please request a new code and try again.'
  }

  if (lower.includes('phone')) {
    return 'Phone login failed. Please check your mobile number and try again.'
  }

  return message
}