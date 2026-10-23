-- Loads the five intake questions that used to be hardcoded in
-- components/HealthQuestionnaire.tsx as the active daily questionnaire.
-- Run migration_questionnaire_kind.sql first. Does nothing if a daily
-- questionnaire is already active.

do $$
declare
  q_id uuid;
  sleep_id uuid;
  activity_id uuid;
begin
  if exists (select 1 from public.screening_questionnaires where kind = 'daily' and is_active) then
    return;
  end if;

  insert into public.screening_questionnaires (title, description, kind, is_active)
  values (
    'Daily health check-in',
    'A few questions to help us interpret your wearable data accurately.',
    'daily',
    true
  )
  returning id into q_id;

  insert into public.screening_questions (questionnaire_id, prompt, type, is_required, sort_order, is_active)
  values (q_id, 'On average, how many hours of sleep do you get per night?', 'single_choice', true, 1, true)
  returning id into sleep_id;

  insert into public.screening_questions (questionnaire_id, prompt, type, is_required, sort_order, is_active)
  values (q_id, 'How would you describe your typical activity level?', 'single_choice', true, 2, true)
  returning id into activity_id;

  -- The three free-text questions were optional in the app (only the choice
  -- questions blocked submitting), so they stay optional here.
  insert into public.screening_questions (questionnaire_id, prompt, placeholder, type, is_required, sort_order, is_active)
  values
    (q_id, 'Do you have any diagnosed conditions that affect your heart rate (e.g. arrhythmia, thyroid condition)? If so, please describe.',
      'e.g. None, or describe here', 'text', false, 3, true),
    (q_id, 'Are you currently taking any medications that could affect your heart rate or sleep?',
      'e.g. None, or list medications', 'text', false, 4, true),
    (q_id, 'Anything else you would like us to know about your health that would help us interpret your data accurately?',
      'Optional', 'text', false, 5, true);

  insert into public.screening_question_options (question_id, label, sort_order, is_active, disqualifies)
  values
    (sleep_id, 'Less than 5', 1, true, false),
    (sleep_id, '5–6', 2, true, false),
    (sleep_id, '7–8', 3, true, false),
    (sleep_id, 'More than 8', 4, true, false),
    (activity_id, 'Sedentary', 1, true, false),
    (activity_id, 'Lightly active', 2, true, false),
    (activity_id, 'Moderately active', 3, true, false),
    (activity_id, 'Very active', 4, true, false);
end $$;
