import { supabase } from '@/db/supabase';
import type { Json, Tables } from '@/db/database.types';
import type { QuestionnaireKind } from '@/services/questionnaire';

// Admin-side calls for the screening and daily questionnaires: editing
// questions, filtering people by their screening answers, and saving the
// people an admin picks as cohorts. The user-side reads/writes (loading the questions on the
// health tab, submitting answers) live in services/questionnaire.ts.
//
// Everything here relies on the RLS in db/schema_screening.sql — a
// non-admin gets errors (or only their own rows) back, never other people's
// answers.

export type QuestionType = 'single_choice' | 'multi_choice' | 'text' | 'number';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Single choice',
  multi_choice: 'Multiple choice',
  text: 'Text',
  number: 'Number',
};

export const isChoiceType = (type: string) => type === 'single_choice' || type === 'multi_choice';

export type Questionnaire = Pick<
  Tables<'screening_questionnaires'>,
  'id' | 'title' | 'description' | 'is_active'
>;

export type QuestionOption = Pick<
  Tables<'screening_question_options'>,
  'id' | 'label' | 'sort_order' | 'is_active' | 'disqualifies'
>;

export interface AdminQuestion {
  id: string;
  prompt: string;
  help_text: string | null;
  placeholder: string | null;
  type: QuestionType;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  /** Every option, archived ones included, in sort order. */
  options: QuestionOption[];
}

/** One filter condition — the shape screening_match_users expects. */
export type Criterion =
  | { question_id: string; op: 'any_of'; option_ids: string[] }
  | { question_id: string; op: 'gte' | 'lte'; value: number }
  | { question_id: string; op: 'contains'; value: string };

export interface MatchedUser {
  user_id: string;
  email: string;
  username: string | null;
  submission_id: string;
  submitted_at: string;
}

export interface SubmissionAnswer {
  question_id: string;
  prompt: string;
  question_archived: boolean;
  sort_order: number;
  /** Display text — option labels joined for a multi-choice answer. */
  value: string;
}

export const COHORT_STATUSES = ['selected', 'contacted', 'enrolled', 'declined'] as const;
export type CohortStatus = (typeof COHORT_STATUSES)[number];

export interface Cohort {
  id: string;
  name: string;
  notes: string | null;
  criteria: Criterion[];
  created_at: string;
  member_count: number;
}

export interface CohortMember {
  user_id: string;
  email: string;
  username: string | null;
  status: CohortStatus;
  added_at: string;
}

/** Postgres foreign_key_violation — raised by `on delete restrict` on screening_answers. */
const FK_VIOLATION = '23503';

// ---------------------------------------------------------------------------
// Questionnaire
// ---------------------------------------------------------------------------

export async function getActiveQuestionnaire(kind: QuestionnaireKind): Promise<Questionnaire | null> {
  const { data, error } = await supabase
    .from('screening_questionnaires')
    .select('id, title, description, is_active')
    .eq('kind', kind)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const NEW_QUESTIONNAIRE: Record<QuestionnaireKind, { title: string; description: string }> = {
  screening: {
    title: 'Health data screening',
    description: 'A few quick questions to check whether this study applies to you.',
  },
  daily: {
    title: 'Daily health check-in',
    description: 'A few questions to help us interpret your wearable data accurately.',
  },
};

export async function createQuestionnaire(adminId: string, kind: QuestionnaireKind): Promise<Questionnaire> {
  const { data, error } = await supabase
    .from('screening_questionnaires')
    .insert({
      ...NEW_QUESTIONNAIRE[kind],
      kind,
      is_active: true,
      created_by: adminId,
    })
    .select('id, title, description, is_active')
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** Every question in the questionnaire, archived ones included, with their options. */
export async function listQuestions(questionnaireId: string): Promise<AdminQuestion[]> {
  const { data: questions, error } = await supabase
    .from('screening_questions')
    .select('id, prompt, help_text, placeholder, type, is_required, sort_order, is_active')
    .eq('questionnaire_id', questionnaireId)
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  if (!questions.length) return [];

  const { data: options, error: optionsError } = await supabase
    .from('screening_question_options')
    .select('id, question_id, label, sort_order, is_active, disqualifies')
    .in('question_id', questions.map((q) => q.id))
    .order('sort_order');
  if (optionsError) throw optionsError;

  return questions.map((q) => ({
    ...q,
    type: q.type as QuestionType,
    options: options
      .filter((o) => o.question_id === q.id)
      .map(({ question_id: _questionId, ...o }) => o),
  }));
}

export async function questionHasAnswers(questionId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('screening_answers')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export interface QuestionDraft {
  prompt: string;
  help_text: string;
  /** Hint inside the answer box — only used by text and number questions. */
  placeholder: string;
  type: QuestionType;
  is_required: boolean;
  /** Options as they should end up, in display order. `id` is set for ones that already exist. */
  options: { id?: string; label: string; is_active: boolean; disqualifies: boolean }[];
  /** Existing option ids the admin removed in the editor. */
  removedOptionIds: string[];
}

/**
 * Writes the question, then its options. A removed option is deleted if no
 * one has picked it yet, and archived otherwise — the database's
 * `on delete restrict` is what decides, so this can't race with a new answer.
 */
export async function saveQuestion(
  questionnaireId: string,
  draft: QuestionDraft,
  existingId: string | null,
  sortOrder: number,
): Promise<void> {
  const fields = {
    prompt: draft.prompt.trim(),
    help_text: draft.help_text.trim() || null,
    placeholder: isChoiceType(draft.type) ? null : draft.placeholder.trim() || null,
    type: draft.type,
    is_required: draft.is_required,
  };

  let questionId = existingId;
  if (questionId) {
    const { error } = await supabase
      .from('screening_questions')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', questionId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('screening_questions')
      .insert({ ...fields, questionnaire_id: questionnaireId, sort_order: sortOrder })
      .select('id')
      .single();
    if (error) throw error;
    questionId = data.id;
  }

  // A text/number question has no options — anything left over from when it
  // was a choice question is removed the same way as a deleted option.
  const keep = isChoiceType(draft.type) ? draft.options : [];
  const removed = [
    ...draft.removedOptionIds,
    ...(isChoiceType(draft.type) ? [] : draft.options.flatMap((o) => (o.id ? [o.id] : []))),
  ];

  for (const [index, option] of keep.entries()) {
    const row = {
      label: option.label.trim(),
      sort_order: index,
      is_active: option.is_active,
      disqualifies: option.disqualifies,
    };
    const { error } = option.id
      ? await supabase.from('screening_question_options').update(row).eq('id', option.id)
      : await supabase.from('screening_question_options').insert({ ...row, question_id: questionId });
    if (error) throw error;
  }

  for (const optionId of removed) {
    await deleteOrArchiveOption(optionId);
  }
}

async function deleteOrArchiveOption(optionId: string): Promise<void> {
  const { error } = await supabase.from('screening_question_options').delete().eq('id', optionId);
  if (!error) return;
  if (error.code !== FK_VIOLATION) throw error;
  const { error: archiveError } = await supabase
    .from('screening_question_options')
    .update({ is_active: false })
    .eq('id', optionId);
  if (archiveError) throw archiveError;
}

export async function setQuestionActive(questionId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('screening_questions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', questionId);
  if (error) throw error;
}

/** Only works for a question nobody has answered — otherwise archive it. */
export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from('screening_questions').delete().eq('id', questionId);
  if (error) throw error;
}

/**
 * Saves `orderedIds` as the new order. Renumbers the whole list rather than
 * swapping two values, since older rows can share a sort_order.
 */
export async function reorderQuestions(orderedIds: string[]): Promise<void> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from('screening_questions')
      .update({ sort_order: index })
      .eq('id', id);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Filtering & answers
// ---------------------------------------------------------------------------

export async function matchUsers(
  questionnaireId: string,
  criteria: Criterion[],
): Promise<MatchedUser[]> {
  const { data, error } = await supabase.rpc('screening_match_users', {
    p_questionnaire_id: questionnaireId,
    p_criteria: criteria as unknown as Json,
  });
  if (error) throw error;
  return data ?? [];
}

/** One submission's answers in question order, archived questions included. */
export async function getSubmissionAnswers(submissionId: string): Promise<SubmissionAnswer[]> {
  const { data: answers, error } = await supabase
    .from('screening_answers')
    .select('question_id, option_id, text_value, number_value')
    .eq('submission_id', submissionId);
  if (error) throw error;
  if (!answers.length) return [];

  const questionIds = [...new Set(answers.map((a) => a.question_id))];
  const optionIds = answers.flatMap((a) => (a.option_id ? [a.option_id] : []));

  const [questionsResult, optionsResult] = await Promise.all([
    supabase
      .from('screening_questions')
      .select('id, prompt, sort_order, is_active')
      .in('id', questionIds),
    optionIds.length
      ? supabase
          .from('screening_question_options')
          .select('id, label, sort_order')
          .in('id', optionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (questionsResult.error) throw questionsResult.error;
  if (optionsResult.error) throw optionsResult.error;
  const options = optionsResult.data ?? [];

  return questionsResult.data
    .map((q) => {
      const rows = answers.filter((a) => a.question_id === q.id);
      const labels = rows
        .flatMap((a) => options.filter((o) => o.id === a.option_id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => o.label);
      const plain = rows.flatMap((a) =>
        a.text_value != null ? [a.text_value] : a.number_value != null ? [String(a.number_value)] : [],
      );
      return {
        question_id: q.id,
        prompt: q.prompt,
        question_archived: !q.is_active,
        sort_order: q.sort_order,
        value: [...labels, ...plain].join(', '),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Human-readable version of a condition, for the filter and cohort chips. */
export function describeCriterion(criterion: Criterion, questions: AdminQuestion[]): string {
  const question = questions.find((q) => q.id === criterion.question_id);
  const prompt = question?.prompt ?? 'Deleted question';
  switch (criterion.op) {
    case 'any_of': {
      const labels = criterion.option_ids.map(
        (id) => question?.options.find((o) => o.id === id)?.label ?? '?',
      );
      return `${prompt}: ${labels.join(' or ')}`;
    }
    case 'gte':
      return `${prompt} ≥ ${criterion.value}`;
    case 'lte':
      return `${prompt} ≤ ${criterion.value}`;
    case 'contains':
      return `${prompt} contains "${criterion.value}"`;
  }
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export async function listCohorts(questionnaireId: string): Promise<Cohort[]> {
  const { data: cohorts, error } = await supabase
    .from('screening_cohorts')
    .select('id, name, notes, criteria, created_at')
    .eq('questionnaire_id', questionnaireId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!cohorts.length) return [];

  const { data: members, error: membersError } = await supabase
    .from('screening_cohort_members')
    .select('cohort_id')
    .in('cohort_id', cohorts.map((c) => c.id));
  if (membersError) throw membersError;

  return cohorts.map((c) => ({
    ...c,
    criteria: (Array.isArray(c.criteria) ? c.criteria : []) as unknown as Criterion[],
    member_count: members.filter((m) => m.cohort_id === c.id).length,
  }));
}

export async function createCohort(
  questionnaireId: string,
  name: string,
  notes: string,
  criteria: Criterion[],
  adminId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('screening_cohorts')
    .insert({
      questionnaire_id: questionnaireId,
      name: name.trim(),
      notes: notes.trim() || null,
      criteria: criteria as unknown as Json,
      created_by: adminId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteCohort(cohortId: string): Promise<void> {
  const { error } = await supabase.from('screening_cohorts').delete().eq('id', cohortId);
  if (error) throw error;
}

/** Re-adding someone already in the cohort is a no-op, not an error. */
export async function addCohortMembers(
  cohortId: string,
  userIds: string[],
  adminId: string,
): Promise<void> {
  const { error } = await supabase.from('screening_cohort_members').upsert(
    userIds.map((user_id) => ({ cohort_id: cohortId, user_id, added_by: adminId })),
    { onConflict: 'cohort_id,user_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function listCohortMembers(cohortId: string): Promise<CohortMember[]> {
  const { data: members, error } = await supabase
    .from('screening_cohort_members')
    .select('user_id, status, added_at')
    .eq('cohort_id', cohortId)
    .order('added_at');
  if (error) throw error;
  if (!members.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, username')
    .in('id', members.map((m) => m.user_id));
  if (profilesError) throw profilesError;

  return members.map((m) => {
    const profile = profiles.find((p) => p.id === m.user_id);
    return {
      user_id: m.user_id,
      email: profile?.email ?? 'Unknown user',
      username: profile?.username ?? null,
      status: m.status as CohortStatus,
      added_at: m.added_at,
    };
  });
}

export async function setCohortMemberStatus(
  cohortId: string,
  userId: string,
  status: CohortStatus,
): Promise<void> {
  const { error } = await supabase
    .from('screening_cohort_members')
    .update({ status })
    .eq('cohort_id', cohortId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeCohortMember(cohortId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('screening_cohort_members')
    .delete()
    .eq('cohort_id', cohortId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Active questions in the active screening questionnaire — the number shown on the dashboard's stats tab. */
export async function countActiveQuestions(): Promise<number> {
  const questionnaire = await getActiveQuestionnaire('screening');
  if (!questionnaire) return 0;

  const { count, error } = await supabase
    .from('screening_questions')
    .select('id', { count: 'exact', head: true })
    .eq('questionnaire_id', questionnaire.id)
    .eq('is_active', true);
  if (error) throw error;
  return count ?? 0;
}
