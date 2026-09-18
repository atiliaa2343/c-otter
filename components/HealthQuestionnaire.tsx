import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { HealthService } from '@/services/health';

const healthService = new HealthService();

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

export function HealthQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const unanswered = QUESTIONS.filter((q) => q.type === 'choice' && !answers[q.key]);
    if (unanswered.length > 0) {
      Alert.alert('Missing answers', 'Please answer every multiple-choice question before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await healthService.submitQuestionnaire(answers);
      if (saved) {
        setSubmitted(true);
      } else {
        Alert.alert(
          'Not saved',
          "You'll need an account to save your answers — this app doesn't have general sign-in yet, so your responses weren't stored."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Thanks!</Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
          Your answers have been saved.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setAnswers({});
            setSubmitted(false);
          }}
          style={{ marginTop: 20, backgroundColor: '#2563eb', padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Edit answers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Health Questionnaire</Text>
        <Text style={{ color: '#6b7280', marginBottom: 16 }}>
          A few questions to help us interpret your wearable data accurately.
        </Text>

        {QUESTIONS.map((question) => (
          <View key={question.key} style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600', marginBottom: 10 }}>{question.prompt}</Text>

            {question.type === 'choice' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {question.options.map((option) => {
                  const selected = answers[question.key] === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setAnswer(question.key, option)}
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
                      <Text style={{ color: selected ? '#fff' : '#374151' }}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TextInput
                value={answers[question.key] ?? ''}
                onChangeText={(text) => setAnswer(question.key, text)}
                placeholder={question.placeholder}
                multiline
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
        ))}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{ marginTop: 4, backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' }}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
