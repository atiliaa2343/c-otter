import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { QuestionnaireService, Screening, ScreeningAnswers } from '@/services/questionnaire';

const questionnaireService = new QuestionnaireService();

interface ChoiceQuestion {
  key: string;
  type: 'choice';
  prompt: string;
  options: string[];
}

interface TextQuestion {
  key: string;
  type: 'text';
  prompt: string;
  placeholder?: string;
}

type Question = ChoiceQuestion | TextQuestion;

const QUESTIONS: Question[] = [
  {
    key: 'sleep_hours',
    type: 'choice',
    prompt: 'On average, how many hours of sleep do you get per night?',
    options: ['Less than 5', '5–6', '7–8', 'More than 8'],
  },
  {
    key: 'activity_level',
    type: 'choice',
    prompt: 'How would you describe your typical activity level?',
    options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'],
  },
  {
    key: 'heart_conditions',
    type: 'text',
    prompt: 'Do you have any diagnosed conditions that affect your heart rate (e.g. arrhythmia, thyroid condition)? If so, please describe.',
    placeholder: 'e.g. None, or describe here',
  },
  {
    key: 'medications',
    type: 'text',
    prompt: 'Are you currently taking any medications that could affect your heart rate or sleep?',
    placeholder: 'e.g. None, or list medications',
  },
  {
    key: 'additional_notes',
    type: 'text',
    prompt: 'Anything else you would like us to know about your health that would help us interpret your data accurately?',
    placeholder: 'Optional',
  },
];

type Stage = 'loading' | 'error' | 'screening' | 'survey' | 'ineligible' | 'submitted';

// What QuestionCard renders — both the intake survey above and the screening
// questions loaded from the database are converted to this.
interface CardQuestion {
  key: string;
  type: 'choice' | 'number' | 'text';
  prompt: string;
  helpText?: string | null;
  placeholder?: string;
  options: { value: string; label: string }[];
}

function surveyCard(question: Question): CardQuestion {
  return question.type === 'choice'
    ? { ...question, options: question.options.map((o) => ({ value: o, label: o })) }
    : { ...question, options: [] };
}

function screeningCards(screening: Screening): CardQuestion[] {
  return screening.questions.map((q) => ({
    key: q.id,
    type: q.kind,
    prompt: q.prompt,
    helpText: q.helpText,
    options: q.options.map((o) => ({ value: o.id, label: o.label })),
  }));
}

const NOT_SAVED_MESSAGE =
  "You'll need an account to save your answers — this app doesn't have general sign-in yet, so your responses weren't stored.";

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
  const [screeningAnswers, setScreeningAnswers] = useState<ScreeningAnswers>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loads the admin-managed screening questions, and skips straight past them
  // for someone who's already been screened. No active screening (or no
  // session to read it with) means there's nothing to screen, so the survey
  // comes up directly.
  const load = async () => {
    setStage('loading');
    try {
      const loaded = await questionnaireService.loadScreening();
      setScreening(loaded);
      if (!loaded) {
        setStage('survey');
        return;
      }
      const result = await questionnaireService.getScreeningResult(loaded);
      setStage(result === 'ineligible' ? 'ineligible' : result === 'eligible' ? 'survey' : 'screening');
    } catch (error) {
      console.error('Error loading screening questions:', error);
      setStage('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setScreeningAnswer = (key: string, value: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    if (!screening) return;

    const missing = screening.questions.some((q) => q.isRequired && !screeningAnswers[q.id]?.trim());
    if (missing) {
      Alert.alert('Missing answers', 'Please answer every required question before continuing.');
      return;
    }
    const badNumber = screening.questions.some(
      (q) => q.kind === 'number' && screeningAnswers[q.id]?.trim() && isNaN(Number(screeningAnswers[q.id])),
    );
    if (badNumber) {
      Alert.alert('Check your answers', 'Please enter a number where one is asked for.');
      return;
    }

    // Saved whichever way it goes, so nobody is asked to screen twice — a
    // screened-out person never reaches Submit, and someone who passes but
    // leaves before finishing the survey comes back straight to it.
    const eligible = questionnaireService.isEligible(screening, screeningAnswers);
    setIsSubmitting(true);
    try {
      const saved = await questionnaireService.submitScreening(screening, screeningAnswers);
      if (eligible) {
        setStage('survey');
      } else {
        if (saved) onSubmitted?.();
        setStage('ineligible');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const unanswered = QUESTIONS.filter((q) => q.type === 'choice' && !answers[q.key]);
    if (unanswered.length > 0) {
      Alert.alert('Missing answers', 'Please answer every multiple-choice question before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await questionnaireService.submitQuestionnaire(answers);
      if (saved) {
        setStage('submitted');
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

  if (stage === 'submitted') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Thanks!</Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          Your answers have been saved.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setAnswers({});
            setStage('survey');
          }}
          style={{ marginTop: 20, backgroundColor: '#2563eb', padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Edit answers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isScreening = stage === 'screening' && screening !== null;
  const questions = isScreening ? screeningCards(screening) : QUESTIONS.map(surveyCard);
  const values = isScreening ? screeningAnswers : answers;
  const onChange = isScreening ? setScreeningAnswer : setAnswer;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Health Questionnaire</Text>
        <Text style={{ color: '#6b7280', marginBottom: 16 }}>
          {isScreening
            ? screening.description ||
              'First, a couple of quick questions to check whether this questionnaire applies to you.'
            : 'A few questions to help us interpret your wearable data accurately.'}
        </Text>

        {questions.map((question) => (
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
