-- Health topic detail pages (app/health/[domain].tsx)
-- Run schema_lists.sql first — these reference health_topics and reuse its
-- handle_updated_at trigger. Also needs public.is_admin() from
-- schema_accounts.sql.
--
-- Same pattern as schema_lists.sql: public read, admin-only write, ordered by
-- `sort_order`. Each row belongs to a health topic, so a topic an admin adds
-- gets its own page of resources and apps without an app release. Deleting a
-- topic deletes its resources and apps with it.

-- "Local Resources" cards: clinics, meetings, treatment centers.
create table if not exists public.health_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_resources_topic_idx
  on public.health_resources (topic_id, sort_order);

alter table public.health_resources enable row level security;

drop policy if exists "health_resources_select_all" on public.health_resources;
create policy "health_resources_select_all" on public.health_resources
  for select using (true);

-- Insert/update/delete only — a `for all` policy would also run on every
-- public read, and reads are already covered above.
drop policy if exists "health_resources_insert_admin" on public.health_resources;
create policy "health_resources_insert_admin" on public.health_resources
  for insert with check (public.is_admin());
drop policy if exists "health_resources_update_admin" on public.health_resources;
create policy "health_resources_update_admin" on public.health_resources
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "health_resources_delete_admin" on public.health_resources;
create policy "health_resources_delete_admin" on public.health_resources
  for delete using (public.is_admin());

drop trigger if exists health_resources_updated_at on public.health_resources;
create trigger health_resources_updated_at
  before update on public.health_resources
  for each row execute procedure public.handle_updated_at();

-- "Apps" cards: recovery apps with a logo, description and feature bullets.
-- image_url is an uploaded image; when it's empty the app falls back to the
-- logo bundled with the app for that title, if there is one.
create table if not exists public.health_apps (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics(id) on delete cascade,
  title text not null,
  description text,
  features text[] not null default '{}',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_apps_topic_idx
  on public.health_apps (topic_id, sort_order);

alter table public.health_apps enable row level security;

drop policy if exists "health_apps_select_all" on public.health_apps;
create policy "health_apps_select_all" on public.health_apps
  for select using (true);

drop policy if exists "health_apps_insert_admin" on public.health_apps;
create policy "health_apps_insert_admin" on public.health_apps
  for insert with check (public.is_admin());
drop policy if exists "health_apps_update_admin" on public.health_apps;
create policy "health_apps_update_admin" on public.health_apps
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "health_apps_delete_admin" on public.health_apps;
create policy "health_apps_delete_admin" on public.health_apps
  for delete using (public.is_admin());

drop trigger if exists health_apps_updated_at on public.health_apps;
create trigger health_apps_updated_at
  before update on public.health_apps
  for each row execute procedure public.handle_updated_at();
