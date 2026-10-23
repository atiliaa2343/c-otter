import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, AppState } from 'react-native';
import { QuestionnaireService, Screening, ScreeningAnswers, localDate } from '@/services/questionnaire';

const questionnaireService = new QuestionnaireService();

// screening: checking whether this applies to the person. daily: today's
// questionnaire. done: today's is already in. unavailable: passed screening
// but no daily questionnaire is active. signedOut: the session is gone
// (health-data.tsx normally keeps signed-out people off this screen).
type Stage = 'loading' | 'error' | 'signedOut' | 'screening' | 'daily' | 'ineligible' | 'done' | 'unavailable';

function msUntilMidnight(): number {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - Date.now();
}

// What QuestionCard renders — the questions loaded from the database are
// converted to this.
interface CardQuestion {
  key: string;
  type: 'choice' | 'number' | 'text';
  prompt: string;
  helpText?: string | null;
  placeholder?: string;
  options: { value: string; label: string }[];
}

function questionCards(questionnaire: Screening): CardQuestion[] {
  return questionnaire.questions.map((q) => ({
    key: q.id,
    type: q.kind,
    prompt: q.prompt,
    helpText: q.helpText,
    placeholder: q.placeholder ?? undefined,
    options: q.options.map((o) => ({ value: o.id, label: o.label })),
  }));
}

// Alerts and returns false when a required question is blank or a number
// question doesn't hold a number.
function checkAnswers(questionnaire: Screening, answers: ScreeningAnswers, action: string): boolean {
  const missing = questionnaire.questions.some((q) => q.isRequired && !answers[q.id]?.trim());
  if (missing) {
    Alert.alert('Missing answers', `Please answer every required question before ${action}.`);
    return false;
  }
  const badNumber = questionnaire.questions.some(
    (q) => q.kind === 'number' && answers[q.id]?.trim() && isNaN(Number(answers[q.id])),
  );
  if (badNumber) {
    Alert.alert('Check your answers', 'Please enter a number where one is asked for.');
    return false;
  }
  return true;
}

const NOT_SAVED_MESSAGE = "Your answers couldn't be saved. Check your connection and try again.";

interface QuestionCardProps {
  question: CardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
      <Text style={{ fontWeight: '600', marginBottom: question.helpText ? 4 : 10 }}>{question.prompt}</Text>
      {question.helpText ? (
        <Text style={{ color: '#6b7280', marginBottom: 10 }}>{question.helpText}</Text>
      ) : null}

      {question.type === 'choice' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {question.options.map((option) => {
            const selected = value === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onChange(option.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: selected ? '#2563eb' : '#d1d5db',
                  backgroundColor: selected ? '#2563eb' : '#fff',
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: selected ? '#fff' : '#374151' }}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TextInput
          value={value ?? ''}
          onChangeText={onChange}
          placeholder={question.placeholder}
          keyboardType={question.type === 'number' ? 'numeric' : 'default'}
          multiline={question.type === 'text'}
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            padding: 10,
            minHeight: 60,
            textAlignVertical: 'top',
          }}
        />
      )}
    </View>
  );
}

interface HealthQuestionnaireProps {
  // Called after a successful submit (or a saved screen-out), so the parent
  // can clear the notification dot on the Questionnaire tab.
  onSubmitted?: () => void;
}

export function HealthQuestionnaire({ onSubmitted }: HealthQuestionnaireProps) {
  const [stage, setStage] = useState<Stage>('loading');
  const [screening, setScreening] = useState<Screening | null>(null);
  const [daily, setDaily] = useState<Screening | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<ScreeningAnswers>({});
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loads today's daily questionnaire, or shows that it's already done.
  const loadDaily = async () => {
    const loaded = await questionnaireService.loadQuestionnaire('daily');
    setDaily(loaded);
    if (!loaded) {
      setStage('unavailable');
      return;
    }
    setAnswers({});
    setStage((await questionnaireService.hasSubmittedToday(loaded)) ? 'done' : 'daily');
  };

  // Loads the admin-managed screening questions, and skips straight past them
  // for someone who's already been screened. No active screening (or no
  // session to read it with) means there's nothing to screen, so the daily
  // questionnaire comes up directly.
  const load = async () => {
    setStage('loading');
    try {
      if (!(await questionnaireService.isSignedIn())) {
        setStage('signedOut');
        return;
      }
      const loaded = await questionnaireService.loadQuestionnaire('screening');
      setScreening(loaded);
      const result = loaded ? await questionnaireService.getScreeningResult(loaded) : 'eligible';
      if (result === 'ineligible') {
        setStage('ineligible');
      } else if (result === null) {
        setStage('screening');
      } else {
        await loadDaily();
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      setStage('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Once today's is in, bring the questionnaire back at midnight. Timers
  // don't run while the app is in the background, so coming back to the app
  // on a later day also reloads it.
  useEffect(() => {
    if (stage !== 'done') return;
    const doneOn = localDate();
    const timer = setTimeout(load, msUntilMidnight());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && localDate() !== doneOn) load();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [stage]);

  const setScreeningAnswer = (key: string, value: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    if (!screening || !checkAnswers(screening, screeningAnswers, 'continuing')) return;

    // Saved whichever way it goes, so nobody is asked to screen twice — a
    // screened-out person never reaches the daily questionnaire, and someone
    // who passes goes straight to it from then on.
    const eligible = questionnaireService.isEligible(screening, screeningAnswers);
    setIsSubmitting(true);
    try {
      const saved = await questionnaireService.submitAnswers(screening, screeningAnswers, 'screening');
      if (eligible) {
        await loadDaily();
      } else {
        if (saved) onSubmitted?.();
        setStage('ineligible');
      }
    } catch (error) {
      console.error('Error loading daily questionnaire:', error);
      setStage('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!daily || !checkAnswers(daily, answers, 'submitting')) return;

    setIsSubmitting(true);
    try {
      const saved = await questionnaireService.submitAnswers(daily, answers, 'daily');
      if (saved) {
        setStage('done');
        onSubmitted?.();
      } else {
        Alert.alert('Not saved', NOT_SAVED_MESSAGE);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Couldn't load the questionnaire</Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          Check your connection and try again.
        </Text>
        <TouchableOpacity
          onPress={load}
          style={{ marginTop: 20, backgroundColor: '#2563eb', padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'signedOut') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Sign in to fill this out</Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          You need to be signed in so your answers can be saved.
        </Text>
        <TouchableOpacity
          onPress={load}
          style={{ marginTop: 20, backgroundColor: '#2563eb', padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'ineligible') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>You don't qualify for this one</Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          Thanks for your interest — based on your answers, this questionnaire isn't a fit for you.
        </Text>
      </View>
    );
  }

  if (stage === 'done' || stage === 'unavailable') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
          {stage === 'done' ? "You're done for today" : 'Nothing to fill out right now'}
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          {stage === 'done'
            ? 'Thanks — your answers have been saved. Come back tomorrow for your next check-in.'
            : "There's no questionnaire for you at the moment. Check back later."}
        </Text>
      </View>
    );
  }

  const isScreening = stage === 'screening';
  const questionnaire = isScreening ? screening : daily;
  if (!questionnaire) return null;

  const values = isScreening ? screeningAnswers : answers;
  const onChange = isScreening ? setScreeningAnswer : setAnswer;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
          {isScreening ? 'Health Questionnaire' : questionnaire.title}
        </Text>
        <Text style={{ color: '#6b7280', marginBottom: 16 }}>
          {questionnaire.description ||
            (isScreening
              ? 'First, a couple of quick questions to check whether this questionnaire applies to you.'
              : 'A few questions to help us interpret your wearable data accurately.')}
        </Text>

        {questionCards(questionnaire).map((question) => (
          <QuestionCard
            key={question.key}
            question={question}
            value={values[question.key]}
            onChange={(value) => onChange(question.key, value)}
          />
        ))}

        <TouchableOpacity
          onPress={isScreening ? handleContinue : handleSubmit}
          disabled={isSubmitting}
          style={{ marginTop: 4, backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>{isScreening ? 'Continue' : 'Submit'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
