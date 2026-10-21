-- Screening pass/fail
-- The screening_* tables (built directly in the Supabase dashboard, not from a
-- file in this folder) store questions, options and answers, but had no way
-- to say which answer screens someone out. This adds that flag per option.
--
-- Defaults to false, so nothing screens anyone out until an admin marks an
-- option — e.g. the "No" option on "Are you 18 or older?":
--   update public.screening_question_options set disqualifies = true where id = '...';
--
-- The app works out pass/fail from this flag (services/questionnaire.ts), both
-- when someone submits and when it checks a past submission, so changing a
-- flag later also changes the outcome for people who already answered.

alter table public.screening_question_options
  add column if not exists disqualifies boolean not null default false;
