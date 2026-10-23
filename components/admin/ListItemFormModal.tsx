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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/db/supabase';
import { ImagePickerField } from './ImagePickerField';
import type { TablesInsert } from '@/db/database.types';

/** The list tables this modal knows how to edit. */
export type ListTable =
  | 'faculty_members'
  | 'health_topics'
  | 'home_events'
  | 'health_resources'
  | 'health_apps'
  | 'research_publications'
  | 'community_categories'
  | 'community_items'
  | 'community_listings';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ListItemFormModalProps {
  visible: boolean;
  table: ListTable;
  /** Existing row when editing; null/undefined when adding a new item. */
  item: Record<string, any> | null;
  /** Rows are always appended at the end, so this is the next sort_order. */
  nextSortOrder: number;
  /** Choices for `select` fields, keyed by field key (e.g. the topics for topic_id). */
  selectOptions?: Record<string, SelectOption[]>;
  /** Pre-fills `select` fields when adding, e.g. the parent the list is filtered to. */
  defaults?: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

interface FieldSpec {
  key: string;
  label: string;
  /**
   * `lines` edits a text[] column as one entry per line; `select` picks a
   * parent row (its choices come in through the selectOptions prop).
   */
  kind: 'text' | 'multiline' | 'switch' | 'image' | 'color' | 'number' | 'lines' | 'select';
  placeholder?: string;
  required?: boolean;
  /** Hint shown next to a switch: [when on, when off]. */
  switchHint?: [string, string];
}

const FIELDS: Record<ListTable, FieldSpec[]> = {
  faculty_members: [
    { key: 'name', label: 'Name', kind: 'text', required: true },
    { key: 'title', label: 'Title', kind: 'multiline', required: true },
    { key: 'email', label: 'Email', kind: 'text', placeholder: 'name@vsu.edu' },
    { key: 'phone', label: 'Phone', kind: 'text', placeholder: '(804) 524-5523' },
    { key: 'image_url', label: 'Photo', kind: 'image' },
    {
      key: 'is_director',
      label: 'Lab director',
      kind: 'switch',
      switchHint: ['Shows the Director badge', 'No badge'],
    },
  ],
  health_topics: [
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'color', label: 'Card color', kind: 'color', placeholder: '#8B7FE8' },
    { key: 'image_url', label: 'Image', kind: 'image' },
    { key: 'icon', label: 'Icon name', kind: 'text', placeholder: 'heart' },
  ],
  home_events: [
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'description', label: 'Details', kind: 'multiline' },
    { key: 'icon', label: 'Icon name', kind: 'text', placeholder: 'calendar' },
    { key: 'color', label: 'Card color', kind: 'color', placeholder: '#ef4444' },
  ],
  health_resources: [
    { key: 'topic_id', label: 'Health topic', kind: 'select', required: true },
    { key: 'name', label: 'Name', kind: 'text', required: true },
    { key: 'address', label: 'Address', kind: 'text', placeholder: '204 N Hamilton St, Richmond, VA 23221' },
    { key: 'phone', label: 'Phone', kind: 'text', placeholder: '(804) 201-9218' },
    { key: 'description', label: 'Description', kind: 'multiline' },
  ],
  health_apps: [
    { key: 'topic_id', label: 'Health topic', kind: 'select', required: true },
    { key: 'title', label: 'App name', kind: 'text', required: true },
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'features', label: 'Key features', kind: 'lines', placeholder: 'One feature per line' },
    { key: 'image_url', label: 'Logo', kind: 'image' },
  ],
  research_publications: [
    { key: 'citation', label: 'Citation', kind: 'multiline', required: true },
    { key: 'journal', label: 'Journal', kind: 'text', placeholder: 'NeuroImage' },
    { key: 'year', label: 'Year', kind: 'number', placeholder: '2024' },
    {
      key: 'is_featured',
      label: 'Featured',
      kind: 'switch',
      switchHint: ['Shown as the Latest Publication card', 'Listed normally'],
    },
  ],
  community_categories: [
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'icon', label: 'Icon name', kind: 'text', placeholder: 'hand-right' },
    { key: 'color', label: 'Color', kind: 'color', placeholder: '#10B981' },
  ],
  community_items: [
    { key: 'category_id', label: 'Category', kind: 'select', required: true },
    { key: 'title', label: 'Button title', kind: 'text', required: true },
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'icon', label: 'Icon name', kind: 'text', placeholder: 'calendar' },
  ],
  community_listings: [
    { key: 'item_id', label: 'Shown under', kind: 'select', required: true },
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'contact', label: 'Contact', kind: 'text', placeholder: 'Office name - (555) 123-4567' },
    { key: 'date_time', label: 'Date / time', kind: 'text', placeholder: 'Saturday, March 22 - 9:00 AM to 12:00 PM' },
    { key: 'link', label: 'Link', kind: 'text', placeholder: 'https://' },
  ],
};

const TABLE_LABELS: Record<ListTable, string> = {
  faculty_members: 'Faculty member',
  health_topics: 'Health topic',
  home_events: 'Home event',
  health_resources: 'Local resource',
  health_apps: 'Recovery app',
  research_publications: 'Publication',
  community_categories: 'Community category',
  community_items: 'Community button',
  community_listings: 'Community listing',
};

type Draft = Record<string, any>;

function draftFrom(
  table: ListTable,
  item: Record<string, any> | null,
  nextSortOrder: number,
  defaults: Record<string, string> = {}
): Draft {
  const base: Draft = {};
  for (const field of FIELDS[table]) {
    if (!item) {
      base[field.key] = field.kind === 'switch' ? false : defaults[field.key] ?? '';
      continue;
    }
    const raw = item[field.key];
    if (field.kind === 'switch') {
      base[field.key] = Boolean(raw);
    } else if (field.kind === 'lines') {
      base[field.key] = Array.isArray(raw) ? raw.join('\n') : '';
    } else if (field.kind === 'number') {
      base[field.key] = raw === null || raw === undefined ? '' : String(raw);
    } else if (raw === null || raw === undefined) {
      base[field.key] = '';
    } else {
      base[field.key] = raw;
    }
  }
  base.sort_order = item?.sort_order ?? nextSortOrder;
  return base;
}

export function ListItemFormModal({
  visible,
  table,
  item,
  nextSortOrder,
  selectOptions = {},
  defaults,
  onClose,
  onSaved,
}: ListItemFormModalProps) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(table, item, nextSortOrder, defaults));
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const isEditing = Boolean(item);
  const label = TABLE_LABELS[table];

  // Reset the form each time the modal opens or the target changes.
  useEffect(() => {
    if (visible) {
      setDraft(draftFrom(table, item, nextSortOrder, defaults));
    }
    // `defaults` is a fresh object each render; it only matters when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, table, item, nextSortOrder]);

  const setField = (key: string, value: any) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const missingRequired = FIELDS[table].filter(
      (f) => f.required && !String(draft[f.key] ?? '').trim()
    );
    if (missingRequired.length > 0) {
      Alert.alert('Missing fields', `Please fill in: ${missingRequired.map((f) => f.label).join(', ')}.`);
      return;
    }
    const badNumber = FIELDS[table].find(
      (f) => f.kind === 'number' && String(draft[f.key] ?? '').trim() && Number.isNaN(Number(draft[f.key]))
    );
    if (badNumber) {
      Alert.alert('Invalid number', `${badNumber.label} must be a number.`);
      return;
    }

    // Strip keys the modal doesn't know about, so an edit never clobbers
    // server-managed columns like created_at or id.
    const payload: Record<string, any> = { sort_order: draft.sort_order };
    for (const field of FIELDS[table]) {
      const value = draft[field.key];
      if (field.kind === 'switch') {
        payload[field.key] = Boolean(value);
      } else if (field.kind === 'image') {
        payload[field.key] = value ? value : null;
      } else if (field.kind === 'color' || field.kind === 'select') {
        payload[field.key] = value ? value : null;
      } else if (field.kind === 'number') {
        payload[field.key] = String(value ?? '').trim() ? Number(value) : null;
      } else if (field.kind === 'lines') {
        payload[field.key] = String(value ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      } else {
        payload[field.key] = value;
      }
    }

    // The payload is built from FIELDS, so its shape is guaranteed to match
    // whichever table is selected — but TypeScript can't narrow a union of
    // three table names to one Insert type. Cast once here rather than
    // scattering `any` through the modal.
    const typedPayload = payload as TablesInsert<ListTable>;

    setSaving(true);
    try {
      // Each branch keeps its own result so the error types stay tied to that
      // table's schema instead of collapsing into a union.
      if (isEditing && item?.id) {
        const { error } = await supabase
          .from(table)
          .update(typedPayload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(typedPayload);
        if (error) throw error;
      }

      Alert.alert('Saved', `${label} ${isEditing ? 'updated' : 'added'}.`);
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert(
        'Save failed',
        err?.message ??
          "The database rejected this change. If you're not signed in as an admin, RLS blocks the write."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={[styles.headerAction, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isEditing ? `Edit ${label}` : `Add ${label}`}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={[styles.headerAction, { color: primaryColor }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {FIELDS[table].map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>

              {field.kind === 'text' && (
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: cardBg, borderColor: cardBorder, color: textColor },
                  ]}
                  value={draft[field.key] ?? ''}
                  onChangeText={(v) => setField(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={textSecondary}
                  autoCapitalize="none"
                />
              )}

              {field.kind === 'number' && (
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: cardBg, borderColor: cardBorder, color: textColor },
                  ]}
                  value={draft[field.key] ?? ''}
                  onChangeText={(v) => setField(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                />
              )}

              {field.kind === 'select' && (
                <View style={styles.selectWrap}>
                  {(selectOptions[field.key] ?? []).length === 0 ? (
                    <Text style={[styles.switchHint, { color: textSecondary }]}>
                      Nothing to choose from yet — add one first.
                    </Text>
                  ) : (
                    (selectOptions[field.key] ?? []).map((option) => {
                      const active = draft[field.key] === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setField(field.key, option.value)}
                          style={[
                            styles.selectChip,
                            {
                              backgroundColor: active ? primaryColor : cardBg,
                              borderColor: active ? primaryColor : cardBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.selectChipText, { color: active ? '#fff' : textColor }]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {(field.kind === 'multiline' || field.kind === 'lines') && (
                <TextInput
                  style={[
                    styles.input,
                    styles.multiline,
                    { backgroundColor: cardBg, borderColor: cardBorder, color: textColor },
                  ]}
                  value={draft[field.key] ?? ''}
                  onChangeText={(v) => setField(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={textSecondary}
                  multiline
                  textAlignVertical="top"
                />
              )}

              {field.kind === 'color' && (
                <View style={styles.colorRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.colorInput,
                      { backgroundColor: cardBg, borderColor: cardBorder, color: textColor },
                    ]}
                    value={draft[field.key] ?? ''}
                    onChangeText={(v) => setField(field.key, v)}
                    placeholder={field.placeholder}
                    placeholderTextColor={textSecondary}
                    autoCapitalize="none"
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: draft[field.key] || cardBorder },
                    ]}
                  />
                </View>
              )}

              {field.kind === 'switch' && (
                <View style={[styles.switchRow, { borderColor: cardBorder }]}>
                  <Text style={[styles.switchHint, { color: textSecondary }]}>
                    {field.switchHint ? field.switchHint[draft[field.key] ? 0 : 1] : ''}
                  </Text>
                  <Switch
                    value={Boolean(draft[field.key])}
                    onValueChange={(v) => setField(field.key, v)}
                    trackColor={{ true: primaryColor, false: cardBorder }}
                  />
                </View>
              )}

              {field.kind === 'image' && (
                <ImagePickerField
                  value={draft[field.key] || null}
                  onUploaded={(url) => setField(field.key, url)}
                />
              )}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: primaryColor, opacity: saving ? 0.7 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : isEditing ? 'Save changes' : `Add ${label}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 52,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorInput: {
    flex: 1,
  },
  colorSwatch: {
    width: 44,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchHint: {
    fontSize: 13,
  },
  selectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
