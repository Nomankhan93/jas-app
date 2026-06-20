-- Multi Designation Card Support
-- The existing table already allows one member to hold active assignments in
-- multiple organization committees, for example:
--   CEC Member + District President.
-- This migration adds a read-optimized index for member card and public QR
-- verification lookups without changing existing data or constraints.

create index if not exists organization_committee_members_member_active_card_idx
  on public.organization_committee_members (member_id, status, sort_order, created_at desc);

comment on table public.organization_committee_members is
  'Stores organization-level designation assignments. A member may have multiple active assignments across different committees; card and QR verification display active assignments in organization-level order.';
