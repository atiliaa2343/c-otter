-- Questionnaire kinds
-- The screening_* tables now hold two kinds of questionnaire: the one-time
-- screening someone passes first, and the daily questionnaire they fill out
-- once a day after passing it. The tables keep their screening_ names; kind
-- says which is which.
--
-- Run this before seed_daily_questionnaire.sql. Existing questionnaires all
-- become 'screening', which is what they already are. Safe to run more than
-- once.

alter table public.screening_questionnaires
  add column if not exists kind text not null default 'screening'
  check (kind in ('screening', 'daily'));

-- One active questionnaire per kind instead of one overall, so a daily
-- questionnaire can be active alongside the screening one. The tables were
-- built in the dashboard, so the old one-active index may not be named the
-- way schema_screening.sql names it — this drops any unique index on the
-- table that covers is_active but not kind.
do $$
declare
  idx record;
begin
  for idx in
    select i.indexname
    from pg_indexes i
    where i.schemaname = 'public'
      and i.tablename = 'screening_questionnaires'
      and i.indexdef ilike 'create unique index%'
      and i.indexdef ilike '%is_active%'
      and i.indexdef not ilike '%kind%'
  loop
    execute format('drop index public.%I', idx.indexname);
  end loop;
end $$;

create unique index if not exists screening_questionnaires_one_active_per_kind
  on public.screening_questionnaires (kind) where is_active;

-- Hint shown inside the answer box of a text or number question.
alter table public.screening_questions
  add column if not exists placeholder text;

-- The day (on the person's phone) a daily submission counts for. Left empty
-- for screening submissions. Not unique: a submission whose answers failed
-- to save shouldn't stop the person retrying, so the app decides "already
-- done today" by looking for a submission that has answers.
alter table public.screening_submissions
  add column if not exists submitted_for date;

create index if not exists screening_submissions_daily_idx
  on public.screening_submissions (questionnaire_id, user_id, submitted_for)
  where submitted_for is not null;
