import { supabase } from '@/db/supabase';
import { Json } from '@/db/database.types';

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

// Service class for the intake questionnaire someone fills out from the
// health data page. Split out of HealthService since it's plain Supabase
// reads/writes with nothing platform-specific about it.
//
// Screening comes first and lives in the screening_* tables, so admins can
// edit the questions without an app release. The intake survey after it is
// still saved to questionnaire_responses.
export class QuestionnaireService {
  // The active screening questionnaire with its active questions and options,
  // or null when there's no session or no questionnaire is active (in which
  // case screening is skipped). The screening tables are only readable when
  // signed in. Throws on a network/database error so the caller can retry
  // rather than skip screening.
  async loadScreening(): Promise<Screening | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('screening_questionnaires')
      .select('id, title, description')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (questionnaireError) throw questionnaireError;
    if (!questionnaire) return null;

    const { data: questions, error: questionsError } = await supabase
      .from('screening_questions')
      .select('id, prompt, help_text, type, is_required')
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

  // Saves a screening submission and its answers. Returns false when there's
  // no session or the write fails, so the caller can tell the person.
  async submitScreening(screening: Screening, answers: ScreeningAnswers): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: submission, error: submissionError } = await supabase
      .from('screening_submissions')
      .insert({ questionnaire_id: screening.questionnaireId, user_id: session.user.id })
      .select('id')
      .single();
    if (submissionError) {
      console.error('Error saving screening submission:', submissionError);
      return false;
    }

    const rows = screening.questions
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
      console.error('Error saving screening answers:', answersError);
      return false;
    }
    return true;
  }

  // Saves the intake survey. Unlike most of HealthService's writes this is a
  // direct user action, so instead of a silent no-op it returns false when
  // there's no session (general user sign-in doesn't exist in the app yet)
  // so the caller can tell the person their answers weren't saved.
  async submitQuestionnaire(responses: Json): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.from('questionnaire_responses').insert({
      user_id: session.user.id,
      responses,
    });

    if (error) {
      console.error('Error saving questionnaire response:', error);
      return false;
    }
    return true;
  }

  // Whether the signed-in person still has a questionnaire waiting — no survey
  // on file and not screened out. Returns false (nothing to flag) when nobody's
  // signed in or a lookup fails, the same silent-no-op pattern as HealthService.
  async hasPendingQuestionnaire(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking questionnaire status:', error);
      return false;
    }
    if (data) return false;

    try {
      const screening = await this.loadScreening();
      if (!screening) return true;
      return (await this.getScreeningResult(screening)) !== 'ineligible';
    } catch (screeningError) {
      console.error('Error checking screening status:', screeningError);
      return false;
    }
  }
}
