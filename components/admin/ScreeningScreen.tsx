import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  type AdminQuestion,
  type Criterion,
  type Questionnaire,
  createQuestionnaire,
  getActiveQuestionnaire,
  listQuestions,
} from '@/services/screening';
import { ScreeningQuestionList } from './ScreeningQuestionList';
import { ScreeningFilter } from './ScreeningFilter';
import { ScreeningCohorts } from './ScreeningCohorts';
import { errorMessage, notify } from './adminDialogs';

type ScreeningView = 'questions' | 'responses' | 'cohorts';

const VIEWS: { id: ScreeningView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'questions', label: 'Questions', icon: 'list' },
  { id: 'responses', label: 'Responses', icon: 'funnel' },
  { id: 'cohorts', label: 'Cohorts', icon: 'people' },
];

export interface ScreeningScreenProps {
  adminId: string;
}

/** The dashboard's Screening tab — see screening-questionnaire-plan.md. */
export function ScreeningScreen({ adminId }: ScreeningScreenProps) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ScreeningView>('questions');
  // Lives here rather than in the filter so a cohort can load its criteria
  // back into it, and so switching sub-tabs doesn't lose the conditions.
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const load = useCallback(async () => {
    setError(null);
    try {
      const active = await getActiveQuestionnaire();
      setQuestionnaire(active);
      setQuestions(active ? await listQuestions(active.id) : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      setQuestionnaire(await createQuestionnaire(adminId));
      setQuestions([]);
    } catch (err) {
      notify('Could not create questionnaire', errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={[styles.message, { color: '#ef4444' }]}>{error}</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
          <Text style={[styles.tabText, { color: primaryColor }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questionnaire) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="clipboard-outline" size={48} color={primaryColor} />
        <Text style={[styles.message, { color: textColor, fontWeight: '600', marginTop: 12 }]}>
          No screening questionnaire yet
        </Text>
        <Text style={[styles.message, { color: textSecondary }]}>
          Create one, then add the questions people answer on the health tab.
        </Text>
        <TouchableOpacity
          onPress={create}
          disabled={creating}
          style={[styles.createButton, { backgroundColor: primaryColor }]}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createText}>Create screening questionnaire</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={[styles.tabBar, { borderBottomColor: cardBorder }]}>
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <TouchableOpacity
              key={v.id}
              onPress={() => setView(v.id)}
              style={[styles.tab, active && { borderBottomColor: primaryColor }]}
            >
              <Ionicons name={v.icon} size={16} color={active ? primaryColor : textSecondary} />
              <Text style={[styles.tabText, { color: active ? primaryColor : textSecondary }]}>{v.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {view === 'questions' && (
          <ScreeningQuestionList questionnaireId={questionnaire.id} questions={questions} onChanged={load} />
        )}
        {view === 'responses' && (
          <ScreeningFilter
            questionnaireId={questionnaire.id}
            questions={questions}
            adminId={adminId}
            criteria={criteria}
            onCriteriaChange={setCriteria}
          />
        )}
        {view === 'cohorts' && (
          <ScreeningCohorts
            questionnaireId={questionnaire.id}
            questions={questions}
            onRerun={(saved) => {
              setCriteria(saved);
              setView('responses');
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 14, textAlign: 'center', marginTop: 6 },
  createButton: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, minWidth: 240, alignItems: 'center' },
  createText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
});
