-- PickTravel application data tables.
-- Row Level Security is enabled with no anon/authenticated policies; the API
-- Edge Function accesses these tables with the server-only service role key.
create table if not exists public.app_records (
  collection text not null,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create table if not exists public.app_admin_credentials (
  username text primary key,
  salt text not null,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_records enable row level security;
alter table public.app_admin_credentials enable row level security;
