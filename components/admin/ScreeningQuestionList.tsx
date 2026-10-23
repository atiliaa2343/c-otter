import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  type AdminQuestion,
  QUESTION_TYPE_LABELS,
  deleteQuestion,
  questionHasAnswers,
  reorderQuestions,
  setQuestionActive,
} from '@/services/screening';
import { ScreeningQuestionModal } from './ScreeningQuestionModal';
import { confirmAction, errorMessage, notify } from './adminDialogs';

export interface ScreeningQuestionListProps {
  questionnaireId: string;
  questions: AdminQuestion[];
  /** Whether answer choices can screen someone out — only on the screening questionnaire. */
  canScreenOut: boolean;
  onChanged: () => void;
}

export function ScreeningQuestionList({ questionnaireId, questions, canScreenOut, onChanged }: ScreeningQuestionListProps) {
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const active = questions.filter((q) => q.is_active);
  const archived = questions.filter((q) => !q.is_active);
  const nextSortOrder = questions.reduce((max, q) => Math.max(max, q.sort_order + 1), 0);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
      onChanged();
    } catch (err) {
      notify('Something went wrong', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openEditor = (question: AdminQuestion | null) => {
    setEditing(question);
    setModalVisible(true);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= active.length) return;
    const ids = active.map((q) => q.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // Archived questions keep their slots after the active ones.
    run(active[index].id, () => reorderQuestions([...ids, ...archived.map((q) => q.id)]));
  };

  // Delete is only possible while nobody has answered; after that the
  // question is archived so existing answers still point at it.
  const remove = (question: AdminQuestion) =>
    run(question.id, async () => {
      if (await questionHasAnswers(question.id)) {
        const ok = await confirmAction(
          'Archive question?',
          'People have already answered this question, so it can only be archived. It will disappear from the health tab, but existing answers are kept.',
          'Archive',
        );
        if (ok) await setQuestionActive(question.id, false);
        return;
      }
      const ok = await confirmAction(
        'Delete question?',
        'Nobody has answered this question yet, so it will be removed for good.',
        'Delete',
        true,
      );
      if (ok) await deleteQuestion(question.id);
    });

  const renderBadges = (question: AdminQuestion) => (
    <View style={styles.badgeRow}>
      <View style={[styles.badge, { backgroundColor: primaryColor + '1A' }]}>
        <Text style={[styles.badgeText, { color: primaryColor }]}>{QUESTION_TYPE_LABELS[question.type]}</Text>
      </View>
      {question.is_required && (
        <View style={[styles.badge, { backgroundColor: '#f59e0b22' }]}>
          <Text style={[styles.badgeText, { color: '#b45309' }]}>Required</Text>
        </View>
      )}
      {question.options.some((o) => o.is_active && o.disqualifies) && (
        <View style={[styles.badge, { backgroundColor: '#ef444422' }]}>
          <Text style={[styles.badgeText, { color: '#b91c1c' }]}>Screens out</Text>
        </View>
      )}
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => openEditor(null)}
        style={[styles.addButton, { backgroundColor: primaryColor }]}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.addButtonText}>Add question</Text>
      </TouchableOpacity>

      {active.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>No questions yet — add one</Text>
      ) : (
        active.map((question, index) => (
          <View key={question.id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.number, { color: textSecondary }]}>Q{index + 1}</Text>
            <Text style={[styles.prompt, { color: textColor }]}>{question.prompt}</Text>
            {question.help_text ? (
              <Text style={[styles.help, { color: textSecondary }]}>{question.help_text}</Text>
            ) : null}
            {renderBadges(question)}
            {question.options.filter((o) => o.is_active).length > 0 && (
              <Text style={[styles.help, { color: textSecondary }]}>
                {question.options
                  .filter((o) => o.is_active)
                  .map((o) => (o.disqualifies ? `${o.label} ✕` : o.label))
                  .join(' · ')}
              </Text>
            )}
            <View style={styles.actions}>
              {busyId === question.id ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <>
                  <TouchableOpacity onPress={() => openEditor(question)} style={styles.action}>
                    <Ionicons name="create-outline" size={18} color={primaryColor} />
                    <Text style={[styles.actionText, { color: primaryColor }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(question)} style={styles.action}>
                    <Ionicons name="archive-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => move(index, -1)} disabled={index === 0} style={styles.iconButton}>
                    <Ionicons name="arrow-up" size={18} color={index === 0 ? cardBorder : textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => move(index, 1)}
                    disabled={index === active.length - 1}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={18}
                      color={index === active.length - 1 ? cardBorder : textSecondary}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))
      )}

      {archived.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity onPress={() => setShowArchived((v) => !v)} style={styles.archivedToggle}>
            <Ionicons name={showArchived ? 'chevron-down' : 'chevron-forward'} size={16} color={textSecondary} />
            <Text style={[styles.archivedTitle, { color: textSecondary }]}>Archived ({archived.length})</Text>
          </TouchableOpacity>
          {showArchived &&
            archived.map((question) => (
              <View
                key={question.id}
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.75 }]}
              >
                <Text style={[styles.prompt, { color: textColor }]}>{question.prompt}</Text>
                {renderBadges(question)}
                <View style={styles.actions}>
                  {busyId === question.id ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => run(question.id, () => setQuestionActive(question.id, true))}
                      style={styles.action}
                    >
                      <Ionicons name="arrow-undo-outline" size={18} color={primaryColor} />
                      <Text style={[styles.actionText, { color: primaryColor }]}>Unarchive</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
        </View>
      )}

      <ScreeningQuestionModal
        visible={modalVisible}
        questionnaireId={questionnaireId}
        question={editing}
        nextSortOrder={nextSortOrder}
        canScreenOut={canScreenOut}
        onClose={() => setModalVisible(false)}
        onSaved={onChanged}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  number: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  prompt: { fontSize: 15, fontWeight: '600' },
  help: { fontSize: 13, marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 14, fontWeight: '600' },
  iconButton: { padding: 4 },
  archivedToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  archivedTitle: { fontSize: 14, fontWeight: '600' },
});
