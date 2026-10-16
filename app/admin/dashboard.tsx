import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/db/supabase';
import { ContentEditorScreen } from '@/components/admin/ContentEditorScreen';

interface Stats {
  contentItems?: number;
  users?: number;
  admins?: number;
}

export default function Dashboard() {
  const { user, logout } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'stats' | 'content'>('stats');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [contentResult, usersResult, adminsResult] = await Promise.all([
        supabase.from('content_blocks').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      if (contentResult.error) throw contentResult.error;
      if (usersResult.error) throw usersResult.error;
      if (adminsResult.error) throw adminsResult.error;

      setStats({
        contentItems: contentResult.count ?? 0,
        users: usersResult.count ?? 0,
        admins: adminsResult.count ?? 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (!user) {
    // Redirect to login if not authenticated
    // In a real app, we'd use router.replace, but for simplicity we'll render a message
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <Text>Please log in to access the admin dashboard</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={{ padding: 20, backgroundColor: primaryColor }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            Admin Dashboard
          </Text>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#fff', fontSize: 16, marginTop: 4 }}>
          Welcome, {user.username}
        </Text>

        <View style={styles.tabBar}>
          {(['stats', 'content'] as const).map((t) => {
            const active = t === tab;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? '#fff' : 'rgba(255,255,255,0.75)' },
                  ]}
                >
                  {t === 'stats' ? 'Statistics' : 'Manage Content'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {tab === 'content' ? (
        <ContentEditorScreen adminId={user.id} />
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <View style={{ padding: 20 }}>
            {stats ? (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginBottom: 12 }}>
                  Platform Statistics
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {stats.contentItems !== undefined && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, flex: 1, minWidth: 120 }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: primaryColor }}>
                        {stats.contentItems}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 14 }}>
                        Content Items
                      </Text>
                    </View>
                  )}
                  {stats.users !== undefined && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, flex: 1, minWidth: 120 }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: primaryColor }}>
                        {stats.users}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 14 }}>
                        Registered Users
                      </Text>
                    </View>
                  )}
                  {stats.admins !== undefined && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, flex: 1, minWidth: 120 }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: primaryColor }}>
                        {stats.admins}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 14 }}>
                        Admin Accounts
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: textSecondary, marginTop: 40 }}>
                Loading statistics...
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = {
  tabBar: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
};