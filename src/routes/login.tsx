import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

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
