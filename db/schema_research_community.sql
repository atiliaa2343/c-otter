-- Research publications and community items
-- Run schema_accounts.sql first — these tables reference public.profiles.
-- Run schema_lists.sql first — this reuses its handle_updated_at trigger.
--
-- Same pattern as schema_lists.sql: public read, admin-only write, ordered by
-- `sort_order`. These two cover the last content that was still hardcoded.

-- Research publications
-- The page renders each publication as one pre-formatted citation string,
-- so that's the primary field. journal/year are optional splits that let an
-- admin highlight the journal name without retyping the whole citation.
create table if not exists public.research_publications (
  id uuid primary key default gen_random_uuid(),
  citation text not null,
  journal text,
  year int,
  is_featured boolean not null default false,   -- drives the "Latest Publication" card
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.research_publications enable row level security;

create policy "research_publications_select_all" on public.research_publications
  for select using (true);

create policy "research_publications_write_admin" on public.research_publications
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop trigger if exists research_publications_updated_at on public.research_publications;
create trigger research_publications_updated_at
  before update on public.research_publications
  for each row execute procedure public.handle_updated_at();

-- Community categories
-- The two big coloured groupings on the Community page ("Volunteer
-- Opportunities", "Food Pantry & Basic Needs").
create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  color text not null default '#10B981',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_categories enable row level security;

create policy "community_categories_select_all" on public.community_categories
  for select using (true);

create policy "community_categories_write_admin" on public.community_categories
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop trigger if exists community_categories_updated_at on public.community_categories;
create trigger community_categories_updated_at
  before update on public.community_categories
  for each row execute procedure public.handle_updated_at();

-- Community sub-items
-- The tappable rows inside a category ("Events", "Financial Assistance", ...).
create table if not exists public.community_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.community_categories(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_items enable row level security;

create policy "community_items_select_all" on public.community_items
  for select using (true);

create policy "community_items_write_admin" on public.community_items
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop trigger if exists community_items_updated_at on public.community_items;
create trigger community_items_updated_at
  before update on public.community_items
  for each row execute procedure public.handle_updated_at();

-- Listings sit under a community item: the specific opportunities with a
-- contact, time, and link.
create table if not exists public.community_listings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.community_items(id) on delete cascade,
  title text not null,
  description text,
  contact text,
  date_time text,
  link text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_listings enable row level security;

create policy "community_listings_select_all" on public.community_listings
  for select using (true);

create policy "community_listings_write_admin" on public.community_listings
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop trigger if exists community_listings_updated_at on public.community_listings;
create trigger community_listings_updated_at
  before update on public.community_listings
  for each row execute procedure public.handle_updated_at();
