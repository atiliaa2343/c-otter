-- Optional: loads the two placeholder screening questions that used to be
-- hardcoded in components/HealthQuestionnaire.tsx, so there's something to
-- test with. Run migration_screening_disqualifies.sql first. Does nothing if
-- a screening questionnaire is already active.
--
-- If this fails on screening_questions.type, a check constraint expects a
-- different value than 'single_choice' — use one it allows. The app treats
-- any question that has options as multiple choice, whatever its type says.

do $$
declare
  q_id uuid;
  age_id uuid;
  device_id uuid;
begin
  if exists (select 1 from public.screening_questionnaires where is_active) then
    return;
  end if;

  insert into public.screening_questionnaires (title, description, is_active)
  values (
    'Health data screening',
    'First, a couple of quick questions to check whether this questionnaire applies to you.',
    true
  )
  returning id into q_id;

  insert into public.screening_questions (questionnaire_id, prompt, type, is_required, sort_order, is_active)
  values (q_id, 'Are you 18 years of age or older?', 'single_choice', true, 1, true)
  returning id into age_id;

  insert into public.screening_questions (questionnaire_id, prompt, type, is_required, sort_order, is_active)
  values (q_id, 'Do you wear a smartwatch or fitness tracker on most days?', 'single_choice', true, 2, true)
  returning id into device_id;

  insert into public.screening_question_options (question_id, label, sort_order, is_active, disqualifies)
  values
    (age_id, 'Yes', 1, true, false),
    (age_id, 'No', 2, true, true),
    (device_id, 'Yes', 1, true, false),
    (device_id, 'No', 2, true, true);
end $$;
