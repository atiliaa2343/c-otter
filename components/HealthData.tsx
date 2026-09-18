import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthService, HealthSnapshot } from '@/services/health';
import { HealthQuestionnaire } from '@/components/HealthQuestionnaire';

const healthService = new HealthService();

type HealthTab = 'today' | 'questionnaire';

// makes this file usable in other files
export function HealthData() {

  const [activeTab, setActiveTab] = useState<HealthTab>('today');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  // Function to check and request health data permissions
  const checkPermissions = async () => {
    setIsLoading(true);
    try {
      const granted = await healthService.requestPermissions();
      setHasPermission(granted);
      if (granted) {
        await healthService.recordConnection();
        await refreshToday();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh the health data
  const refreshToday = async () => {
    try {
      const data = await healthService.fetchTodaySnapshot();
      setSnapshot(data);
    } catch (error) {
      Alert.alert('Error', "Could not read today's health data.");
    }
  };

  const renderStat = (label: string, value: string) => (
    <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '600' }}>{label}</Text>
        <Text>{value}</Text>
      </View>
    </View>
  );


  const renderTodayContent = () => {
    if (hasPermission === null) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="medkit" size={64} color="#2563eb" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
            Health Data Access Required
          </Text>
          <Text style={{ marginTop: 8, textAlign: 'center', color: '#6b7280' }}>
            {Platform.OS === 'ios'
              ? 'Ce. OTTER reads your steps, heart rate, and sleep from Apple Health to show your daily activity.'
              : 'Ce. OTTER reads your steps, heart rate, and sleep from Health Connect to show your daily activity.'}
          </Text>
          <TouchableOpacity
            onPress={checkPermissions}
            disabled={isLoading}
            style={{ marginTop: 20, backgroundColor: '#2563eb', padding: 16, borderRadius: 8 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Grant Permission</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshToday} />}
      >
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Today So Far</Text>

          {renderStat('Steps', `${snapshot?.steps ?? 0}`)}
          {renderStat('Average Heart Rate', snapshot?.avgHeartRate ? `${snapshot.avgHeartRate} bpm` : '—')}
          {renderStat('Resting Heart Rate', snapshot?.restingHeartRate != null ? `${snapshot.restingHeartRate} bpm` : '—')}
          {renderStat('Sleep Last Night', snapshot?.sleepHours != null ? `${snapshot.sleepHours} hrs` : '—')}
          {renderStat('Distance', snapshot?.distanceMiles != null ? `${snapshot.distanceMiles} mi` : '—')}
          {renderStat('Floors Climbed', snapshot?.floorsClimbed != null ? `${snapshot.floorsClimbed}` : '—')}
          {renderStat('Active Calories', snapshot?.activeCalories != null ? `${snapshot.activeCalories} kcal` : '—')}
          {renderStat('Total Calories', snapshot?.totalCalories != null ? `${snapshot.totalCalories} kcal` : '—')}
          {renderStat('Exercise Sessions', `${snapshot?.exerciseSessionCount ?? 0}`)}
          {renderStat('Blood Pressure', snapshot?.systolic != null && snapshot?.diastolic != null ? `${snapshot.systolic}/${snapshot.diastolic} mmHg` : '—')}
          {renderStat('Oxygen Saturation', snapshot?.oxygenSaturation != null ? `${snapshot.oxygenSaturation}%` : '—')}
          {renderStat('Body Temperature', snapshot?.bodyTemperatureFahrenheit != null ? `${snapshot.bodyTemperatureFahrenheit.toFixed(1)}°F` : '—')}
          {renderStat('Weight', snapshot?.weightLbs != null ? `${snapshot.weightLbs} lbs` : '—')}
          {renderStat('Height', snapshot?.heightInches != null ? `${Math.floor(snapshot.heightInches / 12)}'${Math.round(snapshot.heightInches % 12)}"` : '—')}
          {renderStat('Body Fat', snapshot?.bodyFatPercentage != null ? `${snapshot.bodyFatPercentage}%` : '—')}
          {renderStat('Lean Body Mass', snapshot?.leanBodyMassLbs != null ? `${snapshot.leanBodyMassLbs} lbs` : '—')}
          {renderStat('Water', `${snapshot?.waterFlOz ?? 0} fl oz`)}

          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
            Pull to refresh. These numbers are read live and aren't saved yet — daily-summary syncing to your account is the next step.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderTab = (tab: HealthTab, label: string) => {
    const selected = activeTab === tab;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(tab)}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
          backgroundColor: selected ? '#2563eb' : 'transparent',
        }}
      >
        <Text style={{ fontWeight: '600', color: selected ? '#fff' : '#374151' }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          margin: 16,
          marginBottom: 0,
          padding: 4,
          borderRadius: 10,
          backgroundColor: '#e5e7eb',
        }}
      >
        {renderTab('today', 'Today')}
        {renderTab('questionnaire', 'Questionnaire')}
      </View>

      {activeTab === 'today' ? renderTodayContent() : <HealthQuestionnaire />}
    </View>
  );
}
