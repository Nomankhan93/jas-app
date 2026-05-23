import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
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
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function resetAlerts() {
    setError('')
    setMessage('')
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
    <main className="min-h-[100dvh] bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Login to JAS</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access your membership dashboard.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod('email')
              setPhoneStep('phone')
              resetAlerts()
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              method === 'email'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('phone')
              setPhoneStep('phone')
              resetAlerts()
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              method === 'phone'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mobile OTP
          </button>
        </div>

        {method === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
                placeholder="Your password"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : null}

        {method === 'phone' && phoneStep === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mobile Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
                placeholder="03341013222"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter 03XXXXXXXXX. App will convert it to 923XXXXXXXXX.
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : null}

        {method === 'phone' && phoneStep === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                required
                minLength={6}
                maxLength={6}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
                placeholder="123456"
              />
              <p className="mt-1 text-xs text-slate-500">
                OTP sent to {phone}
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="h-11 w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtp('')
                setPhoneStep('phone')
                resetAlerts()
              }}
              className="h-11 w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Change Number
            </button>
          </form>
        ) : null}

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-emerald-700">
            Create account
          </Link>
        </p>
      </div>
    </main>
  )
}