import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  type AdminQuestion,
  type Cohort,
  type CohortMember,
  type CohortStatus,
  type Criterion,
  COHORT_STATUSES,
  deleteCohort,
  describeCriterion,
  listCohortMembers,
  listCohorts,
  removeCohortMember,
  setCohortMemberStatus,
} from '@/services/screening';
import { confirmAction, copyText, errorMessage, notify } from './adminDialogs';

export interface ScreeningCohortsProps {
  questionnaireId: string;
  questions: AdminQuestion[];
  /** Loads a cohort's saved criteria into the filter view. */
  onRerun: (criteria: Criterion[]) => void;
}

const STATUS_COLORS: Record<CohortStatus, string> = {
  selected: '#6366f1',
  contacted: '#f59e0b',
  enrolled: '#10b981',
  declined: '#9ca3af',
};

export function ScreeningCohorts({ questionnaireId, questions, onRerun }: ScreeningCohortsProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCohort, setOpenCohort] = useState<Cohort | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCohorts(await listCohorts(questionnaireId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [questionnaireId]);

  useEffect(() => {
    load();
  }, [load]);

  if (openCohort) {
    return (
      <CohortDetail
        cohort={openCohort}
        questions={questions}
        onBack={() => {
          setOpenCohort(null);
          load();
        }}
        onRerun={onRerun}
      />
    );
  }

  if (loading) return <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 24 }} />;
  if (error) return <Text style={[styles.empty, { color: '#ef4444' }]}>{error}</Text>;
  if (cohorts.length === 0) {
    return (
      <Text style={[styles.empty, { color: textSecondary }]}>
        No cohorts yet — select people on the Responses tab and add them to one
      </Text>
    );
  }

  return (
    <View>
      {cohorts.map((cohort) => (
        <TouchableOpacity
          key={cohort.id}
          onPress={() => setOpenCohort(cohort)}
          style={[styles.card, styles.row, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: textColor }]}>{cohort.name}</Text>
            <Text style={[styles.meta, { color: textSecondary }]}>
              {cohort.member_count} {cohort.member_count === 1 ? 'member' : 'members'} · created{' '}
              {new Date(cohort.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CohortDetail({
  cohort,
  questions,
  onBack,
  onRerun,
}: {
  cohort: Cohort;
  questions: AdminQuestion[];
  onBack: () => void;
  onRerun: (criteria: Criterion[]) => void;
}) {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await listCohortMembers(cohort.id));
    } catch (err) {
      notify('Could not load members', errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [cohort.id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (member: CohortMember, status: CohortStatus) => {
    if (member.status === status) return;
    setBusyId(member.user_id);
    try {
      await setCohortMemberStatus(cohort.id, member.user_id, status);
      setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, status } : m)));
    } catch (err) {
      notify('Could not update status', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: CohortMember) => {
    const ok = await confirmAction('Remove from cohort?', member.email, 'Remove', true);
    if (!ok) return;
    setBusyId(member.user_id);
    try {
      await removeCohortMember(cohort.id, member.user_id);
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
    } catch (err) {
      notify('Could not remove', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeCohort = async () => {
    const ok = await confirmAction(
      'Delete cohort?',
      `"${cohort.name}" and its member list will be deleted. People's answers are not affected.`,
      'Delete',
      true,
    );
    if (!ok) return;
    try {
      await deleteCohort(cohort.id);
      onBack();
    } catch (err) {
      notify('Could not delete cohort', errorMessage(err));
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={[styles.row, { marginBottom: 12 }]}>
        <Ionicons name="arrow-back" size={18} color={primaryColor} />
        <Text style={[styles.link, { color: primaryColor }]}>All cohorts</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: textColor }]}>{cohort.name}</Text>
      {cohort.notes ? <Text style={[styles.meta, { color: textSecondary }]}>{cohort.notes}</Text> : null}

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 12 }]}>
        <Text style={[styles.label, { color: textColor }]}>Filter used</Text>
        {cohort.criteria.length === 0 ? (
          <Text style={[styles.meta, { color: textSecondary }]}>No conditions — everyone who submitted</Text>
        ) : (
          <View style={styles.chipWrap}>
            {cohort.criteria.map((criterion, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: primaryColor + '1A' }]}>
                <Text style={[styles.chipText, { color: textColor }]}>
                  {describeCriterion(criterion, questions)}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={[styles.row, { gap: 20, marginTop: 10 }]}>
          <TouchableOpacity onPress={() => onRerun(cohort.criteria)} style={styles.row}>
            <Ionicons name="funnel-outline" size={16} color={primaryColor} />
            <Text style={[styles.link, { color: primaryColor }]}>Re-run this filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => copyText(members.map((m) => m.email).join(', '), 'Emails')}
            disabled={members.length === 0}
            style={[styles.row, { opacity: members.length ? 1 : 0.4 }]}
          >
            <Ionicons name="copy-outline" size={16} color={primaryColor} />
            <Text style={[styles.link, { color: primaryColor }]}>Copy emails</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.label, { color: textColor, marginTop: 8 }]}>
        Members ({members.length})
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 24 }} />
      ) : members.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>No one is in this cohort</Text>
      ) : (
        members.map((member) => (
          <View key={member.user_id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: textColor }]}>{member.username || member.email}</Text>
                <Text style={[styles.meta, { color: textSecondary }]}>{member.email}</Text>
              </View>
              {busyId === member.user_id ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <TouchableOpacity onPress={() => remove(member)}>
                  <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.chipWrap, { marginTop: 10 }]}>
              {COHORT_STATUSES.map((status) => {
                const active = member.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => changeStatus(member, status)}
                    disabled={busyId === member.user_id}
                    style={[
                      styles.statusChip,
                      { borderColor: STATUS_COLORS[status] },
                      active && { backgroundColor: STATUS_COLORS[status] },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: active ? '#fff' : STATUS_COLORS[status] }]}>
                      {status[0].toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}

      <TouchableOpacity onPress={removeCohort} style={[styles.row, { marginTop: 16, justifyContent: 'center' }]}>
        <Ionicons name="trash-outline" size={16} color="#ef4444" />
        <Text style={[styles.link, { color: '#ef4444' }]}>Delete cohort</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 18, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  link: { fontSize: 14, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, maxWidth: '100%' },
  chipText: { fontSize: 13 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
});
