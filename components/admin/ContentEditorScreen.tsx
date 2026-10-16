import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/db/supabase';
import type { Tables } from '@/db/database.types';
import { ContentBlockRow } from './ContentBlockRow';
import { ListItemCard } from './ListItemCard';
import { ListItemFormModal, type ListTable } from './ListItemFormModal';

type ContentBlockRowData = Tables<'content_blocks'>;

/** The seven tabs that have `content_blocks` rows seeded. */
const CONTENT_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'health', label: 'Health' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'contact', label: 'Contact' },
  { id: 'community', label: 'Community' },
  { id: 'research', label: 'Research' },
  { id: 'coloring_book', label: 'Coloring' },
] as const;

const LIST_TABS: { id: ListTable; label: string; singular: string; empty: string }[] = [
  {
    id: 'faculty_members',
    label: 'Faculty',
    singular: 'faculty member',
    empty: 'No faculty members yet — add one',
  },
  {
    id: 'health_topics',
    label: 'Health Topics',
    singular: 'health topic',
    empty: 'No health topics yet — add one',
  },
  {
    id: 'home_events',
    label: 'Home Events',
    singular: 'home event',
    empty: 'No home events yet — add one',
  },
];

type Group = 'pages' | 'lists';

export interface ContentEditorScreenProps {
  adminId: string;
}

export function ContentEditorScreen({ adminId }: ContentEditorScreenProps) {
  const [group, setGroup] = useState<Group>('pages');
  const [contentTab, setContentTab] = useState<string>(CONTENT_TABS[0].id);
  const [listTab, setListTab] = useState<ListTable>(LIST_TABS[0].id);

  const [blocks, setBlocks] = useState<ContentBlockRowData[]>([]);
  const [rows, setRows] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const loadBlocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('tab', contentTab)
      .order('section_key');
    if (error) throw error;
    setBlocks(data ?? []);
  }, [contentTab]);

  const loadRows = useCallback(async () => {
    const entries = await Promise.all(
      LIST_TABS.map(async (t) => {
        const { data, error } = await supabase
          .from(t.id)
          .select('*')
          .order('sort_order', { ascending: true });
        return [t.id, error ? [] : (data ?? [])] as const;
      })
    );
    setRows(Object.fromEntries(entries));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadBlocks(), loadRows()]);
    } catch (err: any) {
      Alert.alert('Load failed', err?.message ?? 'Could not load content.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadBlocks, loadRows]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleDelete = async (table: ListTable, id: string, name: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      Alert.alert('Deleted', `"${name}" removed.`);
      await loadRows();
    } catch (err: any) {
      Alert.alert('Delete failed', err?.message ?? 'Could not delete that item.');
    } finally {
      setBusyId(null);
    }
  };

  // Swapping two adjacent rows means writing both sort_order values, so
  // normalize the whole column to 0..n-1 first. That keeps ordering stable
  // even after several moves.
  const handleMove = async (table: ListTable, index: number, direction: -1 | 1) => {
    const list = rows[table] ?? [];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    setBusyId(moved.id);
    try {
      for (let i = 0; i < reordered.length; i++) {
        const { error } = await supabase
          .from(table)
          .update({ sort_order: i })
          .eq('id', reordered[i].id);
        if (error) throw error;
      }
      await loadRows();
    } catch (err: any) {
      Alert.alert('Reorder failed', err?.message ?? 'Could not change the order.');
    } finally {
      setBusyId(null);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormVisible(true);
  };

  const openEdit = (item: Record<string, any>) => {
    setEditingItem(item);
    setFormVisible(true);
  };

  const activeListMeta = LIST_TABS.find((t) => t.id === listTab)!;
  const activeRows = rows[listTab] ?? [];
  const nextSortOrder =
    activeRows.length > 0
      ? Math.max(...activeRows.map((r) => r.sort_order ?? 0)) + 1
      : 0;

  const renderPagesGroup = () => (
    <View>
      <Text style={[styles.groupLabel, { color: textSecondary }]}>PAGE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CONTENT_TABS.map((tab) => {
          const active = tab.id === contentTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setContentTab(tab.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? primaryColor : cardBg,
                  borderColor: active ? primaryColor : cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#fff' : textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {blocks.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="document-text-outline" size={32} color={textSecondary} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No content blocks for this page
          </Text>
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            Run db/seed_content_blocks.sql, or add rows from the Supabase table editor.
          </Text>
        </View>
      ) : (
        blocks.map((block) => (
          <ContentBlockRow
            key={block.id || `${block.tab}:${block.section_key}`}
            block={block}
            adminId={adminId}
            onSaved={loadBlocks}
          />
        ))
      )}
    </View>
  );

  const renderListsGroup = () => (
    <View>
      <Text style={[styles.groupLabel, { color: textSecondary }]}>LIST</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {LIST_TABS.map((tab) => {
          const active = tab.id === listTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setListTab(tab.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? primaryColor : cardBg,
                  borderColor: active ? primaryColor : cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#fff' : textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: primaryColor }]}
        onPress={openAdd}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.addButtonText}>
          Add {activeListMeta.singular}
        </Text>
      </TouchableOpacity>

      {activeRows.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="list-outline" size={32} color={textSecondary} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            {activeListMeta.empty}
          </Text>
        </View>
      ) : (
        activeRows.map((row, index) => (
          <ListItemCard
            key={row.id}
            title={row.name ?? row.title ?? 'Untitled'}
            subtitle={listTab === 'faculty_members' ? row.title : row.description}
            details={
              listTab === 'faculty_members'
                ? [row.email, row.phone].filter(Boolean)
                : listTab === 'health_topics'
                ? [row.icon].filter(Boolean)
                : []
            }
            imageUrl={listTab === 'faculty_members' ? row.image_url : null}
            swatchColor={listTab === 'home_events' ? row.color : null}
            isFirst={index === 0}
            isLast={index === activeRows.length - 1}
            busy={busyId === row.id}
            onEdit={() => openEdit(row)}
            onDelete={() =>
              handleDelete(listTab, row.id, row.name ?? row.title ?? 'this item')
            }
            onMoveUp={() => handleMove(listTab, index, -1)}
            onMoveDown={() => handleMove(listTab, index, 1)}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.segmentBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        {(['pages', 'lists'] as Group[]).map((g) => {
          const active = g === group;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => setGroup(g)}
              style={[styles.segment, active && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? primaryColor : textSecondary },
                ]}
              >
                {g === 'pages' ? 'Pages' : 'Lists'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={[styles.body, { backgroundColor }]}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />
        ) : group === 'pages' ? (
          renderPagesGroup()
        ) : (
          renderListsGroup()
        )}
      </ScrollView>

      <ListItemFormModal
        visible={formVisible}
        table={listTab}
        item={editingItem}
        nextSortOrder={nextSortOrder}
        onClose={() => setFormVisible(false)}
        onSaved={loadRows}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
