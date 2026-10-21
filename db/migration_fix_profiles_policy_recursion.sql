-- Fix "infinite recursion detected in policy for relation profiles"
--
-- profiles_select_admin checked admin status by selecting from profiles,
-- which re-applies profiles' own policies to that select, forever. Every
-- admin "write" policy on other tables (health_topics, home_events, ...) is
-- declared `for all`, so it also runs on plain reads — meaning any read of
-- those tables hit profiles and failed, and the app fell back to its
-- built-in lists.
--
-- is_admin() is security definer, so it reads profiles without going back
-- through RLS. Safe to run more than once.

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "profiles_select_admin" on public.profiles;

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());
