import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { type MatchedUser, type SubmissionAnswer, getSubmissionAnswers } from '@/services/screening';
import { errorMessage } from './adminDialogs';

export interface ScreeningUserAnswersProps {
  /** The person whose latest submission to show; null hides the modal. */
  user: MatchedUser | null;
  onClose: () => void;
}

export function ScreeningUserAnswers({ user, onClose }: ScreeningUserAnswersProps) {
  const [answers, setAnswers] = useState<SubmissionAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnswers([]);
    getSubmissionAnswers(user.submission_id)
      .then((rows) => !cancelled && setAnswers(rows))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <Modal visible={Boolean(user)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: textColor }]}>{user?.username || user?.email}</Text>
            {user && (
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                {user.email} · submitted {new Date(user.submitted_at).toLocaleString()}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.close, { color: primaryColor }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loading ? (
            <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={[styles.empty, { color: '#ef4444' }]}>{error}</Text>
          ) : answers.length === 0 ? (
            <Text style={[styles.empty, { color: textSecondary }]}>This submission has no saved answers.</Text>
          ) : (
            answers.map((answer) => (
              <View
                key={answer.question_id}
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <Text style={[styles.prompt, { color: textSecondary }]}>
                  {answer.prompt}
                  {answer.question_archived ? '  (archived question)' : ''}
                </Text>
                <Text style={[styles.value, { color: textColor }]}>{answer.value || '—'}</Text>
              </View>
            ))
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  close: { fontSize: 15, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  prompt: { fontSize: 13 },
  value: { fontSize: 15, fontWeight: '600', marginTop: 4 },
});
