-- Matches the current hardcoded arrays in Faculty.tsx / Health.tsx /
-- HomePage.tsx exactly, so this table's content agrees with what's on
-- screen. Safe to run more than once (checks for existing rows by name/title).

insert into public.faculty_members (name, title, email, phone, image_key, is_director, sort_order)
select * from (values
  ('Larry Keen II, Ph.D', 'Associate Professor in Psychology; PNIRD Lab Director', 'LKeen@vsu.edu', '(804) 524-5523', 'Larry.jpeg', true, 1),
  ('Kimberly Lawrence, Ph.D.', 'Associate Professor in Psychology', 'KLawrence@vsu.edu', '(804) 524-5447', 'Kimberly.jpeg', false, 2),
  ('Arlener D. Turner, Ph.D', 'Associate Professor, Department of Psychiatry and Behavioral Sciences, University of Miami', 'adanielleturner@gmail.com', '(773) 339-1797', 'Arlener.png', false, 3),
  ('Alexis Morris, M.S.', 'Graduate Research Assistant', null, null, 'Alexis.jpeg', false, 4),
  ('Diamond Adams', 'Graduate Research Assistant', null, null, 'Diamond.jpeg', false, 5)
) as v(name, title, email, phone, image_key, is_director, sort_order)
where not exists (select 1 from public.faculty_members f where f.name = v.name);

insert into public.health_topics (title, description, color, image_key, sort_order)
select * from (values
  ('Cannabis', 'Resources and support for cannabis use', '#8B7FE8', 'cannabis.png', 1),
  ('Opioids', 'Resources and support for opioid use', '#FFB088', 'drugs.png', 2)
) as v(title, description, color, image_key, sort_order)
where not exists (select 1 from public.health_topics h where h.title = v.title);

insert into public.home_events (title, description, icon, color, sort_order)
select * from (values
  ('Upcoming Blood Drive', 'Hunter McDaniel, March 18th 2pm-4pm', 'water', '#ef4444', 1),
  ('Mental Health Workshop', 'Student Center, March 22nd 1pm-3pm', 'happy', '#6366f1', 2),
  ('Career Fair', 'Gymnasium, March 25th 10am-2pm', 'briefcase', '#f59e0b', 3),
  ('Campus Safety Alert', 'Be aware of construction near Lot B', 'alert-circle', '#eab308', 4)
) as v(title, description, icon, color, sort_order)
where not exists (select 1 from public.home_events e where e.title = v.title);
