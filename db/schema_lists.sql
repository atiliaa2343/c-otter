-- Structured, repeating content — each of these is a list of records
-- (multiple fields per item), which is why they're real tables instead of
-- content_blocks rows. Currently the app renders these from hardcoded
-- arrays in Faculty.tsx / Health.tsx / HomePage.tsx; these tables are the
-- future home for that same content if it becomes admin-editable later —
-- nothing reads from them yet.

create table if not exists public.faculty_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  email text,
  phone text,
  image_key text,          -- matches a local asset filename, e.g. 'Larry.jpeg'
  is_director boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.health_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  color text,
  image_key text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.home_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.faculty_members enable row level security;
alter table public.health_topics enable row level security;
alter table public.home_events enable row level security;

create policy "faculty_members_select_all" on public.faculty_members for select using (true);
create policy "health_topics_select_all" on public.health_topics for select using (true);
create policy "home_events_select_all" on public.home_events for select using (true);

create policy "faculty_members_write_admin" on public.faculty_members
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "health_topics_write_admin" on public.health_topics
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "home_events_write_admin" on public.home_events
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
