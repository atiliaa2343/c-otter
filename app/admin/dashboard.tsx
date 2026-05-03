import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BACKEND_URL } from '@/constants/BackendConfig';

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
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
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
      </View>

      {isLoading ? (
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
                  {stats.contentItems && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, flex: 1, minWidth: 120 }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: primaryColor }}>
                        {stats.contentItems}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 14 }}>
                        Content Items
                      </Text>
                    </View>
                  )}
                  {stats.users && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, flex: 1, minWidth: 120 }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: primaryColor }}>
                        {stats.users}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 14 }}>
                        Registered Users
                      </Text>
                    </View>
                  )}
                  {stats.admins && (
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