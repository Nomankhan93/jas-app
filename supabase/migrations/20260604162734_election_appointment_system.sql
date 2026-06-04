-- Election and Appointment System Phase 1

-- 1. Add 'election_admin' role to public.app_role enum
alter type public.app_role add value if not exists 'election_admin';

-- 2. Update organization_designations table for 'divisional' scope
alter table public.organization_designations
alter column scope type text;

alter table public.organization_designations
add constraint organization_designations_scope_check
check (scope in ('central', 'divisional', 'district', 'taluka'));

-- Insert divisional designations
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

-- 3. Update organization_committees table for 'divisional' type and add 'division' column
alter table public.organization_committees
alter column committee_type type text;

alter table public.organization_committees
add constraint organization_committees_committee_type_check
check (committee_type in ('central', 'divisional', 'district', 'taluka'));

alter table public.organization_committees
add column if not exists division text;

create index if not exists organization_committees_division_idx
  on public.organization_committees (division);

-- 4. Create sindh_district_divisions table
create table public.sindh_district_divisions (
  id uuid primary key default gen_random_uuid(),
  division text not null,
  district text not null unique,
  created_at timestamptz not null default now()
);

-- 5. Create elections table
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

-- 6. Create election_positions table
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

-- 7. Create election_candidates table
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

-- 8. Create election_voters table
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

-- 9. Create election_votes table
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

-- 10. Create election_objections table
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

-- 11. Create program_appointments table
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

-- 12. Create program_role_reviews table
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

-- 13. Enable RLS on new tables
alter table public.sindh_district_divisions enable row level security;
alter table public.elections enable row level security;
alter table public.election_positions enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_voters enable row level security;
alter table public.election_votes enable row level security;
alter table public.election_objections enable row level security;
alter table public.program_appointments enable row level security;
alter table public.program_role_reviews enable row level security;

-- 14. Private helper functions for permissions
create or replace function public.current_user_is_election_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('admin', 'super_admin', 'election_admin')
  );
$$;

create or replace function public.current_user_can_manage_elections()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_election_admin();
$$;

-- 15. RLS Policies

-- Elections
create policy "Anyone can read published results"
  on public.elections for select
  using (status = 'results_published');

create policy "Admins can manage all elections"
  on public.elections for all
  using (public.current_user_can_manage_elections());

create policy "Members can read active elections"
  on public.elections for select
  using (
    auth.uid() is not null 
    and status in ('nominations_open', 'scrutiny', 'campaign', 'voter_list_frozen', 'voting_open', 'voting_closed')
  );

-- Election Positions
create policy "Anyone can read election positions"
  on public.election_positions for select
  using (true);

create policy "Admins can manage election positions"
  on public.election_positions for all
  using (public.current_user_can_manage_elections());

-- Election Candidates
create policy "Anyone can read approved candidates"
  on public.election_candidates for select
  using (status = 'approved');

create policy "Admins can manage election candidates"
  on public.election_candidates for all
  using (public.current_user_can_manage_elections());

create policy "Candidates can view their own nomination"
  on public.election_candidates for select
  using (member_id in (select id from public.members where user_id = auth.uid()));

-- Election Voters
create policy "Admins can read election voters"
  on public.election_voters for select
  using (public.current_user_can_manage_elections());

create policy "Members can read their own voter status"
  on public.election_voters for select
  using (user_id = auth.uid());

-- Election Votes (Secret Ballot)
-- No direct select allowed for anyone, including admins.
-- Votes are counted via RPC.

-- Election Objections
create policy "Admins can manage all objections"
  on public.election_objections for all
  using (public.current_user_can_manage_elections());

create policy "Members can submit objections"
  on public.election_objections for insert
  with check (submitted_by = auth.uid());

create policy "Members can read their own objections"
  on public.election_objections for select
  using (submitted_by = auth.uid());

-- Program Appointments
create policy "Admins can manage all appointments"
  on public.program_appointments for all
  using (public.current_user_can_manage_organization());

create policy "Members can view their own appointments"
  on public.program_appointments for select
  using (member_id in (select id from public.members where user_id = auth.uid()));

-- Program Role Reviews
create policy "Admins can manage all reviews"
  on public.program_role_reviews for all
  using (public.current_user_can_manage_organization());

create policy "Members can view their own reviews"
  on public.program_role_reviews for select
  using (
    appointment_id in (
      select id from public.program_appointments 
      where member_id in (select id from public.members where user_id = auth.uid())
    )
  );

-- 16. Voting RPC Function
create or replace function public.cast_vote(
  _election_id uuid,
  _position_id uuid,
  _candidate_id uuid
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _user_id uuid := auth.uid();
  _member_id uuid;
  _election_status text;
  _voter_record_id uuid;
begin
  -- 1. Check if user is logged in
  if _user_id is null then
    raise exception 'Authentication required.';
  end if;

  -- 2. Check if member is approved
  select id into _member_id
  from public.members
  where user_id = _user_id and status = 'approved';

  if _member_id is null then
    raise exception 'Only approved members can vote.';
  end if;

  -- 3. Check election status
  select status into _election_status
  from public.elections
  where id = _election_id;

  if _election_status is null then
    raise exception 'Election not found.';
  end if;

  if _election_status <> 'voting_open' then
    raise exception 'Voting is not open for this election.';
  end if;

  -- 4. Check if voter is in the frozen voter list for this position
  select id into _voter_record_id
  from public.election_voters
  where election_id = _election_id 
    and position_id = _position_id 
    and user_id = _user_id;

  if _voter_record_id is null then
    raise exception 'You are not eligible to vote for this position.';
  end if;

  -- 5. Check if already voted
  if exists (
    select 1 from public.election_voters 
    where id = _voter_record_id and has_voted = true
  ) then
    raise exception 'You have already cast your vote for this position.';
  end if;

  -- 6. Check if candidate is approved for this position
  if not exists (
    select 1 from public.election_candidates
    where id = _candidate_id 
      and position_id = _position_id 
      and status = 'approved'
  ) then
    raise exception 'Invalid or unapproved candidate.';
  end if;

  -- 7. Perform voting in one transaction
  -- Mark as voted first
  update public.election_voters
  set has_voted = true, voted_at = now()
  where id = _voter_record_id;

  -- Insert anonymous vote
  insert into public.election_votes (election_id, position_id, candidate_id)
  values (_election_id, _position_id, _candidate_id);

  return json_build_object('success', true, 'message', 'Vote cast successfully');
end;
$$;

-- 17. Result Calculation RPC
create or replace function public.get_election_results(_election_id uuid)
returns table (
  position_id uuid,
  position_title text,
  candidate_id uuid,
  candidate_name text,
  member_no text,
  vote_count bigint,
  is_winner boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow if results are published or user is admin
  if not (
    exists (select 1 from public.elections where id = _election_id and status = 'results_published')
    or public.current_user_can_manage_elections()
  ) then
    raise exception 'Results are not yet available.';
  end if;

  return query
  with vote_counts as (
    select 
      ev.position_id,
      ev.candidate_id,
      count(*) as count
    from public.election_votes ev
    where ev.election_id = _election_id
    group by ev.position_id, ev.candidate_id
  ),
  ranked_candidates as (
    select
      ep.id as pos_id,
      ep.title as pos_title,
      ec.id as cand_id,
      m.full_name as cand_name,
      m.member_no as m_no,
      coalesce(vc.count, 0) as v_count,
      rank() over (partition by ep.id order by coalesce(vc.count, 0) desc) as rnk,
      ep.seats
    from public.election_positions ep
    join public.election_candidates ec on ec.position_id = ep.id
    join public.members m on ec.member_id = m.id
    left join vote_counts vc on vc.candidate_id = ec.id
    where ep.election_id = _election_id
      and ec.status = 'approved'
  )
  select
    pos_id,
    pos_title,
    cand_id,
    cand_name,
    m_no,
    v_count,
    (rnk <= seats) as is_winner
  from ranked_candidates
  order by pos_title, v_count desc;
end;
$$;

-- 18. Voter List Generation RPC
create or replace function public.generate_election_voters(_election_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  _election record;
  _inserted_count int := 0;
begin
  if not public.current_user_can_manage_elections() then
    raise exception 'Unauthorized.';
  end if;

  select * into _election from public.elections where id = _election_id;
  if _election.id is null then
    raise exception 'Election not found.';
  end if;

  if _election.status <> 'draft' and _election.status <> 'nominations_open' then
    raise exception 'Voter list can only be generated in draft or nominations_open status.';
  end if;

  -- Clear existing voters for this election if any
  delete from public.election_voters where election_id = _election_id;

  -- Insert eligible voters based on level
  insert into public.election_voters (election_id, position_id, user_id, member_id)
  select 
    _election_id,
    ep.id,
    m.user_id,
    m.id
  from public.members m
  cross join public.election_positions ep
  where ep.election_id = _election_id
    and m.status = 'approved'
    and (
      _election.level = 'central'
      or (_election.level = 'divisional' and exists (
          select 1 from public.sindh_district_divisions sdd 
          where sdd.district = m.district and sdd.division = _election.division
      ))
      or (_election.level = 'district' and m.district = _election.district)
      or (_election.level = 'taluka' and m.district = _election.district and m.taluka = _election.taluka)
    );

  get diagnostics _inserted_count = row_count;

  return json_build_object('success', true, 'voters_generated', _inserted_count);
end;
$$;
