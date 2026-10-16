// TEMPORARY RESEARCH SCREEN — safe to delete this file on its own.
//
// Nothing else in the project imports it. Expo Router picks it up as the
// route /health-export just because it lives in app/, and drops it again when
// the file is gone. Open it with the dev build's deep link:
//   adb shell am start -a android.intent.action.VIEW -d "ceotter://health-export"
// (iOS: open ceotter://health-export in Safari on the device.)
//
// It dumps every raw Health Connect (Android) / HealthKit (iOS) record for one
// day into a JSON file, with per-type record counts and byte sizes, so we can
// see how much data a full day of requests really produces.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type TypeStats = Record<string, { records: number; bytes: number }>;
interface ExportResult { uri: string; totalBytes: number; byType: TypeStats }

// Android — every Health Connect record type the app already requests.
const ANDROID_RECORD_TYPES = [
  'Steps', 'HeartRate', 'SleepSession', 'Distance', 'FloorsClimbed',
  'ActiveCaloriesBurned', 'TotalCaloriesBurned', 'ExerciseSession',
  'RestingHeartRate', 'BloodPressure', 'OxygenSaturation', 'BodyTemperature',
  'Weight', 'Height', 'BodyFat', 'LeanBodyMass', 'Hydration',
];

// Midnight-to-midnight for the chosen day, clipped to "now" for today.
function dayRange(daysAgo: number) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const now = new Date();
  return { start, end: end > now ? now : end, now };
}

async function readAndroid(start: Date, end: Date) {
  const HC: any = await import('react-native-health-connect');
  if (!(await HC.initialize())) throw new Error('Health Connect is not available on this device.');
  await HC.requestPermission(ANDROID_RECORD_TYPES.map((recordType) => ({ accessType: 'read', recordType })));

  const timeRangeFilter = { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() };
  const data: Record<string, any[]> = {};

  for (const recordType of ANDROID_RECORD_TYPES) {
    const records: any[] = [];
    try {
      // readRecords is paged — keep following pageToken until it runs out.
      let pageToken: string | undefined;
      do {
        const page: any = await HC.readRecords(recordType, { timeRangeFilter, pageSize: 1000, pageToken });
        records.push(...(page?.records ?? []));
        pageToken = page?.pageToken || undefined;
      } while (pageToken);
    } catch (error: any) {
      console.warn(`health-export: readRecords(${recordType}) failed:`, error?.message ?? error);
    }
    data[recordType] = records;
  }
  return { source: 'health_connect', timeRangeFilter, data };
}

async function readIOS(start: Date, end: Date) {
  const mod: any = await import('react-native-health');
  const HealthKit = mod.default ?? mod;
  const P = HealthKit.Constants.Permissions;

  await new Promise<void>((resolve, reject) => {
    HealthKit.initHealthKit(
      {
        permissions: {
          read: [
            P.StepCount, P.HeartRate, P.SleepAnalysis, P.DistanceWalkingRunning, P.FlightsClimbed,
            P.ActiveEnergyBurned, P.BasalEnergyBurned, P.Workout, P.RestingHeartRate,
            P.BloodPressureSystolic, P.BloodPressureDiastolic, P.OxygenSaturation, P.BodyTemperature,
            P.BodyMass, P.Height, P.BodyFatPercentage, P.LeanBodyMass, P.Water,
          ],
          write: [],
        },
      },
      (error: string) => (error ? reject(new Error(error)) : resolve()),
    );
  });

  const options = { startDate: start.toISOString(), endDate: end.toISOString(), ascending: true };
  // Every HealthKit call is callback-style; normalise the result to an array.
  const call = (method: string, extra: object = {}) =>
    new Promise<any[]>((resolve) => {
      if (typeof HealthKit[method] !== 'function') return resolve([]);
      HealthKit[method]({ ...options, ...extra }, (error: any, result: any) => {
        if (error) {
          console.warn(`health-export: ${method} failed:`, error);
          return resolve([]);
        }
        resolve(Array.isArray(result) ? result : result?.data ?? (result ? [result] : []));
      });
    });

  // HealthKit steps/distance/floors only come as time-bucketed sums (not
  // individual samples), so those three are the closest thing to "raw".
  const queries: Record<string, [string, object?]> = {
    Steps: ['getDailyStepCountSamples'],
    HeartRate: ['getHeartRateSamples'],
    SleepAnalysis: ['getSleepSamples'],
    Distance: ['getDailyDistanceWalkingRunningSamples'],
    FloorsClimbed: ['getDailyFlightsClimbedSamples'],
    ActiveEnergyBurned: ['getActiveEnergyBurned'],
    BasalEnergyBurned: ['getBasalEnergyBurned'],
    Workouts: ['getAnchoredWorkouts'],
    RestingHeartRate: ['getRestingHeartRateSamples'],
    BloodPressure: ['getBloodPressureSamples'],
    OxygenSaturation: ['getOxygenSaturationSamples'],
    BodyTemperature: ['getBodyTemperatureSamples'],
    Weight: ['getWeightSamples'],
    Height: ['getHeightSamples'],
    BodyFatPercentage: ['getBodyFatPercentageSamples'],
    LeanBodyMass: ['getLeanBodyMassSamples'],
    Water: ['getWaterSamples'],
  };

  const data: Record<string, any[]> = {};
  for (const [name, [method, extra]] of Object.entries(queries)) {
    data[name] = await call(method, extra);
  }
  return { source: 'apple_health', timeRangeFilter: options, data };
}

async function exportDay(daysAgo: number): Promise<ExportResult> {
  const { start, end, now } = dayRange(daysAgo);
  const { source, timeRangeFilter, data } =
    Platform.OS === 'ios' ? await readIOS(start, end) : await readAndroid(start, end);

  const byType: TypeStats = {};
  for (const [type, records] of Object.entries(data)) {
    byType[type] = { records: records.length, bytes: JSON.stringify(records).length };
  }

  const day = start.toISOString().split('T')[0];
  const file = new File(Paths.cache, `${source}-${day}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify({ exportedAt: now.toISOString(), day, source, timeRangeFilter, byType, data }, null, 2));
  return { uri: file.uri, totalBytes: file.size, byType };
}

export default function HealthExportScreen() {
  const [daysAgo, setDaysAgo] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  const supported = Platform.OS === 'android' || Platform.OS === 'ios';

  const run = async () => {
    setIsExporting(true);
    setResult(null);
    try {
      const exported = await exportDay(daysAgo);
      setResult(exported);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exported.uri, { mimeType: 'application/json', dialogTitle: 'Save health data JSON' });
      }
    } catch (error: any) {
      console.error('health-export error:', error);
      Alert.alert('Export failed', String(error?.message ?? error));
    } finally {
      setIsExporting(false);
    }
  };

  // Health Connect only allows reading the last 30 days without the extra
  // ReadHealthDataHistory permission, so that's how far back the picker goes.
  const dayLabel = (value: number) => {
    if (value === 0) return 'Today';
    const d = new Date();
    d.setDate(d.getDate() - value);
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`;
  };

  const dayButton = (value: number) => (
    <TouchableOpacity
      key={value}
      onPress={() => setDaysAgo(value)}
      style={{
        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center',
        backgroundColor: daysAgo === value ? '#2563eb' : '#e5e7eb',
      }}
    >
      <Text style={{ fontWeight: '600', color: daysAgo === value ? '#fff' : '#374151' }}>{dayLabel(value)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Health Export' }} />

      {!supported ? (
        <Text>Health data export only works on the Android or iOS dev build.</Text>
      ) : (
        <>
          <Text style={{ color: '#6b7280', marginBottom: 12 }}>
            Writes every raw {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} record for the chosen day
            to a JSON file, then opens the share sheet so you can send it to your computer.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
            {Array.from({ length: 31 }, (_, i) => dayButton(i))}
          </ScrollView>

          <TouchableOpacity
            onPress={run}
            disabled={isExporting}
            style={{ backgroundColor: '#374151', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 }}
          >
            {isExporting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Export JSON</Text>}
          </TouchableOpacity>

          {result && (
            <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>
                Total file size: {(result.totalBytes / 1024).toFixed(1)} KB
              </Text>
              {Object.entries(result.byType).map(([type, { records, bytes }]) => (
                <View key={type} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <Text>{type}</Text>
                  <Text>{records} records · {(bytes / 1024).toFixed(1)} KB</Text>
                </View>
              ))}
              <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>{result.uri}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
