create extension if not exists "pgcrypto";

create table if not exists public.invitees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null unique,
  access_token text not null default encode(gen_random_bytes(24), 'hex'),
  phone text,
  pax_allowed integer not null default 1 check (pax_allowed between 1 and 10),
  pax_attending integer check (pax_attending between 0 and 10),
  status text not null default 'pending' check (
    status in ('attending', 'pending', 'skip')
  ),
  attendance_status text check (
    attendance_status is null or attendance_status in (
      'reception_only',
      'holy_matrimony_only',
      'both',
      'not_attending'
    )
  ),
  submission_fingerprint text check (
    submission_fingerprint is null or char_length(submission_fingerprint) = 64
  ),
  rsvp_submitted_at timestamptz,
  last_submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitees_slug_idx on public.invitees (slug);

-- Safe migration for projects that ran an earlier version of this schema.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invitees'
      and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invitees'
      and column_name = 'full_name'
  ) then
    alter table public.invitees rename column name to full_name;
  end if;
end $$;

alter table public.invitees add column if not exists access_token text;
update public.invitees
set access_token = encode(gen_random_bytes(24), 'hex')
where access_token is null;
alter table public.invitees
  alter column access_token set default encode(gen_random_bytes(24), 'hex');
alter table public.invitees alter column access_token set not null;
create unique index if not exists invitees_access_token_idx
  on public.invitees (access_token);
create unique index if not exists invitees_full_name_unique_idx
  on public.invitees (lower(full_name));

alter table public.invitees
  add column if not exists status text not null default 'pending';
alter table public.invitees
  add column if not exists submission_fingerprint text;
alter table public.invitees
  add column if not exists rsvp_submitted_at timestamptz;
alter table public.invitees
  add column if not exists last_submitted_at timestamptz;

update public.invitees
set status = case
  when attendance_status = 'not_attending' then 'skip'
  when attendance_status is not null then 'attending'
  else 'pending'
end;

alter table public.invitees drop constraint if exists invitees_status_check;
alter table public.invitees add constraint invitees_status_check
  check (status in ('attending', 'pending', 'skip'));
alter table public.invitees drop constraint if exists invitees_submission_fingerprint_check;
alter table public.invitees add constraint invitees_submission_fingerprint_check
  check (
    submission_fingerprint is null or char_length(submission_fingerprint) = 64
  );

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  invitee_id uuid references public.invitees(id) on delete set null,
  guest_name text not null check (char_length(guest_name) between 2 and 100),
  message text not null check (char_length(message) between 2 and 500),
  submission_fingerprint text check (
    submission_fingerprint is null or char_length(submission_fingerprint) = 64
  ),
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists wishes_approved_created_idx
  on public.wishes (is_approved, created_at desc);
alter table public.wishes alter column is_approved set default true;
update public.wishes set is_approved = true where is_approved = false;
alter table public.wishes
  add column if not exists submission_fingerprint text;
alter table public.wishes drop constraint if exists wishes_submission_fingerprint_check;
alter table public.wishes add constraint wishes_submission_fingerprint_check
  check (
    submission_fingerprint is null or char_length(submission_fingerprint) = 64
  );
create unique index if not exists wishes_invitee_unique_idx
  on public.wishes (invitee_id);

create table if not exists public.site_settings (
  id text primary key default 'main',
  content jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.invitees enable row level security;
alter table public.wishes enable row level security;
alter table public.site_settings enable row level security;

-- This project performs all reads/writes through authenticated server routes
-- using the service-role key. No anonymous table policies are intentionally
-- created, so private invitee data is not directly exposed through the Data API.
