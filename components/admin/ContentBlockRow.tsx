import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/db/supabase';
import { ImagePickerField } from './ImagePickerField';
import type { Tables } from '@/db/database.types';

export type ContentBlockRowData = Tables<'content_blocks'>;

export interface ContentBlockRowProps {
  block: ContentBlockRowData;
  adminId: string;
  onSaved: () => void;
}

const humanizeKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function ContentBlockRow({ block, adminId, onSaved }: ContentBlockRowProps) {
  const isImage = block.type === 'image';
  const [valueDraft, setValueDraft] = useState(block.value ?? '');
  const [imageDraft, setImageDraft] = useState(block.image_url ?? '');
  const [saving, setSaving] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  // Re-sync when the row changes underneath us (e.g. after a refetch), but
  // don't stomp on an edit in progress.
  useEffect(() => {
    setValueDraft(block.value ?? '');
  }, [block.value, block.id]);

  useEffect(() => {
    setImageDraft(block.image_url ?? '');
  }, [block.image_url, block.id]);

  const original = isImage ? block.image_url ?? '' : block.value ?? '';
  const draft = isImage ? imageDraft : valueDraft;
  const dirty = draft !== original;
  const setDraft = isImage ? setImageDraft : setValueDraft;

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const row = isImage
        ? {
            tab: block.tab,
            section_key: block.section_key,
            type: block.type,
            image_url: imageDraft || null,
            updated_by: adminId,
          }
        : {
            tab: block.tab,
            section_key: block.section_key,
            type: block.type,
            value: valueDraft,
            updated_by: adminId,
          };

      const { error } = await supabase
        .from('content_blocks')
        .upsert(row, { onConflict: 'tab,section_key' });

      if (error) throw error;
      Alert.alert('Saved', `"${humanizeKey(block.section_key)}" updated.`);
      onSaved();
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
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: textColor }]}>
          {humanizeKey(block.section_key)}
        </Text>
        <Text style={[styles.meta, { color: textSecondary }]}>{block.type}</Text>
      </View>

      {isImage ? (
        <ImagePickerField value={draft || null} onUploaded={setDraft} />
      ) : (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardBg,
              borderColor: dirty ? primaryColor : cardBorder,
              color: textColor,
            },
          ]}
          value={draft}
          onChangeText={setDraft}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor={textSecondary}
          accessibilityLabel={`Edit ${humanizeKey(block.section_key)}`}
        />
      )}

      <View style={styles.actionsRow}>
        {dirty && !saving && (
          <TouchableOpacity onPress={() => setDraft(original)}>
            <Text style={[styles.secondaryAction, { color: textSecondary }]}>Reset</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: dirty ? primaryColor : cardBorder,
              opacity: dirty && !saving ? 1 : 0.6,
            },
          ]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 88,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  secondaryAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 92,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
