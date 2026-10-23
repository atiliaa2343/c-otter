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
import { ListItemFormModal, type ListTable, type SelectOption } from './ListItemFormModal';

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

interface ListTabMeta {
  id: ListTable;
  label: string;
  singular: string;
  empty: string;
  /** For rows that belong to a parent row: the column holding the parent's id. */
  parentKey?: 'topic_id' | 'category_id' | 'item_id';
}

const LIST_TABS: ListTabMeta[] = [
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
  {
    id: 'health_resources',
    label: 'Topic Resources',
    singular: 'local resource',
    empty: 'No local resources yet — add one',
    parentKey: 'topic_id',
  },
  {
    id: 'health_apps',
    label: 'Topic Apps',
    singular: 'recovery app',
    empty: 'No recovery apps yet — add one',
    parentKey: 'topic_id',
  },
  {
    id: 'research_publications',
    label: 'Publications',
    singular: 'publication',
    empty: 'No publications yet — add one',
  },
  {
    id: 'community_categories',
    label: 'Community Categories',
    singular: 'community category',
    empty: 'No community categories yet — add one',
  },
  {
    id: 'community_items',
    label: 'Community Buttons',
    singular: 'community button',
    empty: 'No buttons in this category yet — add one',
    parentKey: 'category_id',
  },
  {
    id: 'community_listings',
    label: 'Community Listings',
    singular: 'community listing',
    empty: 'No listings under this button yet — add one',
    parentKey: 'item_id',
  },
];

/** The table each parentKey points at. */
const PARENT_TABLE: Record<NonNullable<ListTabMeta['parentKey']>, ListTable> = {
  topic_id: 'health_topics',
  category_id: 'community_categories',
  item_id: 'community_items',
};

type Group = 'pages' | 'lists';

export interface ContentEditorScreenProps {
  adminId: string;
}

export function ContentEditorScreen({ adminId }: ContentEditorScreenProps) {
  const [group, setGroup] = useState<Group>('pages');
  const [contentTab, setContentTab] = useState<string>(CONTENT_TABS[0].id);
  const [listTab, setListTab] = useState<ListTable>(LIST_TABS[0].id);
  // For nested lists: only show rows under this parent (null = all of them).
  const [parentFilter, setParentFilter] = useState<string | null>(null);

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
  // normalize the shown list to 0..n-1 first. That keeps ordering stable
  // even after several moves. For a nested list filtered to one parent,
  // only that parent's rows are renumbered — the pages order rows within
  // their parent, so other parents' numbers don't matter.
  const handleMove = async (table: ListTable, list: any[], index: number, direction: -1 | 1) => {
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
  const parentKey = activeListMeta.parentKey;
  const allActiveRows = rows[listTab] ?? [];
  const activeRows =
    parentKey && parentFilter
      ? allActiveRows.filter((r) => r[parentKey] === parentFilter)
      : allActiveRows;
  const nextSortOrder =
    activeRows.length > 0
      ? Math.max(...activeRows.map((r) => r.sort_order ?? 0)) + 1
      : 0;

  // Choices for the form's "belongs to" pickers, and the filter chips above
  // a nested list. A listing's label includes its category, since button
  // names like "Community" can repeat across categories.
  const titleOf = (table: ListTable, id: string) =>
    (rows[table] ?? []).find((r) => r.id === id)?.title ?? 'Unknown';
  const selectOptions: Record<string, SelectOption[]> = {
    topic_id: (rows.health_topics ?? []).map((t) => ({ value: t.id, label: t.title })),
    category_id: (rows.community_categories ?? []).map((c) => ({ value: c.id, label: c.title })),
    item_id: (rows.community_items ?? []).map((i) => ({
      value: i.id,
      label: `${titleOf('community_categories', i.category_id)} › ${i.title}`,
    })),
  };
  const parentLabel = (row: Record<string, any>) => {
    if (!parentKey) return null;
    if (parentKey === 'item_id') {
      return selectOptions.item_id.find((o) => o.value === row.item_id)?.label ?? 'Unknown';
    }
    return titleOf(PARENT_TABLE[parentKey], row[parentKey]);
  };

  const cardSubtitle = (row: Record<string, any>) => {
    switch (listTab) {
      case 'faculty_members':
        return row.title;
      case 'research_publications':
        return [row.journal, row.year].filter(Boolean).join(', ') || null;
      default:
        return row.description;
    }
  };
  const cardDetails = (row: Record<string, any>): string[] => {
    const parent = !parentFilter ? parentLabel(row) : null;
    switch (listTab) {
      case 'faculty_members':
        return [row.email, row.phone].filter(Boolean);
      case 'health_topics':
        return [row.icon].filter(Boolean);
      case 'health_resources':
        return [parent && `Topic: ${parent}`, row.address, row.phone].filter(Boolean);
      case 'health_apps':
        return [parent && `Topic: ${parent}`, ...(row.features ?? [])].filter(Boolean);
      case 'research_publications':
        return row.is_featured ? ['★ Featured'] : [];
      case 'community_items':
        return [parent && `In: ${parent}`].filter(Boolean);
      case 'community_listings':
        return [parent && `Under: ${parent}`, row.contact, row.date_time].filter(Boolean);
      default:
        return [];
    }
  };

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
              onPress={() => {
                setListTab(tab.id);
                setParentFilter(null);
              }}
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

      {parentKey && (
        <>
          <Text style={[styles.groupLabel, { color: textSecondary }]}>SHOW</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {[{ value: null, label: 'All' }, ...selectOptions[parentKey]].map((option) => {
              const active = option.value === parentFilter;
              return (
                <TouchableOpacity
                  key={option.value ?? 'all'}
                  onPress={() => setParentFilter(option.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? primaryColor : cardBg,
                      borderColor: active ? primaryColor : cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : textSecondary }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

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
            title={row.name ?? row.title ?? row.citation ?? 'Untitled'}
            subtitle={cardSubtitle(row)}
            details={cardDetails(row)}
            imageUrl={
              listTab === 'faculty_members' || listTab === 'health_apps' ? row.image_url : null
            }
            swatchColor={
              listTab === 'home_events' || listTab === 'community_categories' ? row.color : null
            }
            isFirst={index === 0}
            isLast={index === activeRows.length - 1}
            busy={busyId === row.id}
            onEdit={() => openEdit(row)}
            onDelete={() =>
              handleDelete(listTab, row.id, row.name ?? row.title ?? 'this item')
            }
            onMoveUp={() => handleMove(listTab, activeRows, index, -1)}
            onMoveDown={() => handleMove(listTab, activeRows, index, 1)}
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
        selectOptions={selectOptions}
        defaults={parentKey && parentFilter ? { [parentKey]: parentFilter } : undefined}
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
