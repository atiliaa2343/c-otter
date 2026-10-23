import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  type AdminQuestion,
  type Cohort,
  type Criterion,
  type MatchedUser,
  addCohortMembers,
  createCohort,
  describeCriterion,
  isChoiceType,
  listCohorts,
  matchUsers,
} from '@/services/screening';
import { ScreeningUserAnswers } from './ScreeningUserAnswers';
import { errorMessage, notify } from './adminDialogs';

export interface ScreeningFilterProps {
  questionnaireId: string;
  questions: AdminQuestion[];
  adminId: string;
  /** Lifted to the parent so a cohort's "Re-run this filter" can load its criteria here. */
  criteria: Criterion[];
  onCriteriaChange: (criteria: Criterion[]) => void;
}

export function ScreeningFilter({
  questionnaireId,
  questions,
  adminId,
  criteria,
  onCriteriaChange,
}: ScreeningFilterProps) {
  const [users, setUsers] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<MatchedUser | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [cohortPickerOpen, setCohortPickerOpen] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const runFilter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await matchUsers(questionnaireId, criteria);
      setUsers(rows);
      // Drop selections for people who no longer match.
      setSelected((prev) => new Set(rows.filter((u) => prev.has(u.user_id)).map((u) => u.user_id)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [questionnaireId, criteria]);

  useEffect(() => {
    runFilter();
  }, [runFilter]);

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const allSelected = users.length > 0 && selected.size === users.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(users.map((u) => u.user_id)));

  return (
    <View>
      {/* Conditions */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Conditions</Text>
          {criteria.length > 0 && (
            <TouchableOpacity onPress={() => onCriteriaChange([])}>
              <Text style={[styles.link, { color: textSecondary }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.hint, { color: textSecondary }]}>
          People must match every condition. Only each person's most recent submission counts.
        </Text>

        <View style={styles.chipWrap}>
          {criteria.map((criterion, index) => (
            <View key={index} style={[styles.criterionChip, { backgroundColor: primaryColor + '1A' }]}>
              <Text style={[styles.criterionText, { color: textColor }]}>
                {describeCriterion(criterion, questions)}
              </Text>
              <TouchableOpacity onPress={() => onCriteriaChange(criteria.filter((_, i) => i !== index))}>
                <Ionicons name="close-circle" size={18} color={textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {builderOpen ? (
          <ConditionBuilder
            questions={questions}
            onCancel={() => setBuilderOpen(false)}
            onAdd={(added) => {
              onCriteriaChange([...criteria, ...added]);
              setBuilderOpen(false);
            }}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setBuilderOpen(true)}
            disabled={questions.length === 0}
            style={[styles.outlineButton, { borderColor: primaryColor, opacity: questions.length ? 1 : 0.5 }]}
          >
            <Ionicons name="add" size={18} color={primaryColor} />
            <Text style={[styles.link, { color: primaryColor }]}>Add condition</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {loading ? 'Matching…' : `${users.length} ${users.length === 1 ? 'person matches' : 'people match'}`}
        </Text>
        <TouchableOpacity onPress={runFilter} disabled={loading}>
          <Ionicons name="refresh" size={20} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={[styles.empty, { color: '#ef4444' }]}>{error}</Text>
      ) : users.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          {criteria.length ? 'No users match these conditions' : 'No one has submitted yet'}
        </Text>
      ) : (
        <>
          <View style={styles.bulkRow}>
            <TouchableOpacity onPress={toggleAll} style={styles.checkRow}>
              <Ionicons
                name={allSelected ? 'checkbox' : 'square-outline'}
                size={22}
                color={allSelected ? primaryColor : textSecondary}
              />
              <Text style={[styles.link, { color: textColor }]}>Select all</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCohortPickerOpen(true)}
              disabled={selected.size === 0}
              style={[styles.primaryButton, { backgroundColor: primaryColor, opacity: selected.size ? 1 : 0.4 }]}
            >
              <Ionicons name="people" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Add {selected.size || ''} to cohort</Text>
            </TouchableOpacity>
          </View>

          {users.map((user) => {
            const isSelected = selected.has(user.user_id);
            return (
              <View
                key={user.user_id}
                style={[styles.userRow, { backgroundColor: cardBg, borderColor: isSelected ? primaryColor : cardBorder }]}
              >
                <TouchableOpacity onPress={() => toggle(user.user_id)} style={styles.checkbox}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? primaryColor : textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewing(user)} style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: textColor }]}>{user.username || user.email}</Text>
                  <Text style={[styles.userMeta, { color: textSecondary }]}>
                    {user.email} · {new Date(user.submitted_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color={textSecondary} />
              </View>
            );
          })}
        </>
      )}

      <ScreeningUserAnswers user={viewing} onClose={() => setViewing(null)} />

      <CohortPicker
        visible={cohortPickerOpen}
        questionnaireId={questionnaireId}
        onClose={() => setCohortPickerOpen(false)}
        onConfirm={async (target) => {
          const cohortId =
            target.kind === 'existing'
              ? target.cohortId
              : await createCohort(questionnaireId, target.name, target.notes, criteria, adminId);
          await addCohortMembers(cohortId, [...selected], adminId);
          notify('Added', `${selected.size} ${selected.size === 1 ? 'person' : 'people'} added to the cohort.`);
          setSelected(new Set());
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Condition builder — the inputs change with the picked question's type.
// ---------------------------------------------------------------------------

function ConditionBuilder({
  questions,
  onAdd,
  onCancel,
}: {
  questions: AdminQuestion[];
  onAdd: (criteria: Criterion[]) => void;
  onCancel: () => void;
}) {
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [text, setText] = useState('');

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const question = questions.find((q) => q.id === questionId) ?? null;

  const pickQuestion = (id: string) => {
    setQuestionId(id);
    setOptionIds([]);
    setMin('');
    setMax('');
    setText('');
  };

  const add = () => {
    if (!question) return;
    if (isChoiceType(question.type)) {
      if (!optionIds.length) return notify('Pick an answer', 'Choose at least one answer to match.');
      return onAdd([{ question_id: question.id, op: 'any_of', option_ids: optionIds }]);
    }
    if (question.type === 'number') {
      const added: Criterion[] = [];
      if (min.trim()) {
        if (Number.isNaN(Number(min))) return notify('Invalid number', 'Minimum must be a number.');
        added.push({ question_id: question.id, op: 'gte', value: Number(min) });
      }
      if (max.trim()) {
        if (Number.isNaN(Number(max))) return notify('Invalid number', 'Maximum must be a number.');
        added.push({ question_id: question.id, op: 'lte', value: Number(max) });
      }
      if (!added.length) return notify('Enter a range', 'Fill in a minimum, a maximum, or both.');
      return onAdd(added);
    }
    if (!text.trim()) return notify('Enter text', 'Type the text the answer should contain.');
    onAdd([{ question_id: question.id, op: 'contains', value: text.trim() }]);
  };

  const inputStyle = [styles.input, { borderColor: cardBorder, color: textColor }];

  return (
    <View style={[styles.builder, { borderColor: cardBorder }]}>
      <Text style={[styles.label, { color: textColor }]}>Question</Text>
      {questions.map((q) => {
        const active = q.id === questionId;
        return (
          <TouchableOpacity key={q.id} onPress={() => pickQuestion(q.id)} style={styles.checkRow}>
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={active ? primaryColor : textSecondary}
            />
            <Text style={[styles.optionText, { color: textColor }]}>
              {q.prompt}
              {q.is_active ? '' : ' (archived)'}
            </Text>
          </TouchableOpacity>
        );
      })}

      {question && isChoiceType(question.type) && (
        <>
          <Text style={[styles.label, { color: textColor, marginTop: 12 }]}>Answered any of</Text>
          {question.options.map((o) => {
            const checked = optionIds.includes(o.id);
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() =>
                  setOptionIds((prev) => (checked ? prev.filter((id) => id !== o.id) : [...prev, o.id]))
                }
                style={styles.checkRow}
              >
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? primaryColor : textSecondary}
                />
                <Text style={[styles.optionText, { color: textColor }]}>
                  {o.label}
                  {o.is_active ? '' : ' (archived)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {question?.type === 'number' && (
        <View style={styles.rangeRow}>
          <TextInput
            style={[...inputStyle, { flex: 1 }]}
            value={min}
            onChangeText={setMin}
            placeholder="Min"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
          <Text style={{ color: textSecondary }}>to</Text>
          <TextInput
            style={[...inputStyle, { flex: 1 }]}
            value={max}
            onChangeText={setMax}
            placeholder="Max"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>
      )}

      {question?.type === 'text' && (
        <TextInput
          style={[...inputStyle, { marginTop: 12 }]}
          value={text}
          onChangeText={setText}
          placeholder="Answer contains… (not case-sensitive)"
          placeholderTextColor={textSecondary}
        />
      )}

      <View style={styles.builderActions}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.link, { color: textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={add}
          disabled={!question}
          style={[styles.primaryButton, { backgroundColor: primaryColor, opacity: question ? 1 : 0.4 }]}
        >
          <Text style={styles.primaryButtonText}>Add condition</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cohort picker — an existing cohort, or a new one with a name and notes.
// ---------------------------------------------------------------------------

type CohortTarget =
  | { kind: 'existing'; cohortId: string }
  | { kind: 'new'; name: string; notes: string };

function CohortPicker({
  visible,
  questionnaireId,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  questionnaireId: string;
  onClose: () => void;
  onConfirm: (target: CohortTarget) => Promise<void>;
}) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<string>('new');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBorder = useThemeColor({}, 'cardBorder');

  useEffect(() => {
    if (!visible) return;
    setChoice('new');
    setName('');
    setNotes('');
    setLoading(true);
    listCohorts(questionnaireId)
      .then(setCohorts)
      .catch((err) => notify('Could not load cohorts', errorMessage(err)))
      .finally(() => setLoading(false));
  }, [visible, questionnaireId]);

  const confirm = async () => {
    if (choice === 'new' && !name.trim()) {
      notify('Missing name', 'Give the new cohort a name.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(choice === 'new' ? { kind: 'new', name, notes } : { kind: 'existing', cohortId: choice });
      onClose();
    } catch (err) {
      notify('Could not add to cohort', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { borderColor: cardBorder, color: textColor }];

  const radio = (value: string, label: string, meta?: string) => {
    const active = choice === value;
    return (
      <TouchableOpacity key={value} onPress={() => setChoice(value)} style={styles.checkRow}>
        <Ionicons
          name={active ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={active ? primaryColor : textSecondary}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionText, { color: textColor }]}>{label}</Text>
          {meta ? <Text style={[styles.userMeta, { color: textSecondary }]}>{meta}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor }]}>
        <View style={[styles.modalHeader, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={[styles.link, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Add to cohort</Text>
          <TouchableOpacity onPress={confirm} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={[styles.link, { color: primaryColor }]}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {radio('new', 'New cohort…')}
          {choice === 'new' && (
            <View style={{ marginLeft: 28, marginBottom: 12, gap: 8 }}>
              <TextInput
                style={inputStyle}
                value={name}
                onChangeText={setName}
                placeholder="Name, e.g. Spring 2027 sleep study"
                placeholderTextColor={textSecondary}
              />
              <TextInput
                style={[...inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes (optional)"
                placeholderTextColor={textSecondary}
                multiline
              />
              <Text style={[styles.hint, { color: textSecondary }]}>
                The current filter conditions are saved with the cohort.
              </Text>
            </View>
          )}
          {loading ? (
            <ActivityIndicator color={primaryColor} style={{ marginTop: 16 }} />
          ) : (
            cohorts.map((c) =>
              radio(c.id, c.name, `${c.member_count} ${c.member_count === 1 ? 'member' : 'members'}`),
            )
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  link: { fontSize: 14, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  criterionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: '100%',
  },
  criterionText: { fontSize: 13, flexShrink: 1 },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  builder: { borderWidth: 1, borderRadius: 10, padding: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  optionText: { fontSize: 14, flexShrink: 1 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  builderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  checkbox: { padding: 2 },
  userName: { fontSize: 15, fontWeight: '600' },
  userMeta: { fontSize: 12, marginTop: 2 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
});
