# send-web-push Edge Function

This function sends browser/PWA push notifications to saved `push_subscriptions` rows.

## Security rules

- Normal logged-in users may call the function only with a `notification_id` that belongs to their own `auth.users.id`.
- Admin roles may send an existing `notification_id` to any user.
- Direct payloads with `user_id`, `title`, `body`, or `url` require an admin session or the internal `X-Push-Secret` header.
- Notification click URLs are restricted to same-app relative paths such as `/notifications` to avoid open redirects.

Admin roles currently accepted by the function:

```txt
admin
super_admin
membership_admin
education_admin
health_admin
employment_admin
ration_admin
welfare_admin
finance_admin
```

## Required secrets

Set these in Supabase Edge Function secrets, not in client-side `VITE_` env variables:

```bash
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
supabase secrets set VAPID_SUBJECT="mailto:admin@example.com"
supabase secrets set SUPABASE_URL="https://PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
```

## Recommended optional secrets

```bash
supabase secrets set PUSH_SEND_SECRET="$(openssl rand -base64 48)"
supabase secrets set APP_ORIGIN="https://jasofficial.org,http://localhost:3000"
```

Use `PUSH_SEND_SECRET` only from trusted server/cron jobs:

```bash
curl -X POST "https://PROJECT.supabase.co/functions/v1/send-web-push" \
  -H "Content-Type: application/json" \
  -H "X-Push-Secret: $PUSH_SEND_SECRET" \
  -d '{"notification_id":"00000000-0000-4000-8000-000000000000"}'
```

Browser/client calls should use a Supabase auth bearer token and `notification_id` only.
