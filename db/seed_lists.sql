-- Seed data for list tables
-- Run schema_lists.sql first.
-- This seeds the exact data currently hardcoded in each component.
--
-- Re-runnable: each insert is guarded so a second run updates the existing
-- row instead of duplicating it. (These tables have no natural unique key,
-- so `on conflict do nothing` would silently insert duplicates every time.)

-- FACULTY MEMBERS (from components/Faculty.tsx)
insert into public.faculty_members (name, title, email, phone, image_url, is_director, sort_order)
select v.name, v.title, v.email, v.phone, v.image_url, v.is_director, v.sort_order
from (values
  ('Larry Keen II, Ph.D', E'Associate Professor in Psychology;\nPNIRD Lab Director', 'LKeen@vsu.edu', '(804) 524-5523', null::text, true, 0),
  ('Kimberly Lawrence, Ph.D.', 'Associate Professor in Psychology', 'KLawrence@vsu.edu', '(804) 524-5447', null::text, false, 1),
  ('Arlener D. Turner, Ph.D', E'Associate Professor\nDepartment of Psychiatry and Behavioral Sciences\nUniversity of Miami', 'adanielleturner@gmail.com', '(773) 339-1797', null::text, false, 2),
  ('Alexis Morris, M.S.', 'Graduate Research Assistant', '', '', null::text, false, 3),
  ('Diamond Adams', 'Graduate Research Assistant', '', '', null::text, false, 4)
) as v(name, title, email, phone, image_url, is_director, sort_order)
where not exists (
  select 1 from public.faculty_members m where m.name = v.name
);

-- HEALTH TOPICS (from components/Health.tsx)
insert into public.health_topics (title, description, color, image_url, icon, sort_order)
select v.title, v.description, v.color, v.image_url, v.icon, v.sort_order
from (values
  ('Cannabis', 'Resources and support for cannabis use', '#8B7FE8', null::text, null::text, 0),
  ('Opioids', 'Resources and support for opioid use', '#FFB088', null::text, null::text, 1)
) as v(title, description, color, image_url, icon, sort_order)
where not exists (
  select 1 from public.health_topics t where t.title = v.title
);

-- HOME EVENTS (from components/HomePage.tsx)
insert into public.home_events (title, description, icon, color, sort_order)
select v.title, v.description, v.icon, v.color, v.sort_order
from (values
  ('Upcoming Blood Drive', 'Hunter McDaniel, March 18th 2pm-4pm', 'water', '#ef4444', 0),
  ('Mental Health Workshop', 'Student Center, March 22nd 1pm-3pm', 'happy', '#6366f1', 1),
  ('Career Fair', 'Gymnasium, March 25th 10am-2pm', 'briefcase', '#f59e0b', 2),
  ('Campus Safety Alert', 'Be aware of construction near Lot B', 'alert-circle', '#eab308', 3)
) as v(title, description, icon, color, sort_order)
where not exists (
  select 1 from public.home_events e where e.title = v.title
);