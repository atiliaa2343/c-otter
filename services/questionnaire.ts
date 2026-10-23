import { supabase } from '@/db/supabase';

export interface ScreeningOption {
  id: string;
  label: string;
  // Picking this option screens the person out.
  disqualifies: boolean;
}

export interface ScreeningQuestion {
  id: string;
  prompt: string;
  helpText: string | null;
  placeholder: string | null;
  // 'choice' whenever the question has options, whatever its stored type says;
  // otherwise 'number' or 'text'.
  kind: 'choice' | 'number' | 'text';
  isRequired: boolean;
  options: ScreeningOption[];
}

export interface Screening {
  questionnaireId: string;
  title: string;
  description: string | null;
  questions: ScreeningQuestion[];
}

// Keyed by question id. For a choice question the value is the option id.
export type ScreeningAnswers = Record<string, string>;

// 'screening' is answered once to see whether someone qualifies; 'daily' is
// answered once a day after they pass it.
export type QuestionnaireKind = 'screening' | 'daily';

// Today's date on the phone as YYYY-MM-DD, so "once a day" resets at the
// person's own midnight rather than the server's.
export function localDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Service class for the questionnaires someone fills out from the health
// data page. Split out of HealthService since it's plain Supabase
// reads/writes with nothing platform-specific about it.
//
// Both questionnaires live in the screening_* tables, so admins can edit the
// questions without an app release: screening comes first, then the daily
// questionnaire once a day for anyone who passed it.
export class QuestionnaireService {
  async isSignedIn(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session !== null;
  }

  // The active questionnaire of the given kind with its active questions and
  // options, or null when there's no session or none is active (in which
  // case that step is skipped). The screening tables are only readable when
  // signed in. Throws on a network/database error so the caller can retry
  // rather than skip a step.
  async loadQuestionnaire(kind: QuestionnaireKind): Promise<Screening | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('screening_questionnaires')
      .select('id, title, description')
      .eq('kind', kind)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (questionnaireError) throw questionnaireError;
    if (!questionnaire) return null;

    const { data: questions, error: questionsError } = await supabase
      .from('screening_questions')
      .select('id, prompt, help_text, placeholder, type, is_required')
      .eq('questionnaire_id', questionnaire.id)
      .eq('is_active', true)
      .order('sort_order');
    if (questionsError) throw questionsError;
    if (!questions.length) return null;

    const { data: options, error: optionsError } = await supabase
      .from('screening_question_options')
      .select('id, question_id, label, disqualifies')
      .in('question_id', questions.map((q) => q.id))
      .eq('is_active', true)
      .order('sort_order');
    if (optionsError) throw optionsError;

    return {
      questionnaireId: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      questions: questions.map((q) => {
        const questionOptions = options
          .filter((o) => o.question_id === q.id)
          .map((o) => ({ id: o.id, label: o.label, disqualifies: o.disqualifies }));
        return {
          id: q.id,
          prompt: q.prompt,
          helpText: q.help_text,
          placeholder: q.placeholder,
          kind: questionOptions.length ? 'choice' : q.type.includes('number') ? 'number' : 'text',
          isRequired: q.is_required,
          options: questionOptions,
        };
      }),
    };
  }

  isEligible(screening: Screening, answers: ScreeningAnswers): boolean {
    return !screening.questions.some((q) =>
      q.options.some((o) => o.disqualifies && answers[q.id] === o.id),
    );
  }

  // The outcome of the person's most recent screening submission, or null if
  // they haven't completed one. A submission whose answers failed to save is
  // ignored, so they're asked again rather than waved through.
  async getScreeningResult(screening: Screening): Promise<'eligible' | 'ineligible' | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: submissions, error: submissionsError } = await supabase
      .from('screening_submissions')
      .select('id')
      .eq('questionnaire_id', screening.questionnaireId)
      .eq('user_id', session.user.id)
      .order('submitted_at', { ascending: false })
      .limit(5);
    if (submissionsError) throw submissionsError;
    if (!submissions.length) return null;

    const { data: answerRows, error: answersError } = await supabase
      .from('screening_answers')
      .select('submission_id, question_id, option_id, text_value, number_value')
      .in('submission_id', submissions.map((s) => s.id));
    if (answersError) throw answersError;

    const latest = submissions.find((s) => answerRows.some((a) => a.submission_id === s.id));
    if (!latest) return null;

    const answers: ScreeningAnswers = {};
    for (const a of answerRows.filter((row) => row.submission_id === latest.id)) {
      answers[a.question_id] = a.option_id ?? a.text_value ?? String(a.number_value ?? '');
    }
    return this.isEligible(screening, answers) ? 'eligible' : 'ineligible';
  }

  // Whether the person has already filled out the daily questionnaire today.
  // Like getScreeningResult, a submission with no saved answers doesn't count.
  async hasSubmittedToday(daily: Screening): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: submissions, error: submissionsError } = await supabase
      .from('screening_submissions')
      .select('id')
      .eq('questionnaire_id', daily.questionnaireId)
      .eq('user_id', session.user.id)
      .eq('submitted_for', localDate());
    if (submissionsError) throw submissionsError;
    if (!submissions.length) return false;

    const { count, error: answersError } = await supabase
      .from('screening_answers')
      .select('id', { count: 'exact', head: true })
      .in('submission_id', submissions.map((s) => s.id));
    if (answersError) throw answersError;
    return (count ?? 0) > 0;
  }

  // Saves a submission and its answers — a daily one is dated today. Returns
  // false when there's no session or the write fails, so the caller can tell
  // the person.
  async submitAnswers(
    questionnaire: Screening,
    answers: ScreeningAnswers,
    kind: QuestionnaireKind,
  ): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: submission, error: submissionError } = await supabase
      .from('screening_submissions')
      .insert({
        questionnaire_id: questionnaire.questionnaireId,
        user_id: session.user.id,
        submitted_for: kind === 'daily' ? localDate() : null,
      })
      .select('id')
      .single();
    if (submissionError) {
      console.error('Error saving submission:', submissionError);
      return false;
    }

    const rows = questionnaire.questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => {
        const value = answers[q.id].trim();
        return {
          submission_id: submission.id,
          question_id: q.id,
          option_id: q.kind === 'choice' ? value : null,
          text_value: q.kind === 'text' ? value : null,
          number_value: q.kind === 'number' ? Number(value) : null,
        };
      });

    const { error: answersError } = await supabase.from('screening_answers').insert(rows);
    if (answersError) {
      console.error('Error saving answers:', answersError);
      return false;
    }
    return true;
  }

  // Whether the signed-in person has something to fill out right now: the
  // screening, or (once they've passed it) today's daily questionnaire.
  // Returns false (nothing to flag) when nobody's signed in or a lookup
  // fails, the same silent-no-op pattern as HealthService.
  async hasPendingQuestionnaire(): Promise<boolean> {
    try {
      const screening = await this.loadQuestionnaire('screening');
      if (screening) {
        const result = await this.getScreeningResult(screening);
        if (result === 'ineligible') return false;
        if (result === null) return true;
      }

      const daily = await this.loadQuestionnaire('daily');
      if (!daily) return false;
      return !(await this.hasSubmittedToday(daily));
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
      return false;
    }
  }
}
