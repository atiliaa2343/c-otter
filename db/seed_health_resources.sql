-- Seed data for health_resources and health_apps.
-- Run schema_health_resources.sql first, and make sure the Cannabis and
-- Opioids rows exist in health_topics (seed_lists.sql).
--
-- Copied from the lists that used to be hardcoded in app/health/[domain].tsx.
-- Re-runnable: each insert skips rows whose name/title already exists for
-- that topic. image_url is left empty so the page uses the logos bundled
-- with the app; an admin can upload a replacement from the admin panel.

-- CANNABIS RESOURCES
insert into public.health_resources (topic_id, name, address, phone, description, sort_order)
select t.id, v.name, v.address, v.phone, v.description, v.sort_order
from (values
  ('SMART Recovery meetings', null, null, 'Self-Management and Recovery Training offers an alternative to 12-step programs focusing on self-empowerment and self-reliance. Meetings help participants develop skills to manage cravings, build motivation, and create balanced lifestyles. We offer this as part of our treatment programs at FRC.', 0),
  ('The Coleman Institute for Addiction Medicine', '204 N Hamilton St Suite B, Richmond, VA 23221', '(804) 201-9218', 'Provides outpatient detox and addiction medicine services.', 1),
  ('Skypoint Recovery Addiction & Mental Health Treatment', '3751 Nine Mile Rd, Richmond, VA 23223', '(804) 492-7263', 'Offers addiction and mental health treatment, with 24/7 availability.', 2),
  ('New Season Treatment Center – Richmond', '3021 Mechanicsville Tpke, Richmond, VA 23223', '(877) 284-7074', 'An addiction treatment center with early-morning hours on weekdays.', 3),
  ('REAL LIFE', '1111 N 25th St, Richmond, VA 23223', '(804) 406-4111', 'Listed as an addiction treatment center.', 4)
) as v(name, address, phone, description, sort_order)
join public.health_topics t on t.title = 'Cannabis'
where not exists (
  select 1 from public.health_resources r where r.topic_id = t.id and r.name = v.name
);

-- OPIOIDS RESOURCES
insert into public.health_resources (topic_id, name, address, phone, description, sort_order)
select t.id, v.name, v.address, v.phone, v.description, v.sort_order
from (values
  ('Crossroads of Petersburg, VA (OBOT) Suboxone Clinic', '10531 South Crater Road, Petersburg, VA 23805', null, 'Offers outpatient addiction treatment, medication-based recovery support, and individual therapy. The call center is open 24/7/365.', 0),
  ('Foundations Health Petersburg', '2623 Park Avenue, Petersburg, VA 23805', null, 'Provides outpatient medication-assisted treatment and counseling for opioid use disorder, plus aftercare planning and recovery support referrals.', 1),
  ('Spero Health Petersburg', 'Petersburg, VA', null, 'An outpatient option with Medicaid accepted in rehab directories. Focuses on Suboxone/MAT and recovery support services.', 2),
  ('District 19 Community Services Board', '20 West Bank Street Suite 6, Petersburg, VA 23803', null, 'Offers outpatient substance use treatment and is listed with Medicaid coverage in rehab directories.', 3),
  ('Greater Reach Community Services Board', 'Petersburg and nearby areas', null, 'Serves Petersburg and nearby areas with substance use treatment, counseling, and drug court services.', 4)
) as v(name, address, phone, description, sort_order)
join public.health_topics t on t.title = 'Opioids'
where not exists (
  select 1 from public.health_resources r where r.topic_id = t.id and r.name = v.name
);

-- CANNABIS APPS
insert into public.health_apps (topic_id, title, description, features, sort_order)
select t.id, v.title, v.description, v.features, v.sort_order
from (values
  ('rTribe', 'rTribe is a peer-support recovery app that lets users connect anonymously with others and track progress. It is designed to make support more accessible during difficult moments.', array['Anonymous peer support', 'Progress tracking', 'Accessible during difficult moments']::text[], 0),
  ('Came to Believe in Sobriety', 'Came to Believe in Sobriety is a recovery app with goal-setting and milestone tracking. It uses a friendly interface to make the recovery process feel more approachable.', array['Goal setting', 'Milestone tracking', 'Friendly interface']::text[], 1),
  ('Quitzilla', 'Quitzilla is a habit and sobriety tracker that can support people trying to stop opioid use by helping them build healthier routines. It is not opioid-specific, but it can still be useful for recovery habits and motivation.', array['Habit tracking', 'Sobriety tracking', 'Healthy routine building']::text[], 2),
  ('Grounded', 'Grounded is designed for people trying to quit or cut back on weed, especially if they want a simple tracker and craving support. It focuses on helping users stay weed-free and manage cannabis withdrawal.', array['Simple tracker', 'Craving support', 'Withdrawal management']::text[], 3),
  ('Lucid', 'Lucid is a cannabis recovery app that helps people quit or reduce use with coaching and symptom tracking. It emphasizes structure, recovery milestones, and tools for handling cravings.', array['Coaching', 'Symptom tracking', 'Recovery milestones', 'Craving management tools']::text[], 4)
) as v(title, description, features, sort_order)
join public.health_topics t on t.title = 'Cannabis'
where not exists (
  select 1 from public.health_apps a where a.topic_id = t.id and a.title = v.title
);

-- OPIOIDS APPS
insert into public.health_apps (topic_id, title, description, features, sort_order)
select t.id, v.title, v.description, v.features, v.sort_order
from (values
  ('Pear reSET-O', 'Pear reSET-O is a prescription digital therapeutic made specifically for opioid use disorder and used alongside outpatient treatment. It delivers a structured 12-week cognitive behavioral therapy program with weekly check-ins.', array['FDA-approved for opioid use disorder', 'Prescription required', 'CBT-based lessons and activities', 'Designed to support people already in treatment']::text[], 0),
  ('WEconnect', 'WEconnect is a recovery support app that helps people stay engaged with treatment goals and daily recovery routines. It is often used with treatment programs, but it can also support people outside formal care.', array['Sobriety and meeting attendance tracking', 'Daily goal setting and progress tracking', 'Virtual meetings and peer support', 'Special-topic and community-specific meetings']::text[], 1),
  ('SoberTool', 'SoberTool is built to help people handle cravings in the moment and avoid relapse. It focuses on immediate support when urges hit.', array['Craving-management tools', 'Relapse-prevention support', 'Sobriety tracking', 'Motivational messages and rewards']::text[], 2),
  ('Affect', 'Affect is an all-in-one recovery app that offers a broader addiction recovery program, including support for opioids and other substances. It aims to combine treatment tools, habit-building, and mental health support in one place.', array['Structured recovery program', 'Supports opioids, alcohol, cannabis, stimulants, and prescription drugs', 'Rewards for progress', 'Mental health and healthy-habit support']::text[], 3),
  ('Nomo', 'Nomo is a sobriety-tracking app that helps users stay accountable to recovery goals. It is simple, flexible, and useful for building daily consistency.', array['Custom sobriety clocks', 'Mini exercises to stay focused', 'Encouragement and reminders', 'Search for accountability partners']::text[], 4)
) as v(title, description, features, sort_order)
join public.health_topics t on t.title = 'Opioids'
where not exists (
  select 1 from public.health_apps a where a.topic_id = t.id and a.title = v.title
);
