-- Accounts & roles
-- Replaces the old hand-rolled admin login in backend/index.js (in-memory,
-- plaintext ADMIN_CREDENTIALS) with Supabase's built-in auth. One `profiles`
-- table extends every signed-up user — regular or admin — with a role, so
-- the same sign-up/login flow works for both; `role` just decides what they
-- can see and edit afterward.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Admins can read every profile (needed for the admin dashboard's user count)
create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- People can update their own profile fields (username, etc.) — not their role
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up through Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- There's no "make me an admin" button yet — promote someone by hand:
-- update public.profiles set role = 'admin' where email = 'someone@example.com';
