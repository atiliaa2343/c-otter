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
import type { QuestionnaireKind } from '@/services/questionnaire';
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

// Responses and cohorts filter on each person's latest screening answers,
// which doesn't mean anything for a questionnaire answered every day — so
// the daily questionnaire only gets the question editor.
const KINDS: { id: QuestionnaireKind; label: string; views: ScreeningView[] }[] = [
  { id: 'screening', label: 'Screening', views: ['questions', 'responses', 'cohorts'] },
  { id: 'daily', label: 'Daily', views: ['questions'] },
];

const EMPTY_TEXT: Record<QuestionnaireKind, { title: string; body: string; button: string }> = {
  screening: {
    title: 'No screening questionnaire yet',
    body: 'Create one, then add the questions people answer on the health tab.',
    button: 'Create screening questionnaire',
  },
  daily: {
    title: 'No daily questionnaire yet',
    body: 'Create one, then add the questions people who pass screening answer once a day.',
    button: 'Create daily questionnaire',
  },
};

export interface ScreeningScreenProps {
  adminId: string;
}

/** The dashboard's Screening tab — see screening-questionnaire-plan.md. */
export function ScreeningScreen({ adminId }: ScreeningScreenProps) {
  const [kind, setKind] = useState<QuestionnaireKind>('screening');
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
      const active = await getActiveQuestionnaire(kind);
      setQuestionnaire(active);
      setQuestions(active ? await listQuestions(active.id) : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      setQuestionnaire(await createQuestionnaire(adminId, kind));
      setQuestions([]);
    } catch (err) {
      notify('Could not create questionnaire', errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const switchKind = (next: QuestionnaireKind) => {
    if (next === kind) return;
    setKind(next);
    setLoading(true);
    setView('questions');
    setCriteria([]);
  };

  const kindSwitch = (
    <View style={[styles.kindBar, { borderBottomColor: cardBorder }]}>
      {KINDS.map((k) => {
        const active = k.id === kind;
        return (
          <TouchableOpacity
            key={k.id}
            onPress={() => switchKind(k.id)}
            style={[styles.kindChip, { borderColor: active ? primaryColor : cardBorder }, active && { backgroundColor: primaryColor }]}
          >
            <Text style={[styles.tabText, { color: active ? '#fff' : textSecondary }]}>{k.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        {kindSwitch}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        {kindSwitch}
        <View style={styles.centered}>
          <Text style={[styles.message, { color: '#ef4444' }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
            <Text style={[styles.tabText, { color: primaryColor }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!questionnaire) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        {kindSwitch}
        <View style={styles.centered}>
          <Ionicons name="clipboard-outline" size={48} color={primaryColor} />
          <Text style={[styles.message, { color: textColor, fontWeight: '600', marginTop: 12 }]}>
            {EMPTY_TEXT[kind].title}
          </Text>
          <Text style={[styles.message, { color: textSecondary }]}>{EMPTY_TEXT[kind].body}</Text>
          <TouchableOpacity
            onPress={create}
            disabled={creating}
            style={[styles.createButton, { backgroundColor: primaryColor }]}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createText}>{EMPTY_TEXT[kind].button}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const kindViews = KINDS.find((k) => k.id === kind)!.views;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {kindSwitch}
      <View style={[styles.tabBar, { borderBottomColor: cardBorder }]}>
        {VIEWS.filter((v) => kindViews.includes(v.id)).map((v) => {
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
          <ScreeningQuestionList
            questionnaireId={questionnaire.id}
            questions={questions}
            canScreenOut={kind === 'screening'}
            onChanged={load}
          />
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
  kindBar: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1 },
  kindChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
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
