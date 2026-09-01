-- Health data
-- Run schema_accounts.sql first — this references public.profiles.
--
-- Three tables: the questionnaire someone fills out when they connect,
-- which platform they've connected, and the actual readings that come in
-- afterward (from Apple Health, Health Connect, or typed in by hand).

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  responses jsonb not null,        -- raw answers; shape is defined by the questionnaire form
  submitted_at timestamptz not null default now()
);

create table if not exists public.wearable_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('apple_health', 'health_connect', 'manual')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table if not exists public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric_type text not null check (metric_type in ('heart_rate', 'sleep')),
  value numeric not null,
  unit text not null,              -- e.g. 'bpm', 'hours'
  recorded_at timestamptz not null,
  source text not null check (source in ('apple_health', 'health_connect', 'manual')),
  flagged boolean not null default false,   -- set by the abnormal-range check
  created_at timestamptz not null default now()
);

alter table public.questionnaire_responses enable row level security;
alter table public.wearable_connections enable row level security;
alter table public.health_metrics enable row level security;

-- People can only ever see or write their own health data
create policy "questionnaire_own" on public.questionnaire_responses
  for all using (auth.uid() = user_id);

create policy "wearable_connections_own" on public.wearable_connections
  for all using (auth.uid() = user_id);

create policy "health_metrics_own" on public.health_metrics
  for all using (auth.uid() = user_id);
