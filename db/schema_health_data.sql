-- Health data
-- Run schema_accounts.sql first — this references public.profiles.
--
-- Three tables: the intake questionnaire someone fills out when they connect,
-- which platform they've connected, and the actual readings that come in
-- afterward (from Apple Health, Health Connect, or typed in by hand).
-- Screening (whether the questionnaire applies to someone at all) lives in
-- the screening_* tables instead — see migration_screening_disqualifies.sql.

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
  last_synced_at timestamptz,
  unique (user_id, platform)       -- one row per person per platform; see migration_dedupe_wearable_connections.sql
);

-- One row = one finished daily summary (e.g. yesterday's resting heart
-- rate, or last night's total sleep) — not a live, in-progress reading.
-- "Right now" numbers (today's step count, etc.) are read straight from
-- the phone and never stored here. For sleep, recorded_at is the date the
-- person woke up, not the date they fell asleep.
--
-- Each time the app opens it saves the day before as one 'JSON' row: value is
-- the step count and unit holds that whole day as a JSON string (distance,
-- calories, activity minutes, workouts, every heart rate reading, resting
-- heart rate, sleep stages, weight, height). metric_type just needs to stay a
-- plain text column with no check — it was briefly changed to a json/jsonb
-- column by mistake, which rejected every plain label ('JSON' included,
-- since a bare word isn't valid JSON on its own).
create table if not exists public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wearable_connection_id uuid references public.wearable_connections(id),  -- null for manual entries
  metric_type text not null,
  value numeric not null,
  unit text not null,              -- e.g. 'bpm', 'hours', 'count'
  recorded_at date not null,
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
