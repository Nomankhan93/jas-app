# JAS Deployment Checklist

## Before push

```bash
npm run check
npm run build
bash scripts/verify-project.sh
git status
```

## Before Supabase cloud migration

```bash
npx supabase migration list
npx supabase db push
```

After migration, check:

- Security Advisor warnings
- Performance Advisor warnings
- `admin_area_permissions` table
- `audit_logs` table
- Office bearer verification route data

## Before Vercel deploy

Set environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_SITE_URL=https://your-domain.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client variables.

## After deploy smoke test

- `/`
- `/login`
- `/dashboard`
- `/card`
- `/designation-card`
- `/verify/office-bearer/<id>`
- `/admin`
- `/admin/area-permissions`
- `/admin/audit-logs`

## Safe handoff/export

```bash
npm run safe-export
bash scripts/check-safe-archive.sh exports/<archive-name>.zip
```

Never share raw project folders/zips.
