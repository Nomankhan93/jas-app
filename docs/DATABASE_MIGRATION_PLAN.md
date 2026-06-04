# Database Migration Plan for Election and Appointment System

This document outlines the necessary database schema changes to implement the Election Procedure and Voting System, as well as the Program Secretary Appointment module, into the JAS app. The plan includes adding divisional support to existing committee structures, introducing new tables for election management, and updating roles.

## 1. Add Divisional Support to Committees and Designations

Before implementing the election module, the existing `organization_committees` and `organization_designations` tables need to be updated to include support for the 'divisional' level. This ensures consistency across the application's organizational hierarchy.

### 1.1 Update `public.app_role` Enum

First, the `app_role` enum needs to be updated to include the new `election_admin` role.

```sql
alter type public.app_role add value if not exists 'election_admin';
```

### 1.2 Update `organization_designations` Table

The `scope` column in `public.organization_designations` needs to allow for the 'divisional' value.

```sql
alter table public.organization_designations
alter column scope type text;

alter table public.organization_designations
add constraint organization_designations_scope_check
check (scope in ('central', 'divisional', 'district', 'taluka'));

-- Update existing designations to include divisional scope if necessary
insert into public.organization_designations (scope, title, sort_order) values
  ('divisional', 'Divisional President', 1),
  ('divisional', 'Divisional Vice President', 2),
  ('divisional', 'Divisional General Secretary', 3),
  ('divisional', 'Divisional Information Secretary', 4),
  ('divisional', 'Divisional Finance Secretary', 5)
on conflict (scope, title) do update set
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
```

### 1.3 Update `organization_committees` Table

The `committee_type` column in `public.organization_committees` needs to allow for the 'divisional' value, and a new `division` column should be added.

```sql
alter table public.organization_committees
alter column committee_type type text;

alter table public.organization_committees
add constraint organization_committees_committee_type_check
check (committee_type in ('central', 'divisional', 'district', 'taluka'));

alter table public.organization_committees
add column if not exists division text;

-- Add index for the new division column
create index if not exists organization_committees_division_idx
  on public.organization_committees (division);
```

### 1.4 Create `sindh_district_divisions` Table

This table will map districts to their respective divisions, avoiding the need to store division information in every member record.

```sql
create table public.sindh_district_divisions (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  district text not null unique,
  created_at timestamptz not null default now()
);

-- Example data insertion (to be populated based on actual Sindh divisions and districts)
-- insert into public.sindh_district_divisions (division, district) values
--   ('Hyderabad Division', 'Hyderabad'),
--   ('Hyderabad Division', 'Matiari'),
--   ('Hyderabad Division', 'Tando Allahyar'),
--   ('Hyderabad Division', 'Tando Muhammad Khan');
```

## 2. New Election Tables

Six new tables are required to manage the election process, candidates, voters, votes, and objections.

### 2.1 `elections` Table

Stores the details of each election.

```sql
create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text not null check (level in ('central', 'divisional', 'district', 'taluka')),
  division text,
  district text,
  taluka text,
  term_start date not null,
  term_end date not null,
  nomination_start timestamptz,
  nomination_end timestamptz,
  voting_start timestamptz,
  voting_end timestamptz,
  status text not null default 'draft'
    check (status in (
      'draft',
      'nominations_open',
      'scrutiny',
      'campaign',
      'voter_list_frozen',
      'voting_open',
      'voting_closed',
      'results_published',
      'cancelled'
    )),
  result_published_at timestamptz,
  cancellation_reason text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists elections_level_idx on public.elections (level);
create index if not exists elections_status_idx on public.elections (status);
create index if not exists elections_area_idx on public.elections (division, district, taluka);
```

### 2.2 `election_positions` Table

Stores the positions available within an election (e.g., Chairman, General Secretary).

```sql
create table public.election_positions (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  title text not null,
  seats integer not null default 1,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (election_id, title)
);

create index if not exists election_positions_election_id_idx on public.election_positions (election_id);
```

### 2.3 `election_candidates` Table

Stores information about candidates for each position.

```sql
create table public.election_candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_id uuid not null references public.election_positions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  manifesto text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  rejection_reason text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (election_id, position_id, member_id)
);

create index if not exists election_candidates_election_id_idx on public.election_candidates (election_id);
create index if not exists election_candidates_position_id_idx on public.election_candidates (position_id);
create index if not exists election_candidates_member_id_idx on public.election_candidates (member_id);
```

### 2.4 `election_voters` Table

Stores the final voter list and voting status for each eligible member, ensuring voter privacy.

```sql
create table public.election_voters (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_id uuid not null references public.election_positions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  has_voted boolean not null default false,
  voted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (election_id, position_id, user_id)
);

create index if not exists election_voters_election_id_idx on public.election_voters (election_id);
create index if not exists election_voters_user_id_idx on public.election_voters (user_id);
```

### 2.5 `election_votes` Table

Stores the actual votes cast, without linking directly to the `user_id` to maintain a secret ballot.

```sql
create table public.election_votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_id uuid not null references public.election_positions(id) on delete cascade,
  candidate_id uuid not null references public.election_candidates(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists election_votes_election_id_idx on public.election_votes (election_id);
create index if not exists election_votes_position_id_idx on public.election_votes (position_id);
create index if not exists election_votes_candidate_id_idx on public.election_votes (candidate_id);
```

### 2.6 `election_objections` Table

Records any complaints, objections, or appeals related to an election.

```sql
create table public.election_objections (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  submitted_by uuid references auth.users(id),
  objection_type text not null check (objection_type in ('voter_list', 'candidate', 'polling', 'result', 'other')),
  description text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'resolved')),
  decision_notes text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists election_objections_election_id_idx on public.election_objections (election_id);
create index if not exists election_objections_submitted_by_idx on public.election_objections (submitted_by);
```

## 3. New Program Appointment Tables

Two new tables are required for the Program Secretary Appointment module.

### 3.1 `program_appointments` Table

Stores details of nominated program roles.

```sql
create table public.program_appointments (
  id uuid primary key default gen_random_uuid(),
  program_key text not null,
  role_title text not null,
  member_id uuid not null references public.members(id),
  level text not null check (level in ('central', 'divisional', 'district', 'taluka')),
  division text,
  district text,
  taluka text,
  appointment_method text not null default 'nominated_cwc_approved',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'active', 'suspended', 'removed', 'completed')),
  nominated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  tenure_start date,
  tenure_end date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists program_appointments_member_id_idx on public.program_appointments (member_id);
create index if not exists program_appointments_level_idx on public.program_appointments (level);
create index if not exists program_appointments_status_idx on public.program_appointments (status);
```

### 3.2 `program_role_reviews` Table

Records performance reviews for program roles.

```sql
create table public.program_role_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.program_appointments(id) on delete cascade,
  review_period_start date,
  review_period_end date,
  rating integer check (rating between 1 and 5),
  work_progress text,
  transparency_notes text,
  discipline_notes text,
  recommendation text check (recommendation in ('continue', 'warning', 'replace', 'remove')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists program_role_reviews_appointment_id_idx on public.program_role_reviews (appointment_id);
```

## 4. Row Level Security (RLS) Policies

RLS policies will be crucial for securing the new tables. These will be implemented in a later phase, but the general plan is as follows:

*   **`elections`**: Admin/election_admin can manage. Approved members can read eligible active elections. Public can read published results.
*   **`election_candidates`**: Admin/election_admin can manage. Members can read approved candidates. Candidates can view their own nomination.
*   **`election_voters`**: Admin can see voter status. Members can see their own voting status. No one should see another member’s vote choice.
*   **`election_votes`**: No direct `SELECT` allowed. Only `INSERT` via `cast_vote()` RPC. Results only through RPC/view.
*   **`election_objections`**: Members can submit. Admin/election_admin can review. Members can see their own objection status.
*   **`program_appointments`**: Admin can manage. Members can view their own appointments.
*   **`program_role_reviews`**: Admin can manage. Appointed members can view their own reviews.

## 5. Required RPC Functions

Several Supabase RPC functions will be needed to handle complex logic and enforce security, especially for voting.

*   `current_user_is_election_admin()`
*   `current_user_can_manage_elections()`
*   `generate_election_voters(election_id)`
*   `freeze_election_voter_list(election_id)`
*   `cast_vote(election_id, position_id, candidate_id)`
*   `get_election_results(election_id)`
*   `publish_election_results(election_id)`
*   `create_committee_from_election(election_id)`

## 6. Audit Log Integration

Existing audit log functionality will be extended to cover key events within the election and appointment modules, such as election creation, status changes, candidate approvals, voter list actions, result publishing, and appointment lifecycle events. Crucially, actual vote choices will *not* be logged with voter identity.
