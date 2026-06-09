// @ts-nocheck
// Supabase Edge Function: send-web-push
//
// Required secrets:
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Example payload:
// {
//   "user_id": "uuid",
//   "title": "JAS Update",
//   "body": "Your membership has been approved.",
//   "url": "/notifications"
// }
//
// Or:
// {
//   "notification_id": "uuid"
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
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
      },
    })

    const body = await request.json().catch(() => ({}))
    let userId = body.user_id as string | undefined
    let title = (body.title as string | undefined) || 'JAS Update'
    let message =
      (body.body as string | undefined) ||
      (body.message as string | undefined) ||
      'You have a new update in the JAS member portal.'
    let actionUrl = (body.url as string | undefined) || '/notifications'
    const notificationId = body.notification_id as string | undefined

    if (notificationId) {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, action_url')
        .eq('id', notificationId)
        .single<NotificationRow>()

      if (error) throw error
      if (!notification) {
        return jsonResponse({ error: 'Notification not found' }, 404)
      }

      userId = notification.user_id
      title = notification.title
      message = notification.message
      actionUrl = notification.action_url || '/notifications'
    }

    if (!userId) {
      return jsonResponse(
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
      return jsonResponse({
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

    return jsonResponse({
      sent,
      failed,
      removed: expiredIds.length,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
})
