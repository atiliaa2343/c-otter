-- Locations & hours of operation, moved off MongoDB (whose locations and
-- hours_of_operation collections turned out to be empty — nothing was
-- actually live there). The real source is the Excel data in db/data/,
-- seeded by db/seed_locations.sql.
--
-- One location can have more than one hours_of_operation row (e.g. one
-- location has different hours on different weekdays) — that's real, not
-- a bug, see Central Virginia Health Services in the seed data.

create table if not exists public.locations (
  id integer primary key,
  name text not null,
  address text,
  phone_number text,
  theme text,
  hours_summary text,       -- the original freeform "Hours" text, e.g. "24 hours"
  created_at timestamptz not null default now()
);

create table if not exists public.hours_of_operation (
  id bigint generated always as identity primary key,
  location_id integer not null references public.locations(id) on delete cascade,
  open_time time,
  close_time time,
  monday boolean not null default false,
  tuesday boolean not null default false,
  wednesday boolean not null default false,
  thursday boolean not null default false,
  friday boolean not null default false,
  saturday boolean not null default false,
  sunday boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
alter table public.hours_of_operation enable row level security;

-- Public read — this is what renders on the Contact/hours screen for everyone
create policy "locations_select_all" on public.locations
  for select using (true);
create policy "hours_of_operation_select_all" on public.hours_of_operation
  for select using (true);

-- Admin-only write, same pattern as content_blocks
create policy "locations_write_admin" on public.locations
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "hours_of_operation_write_admin" on public.hours_of_operation
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
