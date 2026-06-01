# Jatt Alliance Sindh (JAS) Web App

A member-verified web platform for Jatt Alliance Sindh. The app combines digital membership registration, admin approval, QR-based member cards, program applications, finance tracking, donations, donor leaderboard, employment support, and member notifications.

## Current modules

- Public landing page with Programs, Donate and Donors entry points
- Membership registration, approval, rejection and QR verification
- Digital membership card front/back and admin card preview
- Unified member dashboard and in-app notifications
- Education program applications and admin review
- Health assistance cases with restricted medical review
- Welfare case management and close reports
- Employment program / CV database
- Donation submission and member-only donor leaderboard
- Admin finance dashboard for donations, expenses and audit logs
- Role-based admin entry points for membership, education, health, welfare, employment and finance

## Tech stack

- React + TypeScript
- TanStack Start / TanStack Router
- Supabase Auth, Postgres, Storage and RLS
- Tailwind CSS
- Vite

## Environment setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:

```env
VITE_SUPABASE_URL=
SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SITE_URL=http://localhost:3000
```

Important: never commit or share `.env.local`. The service-role key is server-only. `SUPABASE_URL` should normally match `VITE_SUPABASE_URL`, but it is read only by server-side admin actions.

## Install and run

```bash
npm install
npm run dev
```

Default local app URL:

```text
http://localhost:3000
```

## Typecheck and build

```bash
npm run check
npm run build
```

Equivalent direct command:

```bash
npx tsc --noEmit
```

## Supabase migrations

Push migrations to the linked Supabase project:

```bash
npx supabase db push
```

Generate database types after schema changes:

```bash
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

For local Supabase:

```bash
npx supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts
```

## Admin roles

Roles are stored in `public.user_roles`. Source of truth: `user_roles` defines the role identity, while `admin_area_permissions` defines district/taluka/module scope for limited admins. Common roles:

- `admin`
- `super_admin`
- `membership_admin`
- `education_admin`
- `health_admin`
- `welfare_admin`
- `employment_admin`
- `finance_admin`

Assign a role from Supabase SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id, role) do nothing;
```


Membership review access:

```text
super_admin, admin, membership_admin
```

Only these roles should approve/reject membership applications or open admin member card previews. Area-scoped access is handled through `admin_area_permissions`.

Program-specific example:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'employment_admin')
on conflict (user_id, role) do nothing;
```

## Key routes

Public/member routes:

```text
/
/signup
/login
/register
/dashboard
/notifications
/card
/verify/$memberNo
/donate
/donors
/programs/education
/programs/health
/programs/welfare
/programs/employment
```

Admin routes:

```text
/admin
/admin/members/$id
/admin/members/$id/card
/admin/programs/education
/admin/programs/health
/admin/programs/welfare
/admin/programs/employment
/admin/finance
```

## Security notes

- Keep storage buckets private unless explicitly public.
- Medical, welfare, finance and employment documents should only be viewed by authorized roles.
- Leaderboard includes only finance-approved donations.
- CNIC/mobile are masked by default in admin lists.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.
- Do not share project zips containing `.env.local`, `.git`, `.output`, or `supabase/.temp`.

## Clean zip sharing

When sharing a project zip, exclude secrets and build artifacts:

```bash
cd ~/projects
rsync -av jas-app/ jas-app-clean/ \
  --exclude node_modules \
  --exclude .git \
  --exclude .output \
  --exclude .env.local \
  --exclude supabase/.temp \
  --exclude supabase/.branches \
  --exclude supabase/snippets

zip -r jas-app-clean.zip jas-app-clean
```

## Recommended next builds

1. Public Website + CMS Phase 1
2. News / Gallery / Events Phase 1
3. Admin Reports Center
4. Role Management UI
5. Committee and Designation Management
