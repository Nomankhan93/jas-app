// @ts-nocheck
// Supabase Edge Function: send-web-push
//
// Security model:
//   1) A logged-in user may send only an existing notification_id that belongs
//      to their own user_id. This is useful for reliable delivery/retry of their
//      in-app notifications to their own registered devices.
//   2) Admin users may send an existing notification_id to any user.
//   3) Direct user_id/title/body payloads are restricted to admins or internal
//      server calls using X-Push-Secret.
//
// Required secrets:
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Optional secrets:
//   PUSH_SEND_SECRET       Internal server/cron secret for trusted calls.
//   APP_ORIGIN             Comma-separated allowed browser origins.
//   SITE_URL               Fallback allowed origin.
//   PUBLIC_SITE_URL        Fallback allowed origin.
//
// Recommended payload for browser calls:
// {
//   "notification_id": "uuid"
// }
//
// Admin/internal payload:
// {
//   "user_id": "uuid",
//   "title": "JAS Update",
//   "body": "Your membership has been approved.",
//   "url": "/notifications"
// }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

type NotificationRow = {
  id: string
  user_id: string
  title: string
  message: string
  action_url: string | null
}

type AuthContext = {
  mode: 'internal' | 'user'
  userId: string | null
  roles: string[]
  isAdmin: boolean
}

const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'membership_admin',
  'education_admin',
  'health_admin',
  'employment_admin',
  'ration_admin',
  'welfare_admin',
  'finance_admin',
])

const DEFAULT_ACTION_URL = '/notifications'
const DEFAULT_TITLE = 'JAS Update'
const DEFAULT_MESSAGE = 'You have a new update in the JAS member portal.'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function allowedOrigins() {
  const configured = [
    Deno.env.get('APP_ORIGIN'),
    Deno.env.get('SITE_URL'),
    Deno.env.get('PUBLIC_SITE_URL'),
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)

  return new Set([
    ...configured,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ])
}

function corsHeadersFor(request: Request) {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') || ''
  const allowList = allowedOrigins()
  const allowOrigin = origin && allowList.has(origin) ? origin : 'null'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-push-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(request),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function hasValidInternalSecret(request: Request) {
  const configuredSecret = Deno.env.get('PUSH_SEND_SECRET')
  if (!configuredSecret) return false

  const providedSecret = request.headers.get('x-push-secret') || ''
  return providedSecret.length > 0 && providedSecret === configuredSecret
}

function normalizeUuid(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return UUID_RE.test(trimmed) ? trimmed : null
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.replace(/\s+/g, ' ').trim()
  return trimmed ? trimmed.slice(0, maxLength) : fallback
}

function cleanActionUrl(value: unknown) {
  if (typeof value !== 'string') return DEFAULT_ACTION_URL

  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_ACTION_URL

  // Keep notification clicks inside the app. Avoid open redirects such as
  // https://evil.example or //evil.example.
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_ACTION_URL
  }

  return trimmed.slice(0, 300)
}

async function resolveAuthContext(
  request: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<AuthContext | Response> {
  if (hasValidInternalSecret(request)) {
    return {
      mode: 'internal',
      userId: null,
      roles: ['internal'],
      isAdmin: true,
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return jsonResponse(request, { error: 'Missing Authorization header' }, 401)
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user

  if (userError || !user?.id) {
    return jsonResponse(request, { error: 'Invalid or expired session' }, 401)
  }

  const { data: rolesRows, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (rolesError) throw rolesError

  const roles = (rolesRows || [])
    .map((row: { role?: string }) => row.role)
    .filter(Boolean) as string[]

  return {
    mode: 'user',
    userId: user.id,
    roles,
    isAdmin: roles.some((role) => ADMIN_ROLES.has(role)),
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(request) })
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405)
  }

  try {
    const vapidPublicKey = getRequiredEnv('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = getRequiredEnv('VAPID_PRIVATE_KEY')
    const vapidSubject = getRequiredEnv('VAPID_SUBJECT')
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const authContext = await resolveAuthContext(request, supabase)
    if (authContext instanceof Response) return authContext

    const body = await request.json().catch(() => ({}))
    const notificationId = normalizeUuid(body.notification_id)
    const directUserId = normalizeUuid(body.user_id)

    if (body.notification_id && !notificationId) {
      return jsonResponse(request, { error: 'Invalid notification_id' }, 400)
    }

    if (body.user_id && !directUserId) {
      return jsonResponse(request, { error: 'Invalid user_id' }, 400)
    }

    let userId = directUserId || undefined
    let title = cleanText(body.title, DEFAULT_TITLE, 80)
    let message = cleanText(body.body || body.message, DEFAULT_MESSAGE, 220)
    let actionUrl = cleanActionUrl(body.url)

    if (notificationId) {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, action_url')
        .eq('id', notificationId)
        .single<NotificationRow>()

      if (error) throw error
      if (!notification) {
        return jsonResponse(request, { error: 'Notification not found' }, 404)
      }

      const ownsNotification = authContext.userId === notification.user_id
      if (!authContext.isAdmin && !ownsNotification) {
        return jsonResponse(request, { error: 'Forbidden' }, 403)
      }

      userId = notification.user_id
      title = cleanText(notification.title, DEFAULT_TITLE, 80)
      message = cleanText(notification.message, DEFAULT_MESSAGE, 220)
      actionUrl = cleanActionUrl(notification.action_url || DEFAULT_ACTION_URL)
    } else {
      // Direct pushes can impersonate system/admin messages, so they are not
      // allowed for normal member sessions.
      if (!authContext.isAdmin) {
        return jsonResponse(
          request,
          { error: 'notification_id is required for member push requests' },
          403,
        )
      }
    }

    if (!userId) {
      return jsonResponse(
        request,
        { error: 'user_id or notification_id is required' },
        400,
      )
    }

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('user_id', userId)
      .eq('enabled', true)
      .returns<PushSubscriptionRow[]>()

    if (subscriptionsError) throw subscriptionsError

    if (!subscriptions?.length) {
      return jsonResponse(request, {
        sent: 0,
        failed: 0,
        removed: 0,
        message: 'No enabled push subscriptions found.',
      })
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: actionUrl,
      notification_id: notificationId || null,
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, payload)

        return subscription.id
      }),
    )

    const expiredIds: string[] = []
    let sent = 0
    let failed = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent += 1
        return
      }

      failed += 1

      const reason = result.reason as { statusCode?: number }
      if (reason?.statusCode === 404 || reason?.statusCode === 410) {
        expiredIds.push(subscriptions[index].id)
      }
    })

    if (expiredIds.length) {
      await supabase
        .from('push_subscriptions')
        .update({ enabled: false })
        .in('id', expiredIds)
    }

    return jsonResponse(request, {
      sent,
      failed,
      removed: expiredIds.length,
    })
  } catch (error) {
    console.error('send-web-push failed', error)

    return jsonResponse(
      request,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
})
