// src/routes/notifications.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  formatNotificationDate,
  getNotificationCategoryLabel,
  getNotificationTone,
  type UserNotification,
} from '../lib/notifications'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

type NotificationClient = {
  from: (table: 'notifications') => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{ data: UserNotification[] | null; error: Error | null }>
      }
    }
    update: (values: Partial<UserNotification>) => {
      eq: (column: string, value: string | boolean) => {
        eq: (
          column: string,
          value: string | boolean,
        ) => Promise<{ error: Error | null }>
      }
    }
  }
}

function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void loadNotifications()
  }, [])

  async function loadNotifications(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false
    if (silent) setRefreshing(true)
    else setLoading(true)

    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await navigate({ to: '/login', replace: true })
      return
    }

    const client = supabase as unknown as NotificationClient
    const { data, error } = await client
      .from('notifications')
      .select(
        'id, user_id, title, message, category, related_type, related_id, action_url, is_read, read_at, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setItems([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    setItems(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  async function markAllRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const client = supabase as unknown as NotificationClient
    const { error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      setMessage(error.message)
      return
    }

    setItems((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at || new Date().toISOString(),
      })),
    )
  }

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items],
  )

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="page-wrap rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading notifications...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 md:py-10">
      <div className="page-wrap space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-amber-200">
                  <Bell className="h-4 w-4" />
                  In-app Updates
                </div>
                <h1 className="mt-5 text-4xl font-black md:text-6xl">
                  Notifications
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/70">
                  Program status, donation verification aur important member
                  updates yahan show honge.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => void loadNotifications({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
            <StatCard title="Total Updates" value={items.length} />
            <StatCard title="Unread" value={unreadCount} />
            <StatCard title="Read" value={items.length - unreadCount} />
          </div>
        </section>

        {message ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <span>{message}</span>
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          {items.length ? (
            <div className="grid gap-4">
              {items.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                No notifications yet
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
                Jab admin aapki application, case ya donation status update karega
                to notification yahan show hogi.
              </p>
              <Link to="/dashboard" className="secondary-btn mt-6">
                Back to Dashboard
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function NotificationCard({ item }: { item: UserNotification }) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        item.is_read ? 'bg-white opacity-80' : 'bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${getNotificationTone(
                item.category,
              )}`}
            >
              {getNotificationCategoryLabel(item.category)}
            </span>
            {!item.is_read ? (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                New
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            {item.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
            {item.message}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {formatNotificationDate(item.created_at)}
          </p>
        </div>

        {item.action_url ? (
          <a
            href={item.action_url}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white no-underline transition hover:bg-emerald-900"
          >
            Open
          </a>
        ) : null}
      </div>
    </article>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  )
}
