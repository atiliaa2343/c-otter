import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HealthData } from '@/components/HealthData';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/app/sign-in/AuthContext';

export default function HealthDataScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  // Only mount HealthData once signed in, so we don't ask for health
  // permissions or collect questionnaire answers that can't be saved.
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      );
    }

    if (!user) {
      return (
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color={primaryColor} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: textColor }]}>Sign in to see your health data</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            You need an account to connect your health data and save your questionnaire answers.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={() => router.replace('/sign-in/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push('/sign-in/sign_up')}>
            <Text style={{ color: textSecondary, fontSize: 14 }}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <HealthData />;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
