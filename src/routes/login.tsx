// src/routes/login.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
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

function normalizePakistanPhone(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('0092')) return digits.slice(2)
  if (digits.startsWith('92')) return digits
  if (digits.startsWith('0')) return `92${digits.slice(1)}`

  return digits
}

function isValidPakistanMobile(value: string) {
  return /^923\d{9}$/.test(value)
}

function LoginPage() {
  const navigate = useNavigate()

  const [method, setMethod] = useState<LoginMethod>('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
    setLoading(true)
    resetAlerts()

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate({ to: '/dashboard' })
  }

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    resetAlerts()

    const phoneNumber = normalizePakistanPhone(phone)

    if (!isValidPakistanMobile(phoneNumber)) {
      setLoading(false)
      setError('Please enter a valid Pakistan mobile number, for example 03341013222.')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
        shouldCreateUser: false,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setPhone(phoneNumber)
    setPhoneStep('otp')
    setMessage('OTP sent successfully. Please check your mobile phone.')
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    resetAlerts()

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: 'sms',
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate({ to: '/dashboard' })
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
                  Welcome back to your
                  <br />
                  <span className="home-hero-accent">member dashboard</span>
                </h1>

                <div className="home-hero-rule ajrak-rule animate-fade-in delay-2" />

                <p className="home-hero-text text-pretty animate-fade-up delay-3">
                  Login with email or mobile OTP to access your membership profile, application
                  status, and digital member card.
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
                    Create your account to start your JAS membership journey and receive your
                    verified digital member access.
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

              <h2 className="section-title mt-4">Login to JAS</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Access your membership dashboard using your preferred login method.
              </p>
            </div>

            <div className="mb-6 rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => switchMethod('email')}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                    method === 'email'
                      ? 'bg-white text-[var(--forest)] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => switchMethod('phone')}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                    method === 'phone'
                      ? 'bg-white text-[var(--forest)] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Mobile OTP
                </button>
              </div>
            </div>

            {method === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <FormField label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="input-clean"
                    placeholder="you@example.com"
                  />
                </FormField>

                <FormField label="Password">
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="input-clean"
                    placeholder="Your password"
                  />
                </FormField>

                <AlertBlock error={error} message={message} />

                <button type="submit" disabled={loading} className="primary-btn pressable w-full">
                  <KeyRound size={16} />
                  {loading ? 'Logging in...' : 'Login'}
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

                <FormField label="Mobile Number">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    className="input-clean"
                    placeholder="03341013222"
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Enter 03XXXXXXXXX. App will convert it to 923XXXXXXXXX.
                  </p>
                </FormField>

                <AlertBlock error={error} message={message} />

                <button type="submit" disabled={loading} className="primary-btn pressable w-full">
                  <Smartphone size={16} />
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
                    Enter the 6-digit OTP sent to {phone}.
                  </p>
                </div>

                <FormField label="Enter OTP">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    required
                    minLength={6}
                    maxLength={6}
                    className="input-clean"
                    placeholder="123456"
                  />
                </FormField>

                <AlertBlock error={error} message={message} />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="primary-btn pressable w-full"
                >
                  <ShieldCheck size={16} />
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtp('')
                    setPhoneStep('phone')
                    resetAlerts()
                  }}
                  className="secondary-btn pressable w-full"
                >
                  Change Number
                </button>
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

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
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
        <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
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
  icon: React.ReactNode
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