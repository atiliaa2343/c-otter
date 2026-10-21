-- Screening questionnaire
-- Run schema_accounts.sql first — this references public.profiles.
--
-- Admins write the questions (and the answer choices for multiple-choice
-- ones) from the admin panel; users answer them on the health tab; admins
-- then filter users by their answers and save the people they pick as a
-- named group ("cohort").
--
-- Answers are stored one row per answer — not as one jsonb blob like
-- questionnaire_responses — so "everyone who picked option X on question Y"
-- is a plain indexed query instead of digging through JSON.

-- ---------------------------------------------------------------------------
-- Admin check
-- ---------------------------------------------------------------------------
-- A policy on a table that selects from profiles can hit "infinite recursion
-- detected in policy" when that table is profiles itself. A security
-- definer function reads profiles without going back through RLS, so every
-- policy below calls this instead of repeating the exists(...) subquery.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Questions (admin-authored)
-- ---------------------------------------------------------------------------

-- One row = one version of the screening questionnaire. Only one can be
-- active (shown on the health tab) at a time.
create table if not exists public.screening_questionnaires (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists screening_questionnaires_one_active
  on public.screening_questionnaires (is_active) where is_active;

create table if not exists public.screening_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.screening_questionnaires(id) on delete cascade,
  prompt text not null,
  help_text text,                  -- optional smaller text under the prompt
  type text not null check (type in ('single_choice', 'multi_choice', 'text', 'number')),
  is_required boolean not null default true,
  sort_order int not null default 0,
  -- Archive instead of delete once anyone has answered, so old answers
  -- still point at the question they were answering.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists screening_questions_questionnaire_idx
  on public.screening_questions (questionnaire_id, sort_order);

-- Answer choices for single_choice / multi_choice questions. A yes/no
-- question is just a single_choice question with options "Yes" and "No".
create table if not exists public.screening_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.screening_questions(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index if not exists screening_question_options_question_idx
  on public.screening_question_options (question_id, sort_order);

-- ---------------------------------------------------------------------------
-- Responses (user-submitted)
-- ---------------------------------------------------------------------------

-- One row = one time a user submitted the questionnaire. A user can
-- resubmit; the admin filter uses each user's most recent submission.
create table if not exists public.screening_submissions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.screening_questionnaires(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create index if not exists screening_submissions_user_idx
  on public.screening_submissions (questionnaire_id, user_id, submitted_at desc);

-- One row = one answer. Exactly one of option_id / text_value / number_value
-- is filled in, matching the question's type. A multi_choice answer with
-- three boxes ticked is three rows.
create table if not exists public.screening_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.screening_submissions(id) on delete cascade,
  question_id uuid not null references public.screening_questions(id) on delete restrict,
  option_id uuid references public.screening_question_options(id) on delete restrict,
  text_value text,
  number_value numeric,
  check (num_nonnulls(option_id, text_value, number_value) = 1)
);

create index if not exists screening_answers_submission_idx on public.screening_answers (submission_id);
create index if not exists screening_answers_question_option_idx on public.screening_answers (question_id, option_id);

-- ---------------------------------------------------------------------------
-- Cohorts (admin selections)
-- ---------------------------------------------------------------------------

-- A named group of users an admin picked, plus the filter that produced
-- the list (kept for reference — membership doesn't change if answers do).
create table if not exists public.screening_cohorts (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.screening_questionnaires(id) on delete cascade,
  name text not null,
  notes text,
  criteria jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.screening_cohort_members (
  cohort_id uuid not null references public.screening_cohorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'selected'
    check (status in ('selected', 'contacted', 'enrolled', 'declined')),
  added_by uuid references public.profiles(id),
  added_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.screening_questionnaires enable row level security;
alter table public.screening_questions enable row level security;
alter table public.screening_question_options enable row level security;
alter table public.screening_submissions enable row level security;
alter table public.screening_answers enable row level security;
alter table public.screening_cohorts enable row level security;
alter table public.screening_cohort_members enable row level security;

-- Signed-in users can read the questions so the health tab can render them;
-- admins can do everything.
create policy "screening_questionnaires_select_signed_in" on public.screening_questionnaires
  for select to authenticated using (true);
create policy "screening_questionnaires_admin" on public.screening_questionnaires
  for all using (public.is_admin()) with check (public.is_admin());

create policy "screening_questions_select_signed_in" on public.screening_questions
  for select to authenticated using (true);
create policy "screening_questions_admin" on public.screening_questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "screening_question_options_select_signed_in" on public.screening_question_options
  for select to authenticated using (true);
create policy "screening_question_options_admin" on public.screening_question_options
  for all using (public.is_admin()) with check (public.is_admin());

-- Users can create and read their own submissions — not edit or delete
-- them, so what an admin filtered on can't change underneath a cohort.
create policy "screening_submissions_insert_own" on public.screening_submissions
  for insert with check (auth.uid() = user_id);
create policy "screening_submissions_select_own" on public.screening_submissions
  for select using (auth.uid() = user_id);
create policy "screening_submissions_admin_select" on public.screening_submissions
  for select using (public.is_admin());

create policy "screening_answers_insert_own" on public.screening_answers
  for insert with check (
    exists (select 1 from public.screening_submissions s
            where s.id = submission_id and s.user_id = auth.uid())
  );
create policy "screening_answers_select_own" on public.screening_answers
  for select using (
    exists (select 1 from public.screening_submissions s
            where s.id = submission_id and s.user_id = auth.uid())
  );
create policy "screening_answers_admin_select" on public.screening_answers
  for select using (public.is_admin());

-- Cohorts are admin-only; users never see who was selected.
create policy "screening_cohorts_admin" on public.screening_cohorts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "screening_cohort_members_admin" on public.screening_cohort_members
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin filter
-- ---------------------------------------------------------------------------
-- Returns users whose most recent submission matches EVERY criterion.
-- p_criteria is a jsonb array like:
--   [
--     { "question_id": "...", "op": "any_of",   "option_ids": ["...", "..."] },
--     { "question_id": "...", "op": "gte",      "value": 18 },
--     { "question_id": "...", "op": "lte",      "value": 65 },
--     { "question_id": "...", "op": "contains", "value": "asthma" }
--   ]
-- An empty array returns everyone who submitted.
--
-- security invoker = RLS still applies, so a non-admin calling it only ever
-- sees themselves.
--
-- Call from the app:
--   supabase.rpc('screening_match_users', { p_questionnaire_id, p_criteria })
create or replace function public.screening_match_users(p_questionnaire_id uuid, p_criteria jsonb)
returns table (user_id uuid, email text, username text, submission_id uuid, submitted_at timestamptz)
language sql stable security invoker set search_path = public
as $$
  with latest as (
    select distinct on (s.user_id) s.id, s.user_id, s.submitted_at
    from screening_submissions s
    where s.questionnaire_id = p_questionnaire_id
    order by s.user_id, s.submitted_at desc
  )
  select l.user_id, p.email, p.username, l.id, l.submitted_at
  from latest l
  join profiles p on p.id = l.user_id
  where not exists (
    select 1
    from jsonb_array_elements(p_criteria) c
    where not exists (
      select 1
      from screening_answers a
      where a.submission_id = l.id
        and a.question_id = (c->>'question_id')::uuid
        and case c->>'op'
          when 'any_of'   then a.option_id in (select x::uuid from jsonb_array_elements_text(c->'option_ids') x)
          when 'gte'      then a.number_value >= (c->>'value')::numeric
          when 'lte'      then a.number_value <= (c->>'value')::numeric
          when 'contains' then a.text_value ilike '%' || (c->>'value') || '%'
          else false
        end
    )
  )
  order by l.submitted_at desc;
$$;
