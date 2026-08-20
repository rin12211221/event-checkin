create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  restaurant_name text not null,
  offer text not null,
  location_name text not null,
  address text not null,
  date_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (event_id, slug)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  phone text not null,
  source text not null check (source in ('club_link', 'walk_in', 'direct')),
  checkin_token uuid not null unique default gen_random_uuid(),
  checked_in_at timestamptz,
  checkin_method text check (checkin_method in ('qr', 'manual')),
  created_at timestamptz not null default now(),
  unique (event_id, phone)
);

create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists registrations_checked_in_at_idx on public.registrations(event_id, checked_in_at);
create index if not exists clubs_event_id_idx on public.clubs(event_id);

alter table public.events enable row level security;
alter table public.clubs enable row level security;
alter table public.registrations enable row level security;

-- This app performs database operations on the server with the Supabase service role.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
