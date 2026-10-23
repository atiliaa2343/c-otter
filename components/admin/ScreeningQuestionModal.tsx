import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  type AdminQuestion,
  type QuestionDraft,
  type QuestionType,
  QUESTION_TYPE_LABELS,
  isChoiceType,
  questionHasAnswers,
  saveQuestion,
} from '@/services/screening';
import { errorMessage, notify } from './adminDialogs';

export interface ScreeningQuestionModalProps {
  visible: boolean;
  questionnaireId: string;
  /** Existing question when editing; null when adding. */
  question: AdminQuestion | null;
  /** New questions are appended at the end. */
  nextSortOrder: number;
  /** Whether answer choices can screen someone out — only on the screening questionnaire. */
  canScreenOut: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

function draftFrom(question: AdminQuestion | null): QuestionDraft {
  if (!question) {
    return {
      prompt: '',
      help_text: '',
      placeholder: '',
      type: 'single_choice',
      is_required: true,
      options: [
        { label: 'Yes', is_active: true, disqualifies: false },
        { label: 'No', is_active: true, disqualifies: false },
      ],
      removedOptionIds: [],
    };
  }
  return {
    prompt: question.prompt,
    help_text: question.help_text ?? '',
    placeholder: question.placeholder ?? '',
    type: question.type,
    is_required: question.is_required,
    options: question.options.map((o) => ({
      id: o.id,
      label: o.label,
      is_active: o.is_active,
      disqualifies: o.disqualifies,
    })),
    removedOptionIds: [],
  };
}

export function ScreeningQuestionModal({
  visible,
  questionnaireId,
  question,
  nextSortOrder,
  canScreenOut,
  onClose,
  onSaved,
}: ScreeningQuestionModalProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() => draftFrom(question));
  const [saving, setSaving] = useState(false);
  // Once someone has answered, changing the type would change what their
  // answer means — that has to be archive + a new question instead.
  const [typeLocked, setTypeLocked] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  useEffect(() => {
    if (!visible) return;
    setDraft(draftFrom(question));
    setTypeLocked(false);
    if (question) {
      questionHasAnswers(question.id)
        .then(setTypeLocked)
        .catch(() => setTypeLocked(true));
    }
  }, [visible, question]);

  const update = (patch: Partial<QuestionDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const updateOption = (index: number, patch: Partial<QuestionDraft['options'][number]>) =>
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));

  const moveOption = (index: number, delta: number) =>
    setDraft((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.options.length) return prev;
      const options = [...prev.options];
      [options[index], options[target]] = [options[target], options[index]];
      return { ...prev, options };
    });

  const removeOption = (index: number) =>
    setDraft((prev) => {
      const removed = prev.options[index];
      return {
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        removedOptionIds: removed.id ? [...prev.removedOptionIds, removed.id] : prev.removedOptionIds,
      };
    });

  const handleSave = async () => {
    if (!draft.prompt.trim()) {
      notify('Missing prompt', 'Please write the question.');
      return;
    }
    if (isChoiceType(draft.type)) {
      if (draft.options.some((o) => !o.label.trim())) {
        notify('Empty option', 'Every answer choice needs a label (or remove it).');
        return;
      }
      if (draft.options.filter((o) => o.is_active).length < 2) {
        notify('Not enough options', 'A choice question needs at least two active answer choices.');
        return;
      }
    }

    setSaving(true);
    try {
      await saveQuestion(questionnaireId, draft, question?.id ?? null, nextSortOrder);
      onSaved();
      onClose();
    } catch (err) {
      notify('Save failed', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={[styles.headerAction, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {question ? 'Edit question' : 'Add question'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={[styles.headerAction, { color: primaryColor, textAlign: 'right' }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: textColor }]}>Question *</Text>
            <TextInput
              style={[...inputStyle, styles.multiline]}
              value={draft.prompt}
              onChangeText={(prompt) => update({ prompt })}
              placeholder="Are you 18 years of age or older?"
              placeholderTextColor={textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: textColor }]}>Help text</Text>
            <TextInput
              style={inputStyle}
              value={draft.help_text}
              onChangeText={(help_text) => update({ help_text })}
              placeholder="Optional smaller text under the question"
              placeholderTextColor={textSecondary}
            />
          </View>

          {!isChoiceType(draft.type) ? (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>Answer box hint</Text>
              <TextInput
                style={inputStyle}
                value={draft.placeholder}
                onChangeText={(placeholder) => update({ placeholder })}
                placeholder="Optional grey text inside the answer box"
                placeholderTextColor={textSecondary}
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: textColor }]}>Answer type</Text>
            <View style={styles.chipRow}>
              {TYPES.map((type) => {
                const active = draft.type === type;
                return (
                  <TouchableOpacity
                    key={type}
                    disabled={typeLocked}
                    onPress={() => update({ type })}
                    style={[
                      styles.chip,
                      { borderColor: active ? primaryColor : cardBorder },
                      active && { backgroundColor: primaryColor },
                      typeLocked && !active && { opacity: 0.4 },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : textColor }]}>
                      {QUESTION_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {typeLocked && (
              <Text style={[styles.hint, { color: textSecondary }]}>
                People have already answered this question, so its type can't change. To ask
                something different, archive it and add a new question.
              </Text>
            )}
          </View>

          <View style={[styles.switchRow, { borderColor: cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: textColor, marginBottom: 0 }]}>Required</Text>
            <Switch
              value={draft.is_required}
              onValueChange={(is_required) => update({ is_required })}
              trackColor={{ true: primaryColor, false: cardBorder }}
            />
          </View>

          {isChoiceType(draft.type) && (
            <View style={[styles.field, { marginTop: 18 }]}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>Answer choices</Text>
              <Text style={[styles.hint, { color: textSecondary, marginTop: 0, marginBottom: 8 }]}>
                Turn on "Screens out" for an answer that means the person doesn't qualify.
              </Text>

              {draft.options.map((option, index) => (
                <View
                  key={option.id ?? `new-${index}`}
                  style={[styles.optionCard, { borderColor: cardBorder, opacity: option.is_active ? 1 : 0.55 }]}
                >
                  <View style={styles.optionTop}>
                    <TextInput
                      style={[...inputStyle, { flex: 1 }]}
                      value={option.label}
                      onChangeText={(label) => updateOption(index, { label })}
                      placeholder={`Choice ${index + 1}`}
                      placeholderTextColor={textSecondary}
                    />
                    <TouchableOpacity onPress={() => moveOption(index, -1)} style={styles.iconButton}>
                      <Ionicons name="arrow-up" size={18} color={textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveOption(index, 1)} style={styles.iconButton}>
                      <Ionicons name="arrow-down" size={18} color={textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeOption(index)} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.optionBottom}>
                    {canScreenOut ? (
                      <View style={styles.inlineSwitch}>
                        <Switch
                          value={option.disqualifies}
                          onValueChange={(disqualifies) => updateOption(index, { disqualifies })}
                          trackColor={{ true: '#ef4444', false: cardBorder }}
                        />
                        <Text style={[styles.hint, { color: textSecondary, marginTop: 0 }]}>Screens out</Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    {option.id && (
                      <TouchableOpacity onPress={() => updateOption(index, { is_active: !option.is_active })}>
                        <Text style={[styles.linkText, { color: primaryColor }]}>
                          {option.is_active ? 'Archive' : 'Unarchive'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() =>
                  update({ options: [...draft.options, { label: '', is_active: true, disqualifies: false }] })
                }
                style={[styles.addOption, { borderColor: primaryColor }]}
              >
                <Ionicons name="add" size={18} color={primaryColor} />
                <Text style={[styles.linkText, { color: primaryColor }]}>Add choice</Text>
              </TouchableOpacity>
              <Text style={[styles.hint, { color: textSecondary }]}>
                Removing a choice that someone already picked archives it instead, so their answer
                still makes sense.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerAction: { fontSize: 15, fontWeight: '500', minWidth: 52 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  hint: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionCard: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  inlineSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 6 },
  linkText: { fontSize: 14, fontWeight: '600' },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
});
