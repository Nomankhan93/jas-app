import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Account created successfully. You can now log in.')
    setTimeout(() => {
      navigate({ to: '/login' })
    }, 1200)
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create JAS Account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Register as a member of Jutt Alliance Sindh.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
              placeholder="Enter your full name"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600 sm:text-sm"
              placeholder="Minimum 6 characters"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700">
            Login
          </Link>
        </p>
      </div>
    </main>
  )
}
