-- List tables for admin-editable repeating content
-- Run schema_accounts.sql first — this references public.profiles.
--
-- Each table follows the same pattern: public read, admin-only write.
-- Rows are ordered by `sort_order` so admins can reorder items.

-- Faculty members
create table if not exists public.faculty_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  email text,
  phone text,
  image_url text,                 -- Supabase Storage URL (content-images bucket)
  is_director boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faculty_members enable row level security;

create policy "faculty_members_select_all" on public.faculty_members
  for select using (true);

create policy "faculty_members_write_admin" on public.faculty_members
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Health topics
create table if not exists public.health_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  color text not null default '#8B7FE8',
  image_url text,                 -- Supabase Storage URL (content-images bucket)
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_topics enable row level security;

create policy "health_topics_select_all" on public.health_topics
  for select using (true);

create policy "health_topics_write_admin" on public.health_topics
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Home page events/alerts
create table if not exists public.home_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  color text not null default '#ef4444',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_events enable row level security;

create policy "home_events_select_all" on public.home_events
  for select using (true);

create policy "home_events_write_admin" on public.home_events
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Trigger to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists faculty_members_updated_at on public.faculty_members;
create trigger faculty_members_updated_at
  before update on public.faculty_members
  for each row execute procedure public.handle_updated_at();

drop trigger if exists health_topics_updated_at on public.health_topics;
create trigger health_topics_updated_at
  before update on public.health_topics
  for each row execute procedure public.handle_updated_at();

drop trigger if exists home_events_updated_at on public.home_events;
create trigger home_events_updated_at
  before update on public.home_events
  for each row execute procedure public.handle_updated_at();
