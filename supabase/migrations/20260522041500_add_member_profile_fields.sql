alter table public.members
add column if not exists address text,
add column if not exists date_of_birth date,
add column if not exists gender text,
add column if not exists education text,
add column if not exists blood_group text,
add column if not exists emergency_contact_name text,
add column if not exists emergency_contact_relation text,
add column if not exists emergency_contact_mobile text,
add column if not exists declaration_accepted boolean not null default false;
