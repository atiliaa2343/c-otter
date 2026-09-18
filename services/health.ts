import { Platform } from 'react-native';
import { supabase } from '@/db/supabase';

export type WearablePlatform = 'apple_health' | 'health_connect';

// A live read of "today so far" — never written to health_metrics, since
// that table only holds finished daily summaries (see HealthPlatformNotes.md).
export interface HealthSnapshot {
  date: string;
  steps: number;
  avgHeartRate: number | null;
  sleepHours: number | null;
  distanceMiles: number | null;
  floorsClimbed: number | null;
  activeCalories: number | null;
  totalCalories: number | null;
  exerciseSessionCount: number;
  restingHeartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  oxygenSaturation: number | null;
  bodyTemperatureFahrenheit: number | null;
  weightLbs: number | null;
  heightInches: number | null;
  bodyFatPercentage: number | null;
  leanBodyMassLbs: number | null;
  waterFlOz: number; // no logged water today genuinely means 0, not "unknown"
}

let AppleHealthKit: any = null;
let HealthConnect: any = null;

// Loads Healthkit
async function loadAppleHealthKit() {
  if (AppleHealthKit) return AppleHealthKit;
  try {
    const mod = await import('react-native-health');
    AppleHealthKit = mod.default ?? mod;
    return AppleHealthKit;
  } catch (e) {
    console.warn('react-native-health not available (needs a dev build, not Expo Go):', e);
    return null;
  }
}

// Loads Health Connect
async function loadHealthConnect() {
  if (HealthConnect) return HealthConnect;
  try {
    HealthConnect = await import('react-native-health-connect');
    return HealthConnect;
  } catch (e) {
    console.warn('react-native-health-connect not available (needs a dev build, not Expo Go):', e);
    return null;
  }
}

// determine the wearable platofrm based on device OS.
export function getWearablePlatform(): WearablePlatform | null {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'android') return 'health_connect';
  return null;
}

// Function to detrmine the start of when to look for sleep data
// Starts at 12pm the previous day until present time to account for late sleepers.
function sleepWindowStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(12, 0, 0, 0);
  return start;
}

function TenYearWindowStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() - 3562);
  start.setHours(12, 0, 0, 0);
  return start;
}

const ASLEEP_VALUES = new Set(['ASLEEP', 'INBED', 'CORE', 'DEEP', 'REM', 'asleep', 'inBed', 'core', 'deep', 'rem']);

// Service class to handle health data permissions and fetching
export class HealthService {

  // Request persmissions for users health data based on the device OS.
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') return this.requestIOSPermissions();
    if (Platform.OS === 'android') return this.requestAndroidPermissions();
    return false;
  }

  // Request iOS permissions
  private async requestIOSPermissions(): Promise<boolean> {
    const HealthKit = await loadAppleHealthKit();
    if (!HealthKit) return false;

    // reads needed data from HealthKit
    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [
            HealthKit.Constants.Permissions.StepCount,
            HealthKit.Constants.Permissions.HeartRate,
            HealthKit.Constants.Permissions.SleepAnalysis,
            HealthKit.Constants.Permissions.DistanceWalkingRunning,
            HealthKit.Constants.Permissions.FlightsClimbed, // not "FloorsClimbed" on iOS
            HealthKit.Constants.Permissions.ActiveEnergyBurned,
            HealthKit.Constants.Permissions.BasalEnergyBurned, // combine with Active for a "total"
            HealthKit.Constants.Permissions.Workout,
            HealthKit.Constants.Permissions.RestingHeartRate,
            HealthKit.Constants.Permissions.BloodPressureSystolic,
            HealthKit.Constants.Permissions.BloodPressureDiastolic,
            HealthKit.Constants.Permissions.OxygenSaturation,
            HealthKit.Constants.Permissions.BodyTemperature,
            HealthKit.Constants.Permissions.BodyMass, // "Weight" is called BodyMass on iOS
            HealthKit.Constants.Permissions.Height,
            HealthKit.Constants.Permissions.BodyFatPercentage,
            HealthKit.Constants.Permissions.LeanBodyMass,
            HealthKit.Constants.Permissions.Water,
          ],
          write: [],
        },
      };

      HealthKit.initHealthKit(permissions, (error: string) => {
        if (error) console.error('HealthKit permission error:', error);
        resolve(!error);
      });
    });
  }

  // Request Android permissions
  private async requestAndroidPermissions(): Promise<boolean> {
    const HC = await loadHealthConnect();
    if (!HC) return false;

    try {
      const isInitialized = await HC.initialize();
      if (!isInitialized) return false;

      // read needed data from Health Connect
      const granted = await HC.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'FloorsClimbed' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'RestingHeartRate' },
        { accessType: 'read', recordType: 'BloodPressure' },
        { accessType: 'read', recordType: 'OxygenSaturation' },
        { accessType: 'read', recordType: 'BodyTemperature' },
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'read', recordType: 'Height' },
        { accessType: 'read', recordType: 'BodyFat' },
        { accessType: 'read', recordType: 'LeanBodyMass' },
        { accessType: 'read', recordType: 'Hydration' },
        // Height is effectively static — a reading from years ago is still
        // valid "today." Normal reads are capped at the last 30 days, so
        // seeing further back needs this separate, more sensitive permission.
        { accessType: 'read', recordType: 'ReadHealthDataHistory' },
      ]);

      return Array.isArray(granted) && granted.length > 0;
    } catch (error) {
      console.error('Health Connect permission error:', error);
      return false;
    }
  }

  // Fetches a snapshot of today's health data based on the device OS.
  async fetchTodaySnapshot(): Promise<HealthSnapshot | null> {
    if (Platform.OS === 'ios') return this.fetchIOSSnapshot();
    if (Platform.OS === 'android') return this.fetchAndroidSnapshot();
    return null;
  }

  // IOS snapshot fetcher
  private async fetchIOSSnapshot(): Promise<HealthSnapshot | null> {
    const HealthKit = await loadAppleHealthKit();
    if (!HealthKit) return null;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();
    const options = { startDate: startOfDay.toISOString(), endDate: now.toISOString() };
    const sleepOptions = { startDate: sleepWindowStart().toISOString(), endDate: now.toISOString() };

    const steps = await new Promise<number>((resolve) => {
      HealthKit.getStepCount(options, (error: string, result: any) => {
        if (error || !result) return resolve(0);
        resolve(Math.round(typeof result === 'number' ? result : result.value ?? 0));
      });
    });

    const avgHeartRate = await new Promise<number | null>((resolve) => {
      HealthKit.getHeartRateSamples(options, (error: string, results: any[]) => {
        if (error || !results?.length) return resolve(null);
        const total = results.reduce((sum, r) => sum + (r.value ?? 0), 0);
        resolve(Math.round(total / results.length));
      });
    });

    const sleepHours = await new Promise<number | null>((resolve) => {
      HealthKit.getSleepSamples(sleepOptions, (error: string, results: any[]) => {
        if (error || !results?.length) return resolve(null);
        const totalMs = results
          .filter((s) => ASLEEP_VALUES.has(s.value))
          .reduce((sum, s) => sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()), 0);
        resolve(totalMs > 0 ? Number((totalMs / (1000 * 60 * 60)).toFixed(1)) : null);
      });
    });

    const distanceMiles = await new Promise<number | null>((resolve) => {
      HealthKit.getDistanceWalkingRunning({ ...options, unit: 'mile' }, (error: string, result: any) => {
        resolve(error || !result ? null : Number((result.value ?? 0).toFixed(2)));
      });
    });

    const floorsClimbed = await new Promise<number | null>((resolve) => {
      HealthKit.getFlightsClimbed(options, (error: string, result: any) => {
        resolve(error || !result ? null : Math.round(result.value ?? 0));
      });
    });

    const activeCalories = await new Promise<number | null>((resolve) => {
      HealthKit.getActiveEnergyBurned(options, (error: string, result: any) => {
        resolve(error || !result ? null : Math.round(result.value ?? 0));
      });
    });

    const basalCalories = await new Promise<number | null>((resolve) => {
      HealthKit.getBasalEnergyBurned(options, (error: string, result: any) => {
        resolve(error || !result ? null : Math.round(result.value ?? 0));
      });
    });
    const totalCalories = activeCalories != null && basalCalories != null ? activeCalories + basalCalories : null;
    // iOS has no single "total calories" call — Health Connect's TotalCaloriesBurned
    // doesn't have a HealthKit equivalent, so this is Active + Basal added manually.

    // Same wider window as sleep — resting heart rate is typically computed
    // from overnight data and dated like a sleep session, not local midnight.
    const restingHeartRate = await new Promise<number | null>((resolve) => {
      HealthKit.getRestingHeartRate(sleepOptions, (error: string, result: any) => {
        resolve(error || !result ? null : Math.round(result.value ?? 0));
      });
    });

    const bp = await new Promise<{ systolic: number; diastolic: number } | null>((resolve) => {
      HealthKit.getBloodPressureSamples(options, (error: string, results: any[]) => {
        if (error || !results?.length) return resolve(null);
        const latest = results[results.length - 1];
        resolve({ systolic: latest.bloodPressureSystolicValue, diastolic: latest.bloodPressureDiastolicValue });
      });
    });

    const oxygenSaturation = await new Promise<number | null>((resolve) => {
      HealthKit.getOxygenSaturationSamples(options, (error: string, results: any[]) => {
        resolve(error || !results?.length ? null : Math.round((results[results.length - 1].value ?? 0) * 100));
        // HealthKit reports this as a 0-1 fraction, not 0-100 — check this against a real reading
      });
    });

    const bodyTemperatureFahrenheit = await new Promise<number | null>((resolve) => {
      HealthKit.getBodyTemperatureSamples({ ...options, unit: 'fahrenheit' }, (error: string, results: any[]) => {
        resolve(error || !results?.length ? null : Number((results[results.length - 1].value ?? 0).toFixed(1)));
      });
    });

    const weightLbs = await new Promise<number | null>((resolve) => {
      HealthKit.getLatestWeight({ unit: 'pound' }, (error: string, result: any) => {
        resolve(error || !result ? null : Number((result.value ?? 0).toFixed(1)));
      });
    });

    const heightInches = await new Promise<number | null>((resolve) => {
      HealthKit.getLatestHeight({ unit: 'inch' }, (error: string, result: any) => {
        resolve(error || !result ? null : Number((result.value ?? 0).toFixed(1)));
      });
    });

    const bodyFatPercentage = await new Promise<number | null>((resolve) => {
      HealthKit.getLatestBodyFatPercentage(options, (error: string, result: any) => {
        resolve(error || !result ? null : Math.round((result.value ?? 0) * 100));
      });
    });

    const leanBodyMassLbs = await new Promise<number | null>((resolve) => {
      HealthKit.getLatestLeanBodyMass({ unit: 'pound' }, (error: string, result: any) => {
        resolve(error || !result ? null : Number((result.value ?? 0).toFixed(1)));
      });
    });

    // This library has no fl-oz unit string (verified against the native
    // source), so water comes back in liters and gets converted by hand.
    const waterFlOz = await new Promise<number>((resolve) => {
      HealthKit.getWater(options, (error: string, result: any) => {
        resolve(error || !result ? 0 : Number(((result.value ?? 0) * 33.814).toFixed(1)));
      });
    });

    const exerciseSessionCount = await new Promise<number>((resolve) => {
      HealthKit.getAnchoredWorkouts(options, (error: any, results: any) => {
        resolve(error || !results?.data ? 0 : results.data.length);
      });
    });

    return { date: startOfDay.toISOString().split('T')[0], steps, avgHeartRate, sleepHours, distanceMiles, floorsClimbed, activeCalories, totalCalories, exerciseSessionCount, restingHeartRate, systolic: bp?.systolic ?? null, diastolic: bp?.diastolic ?? null, oxygenSaturation, bodyTemperatureFahrenheit, weightLbs, heightInches, bodyFatPercentage, leanBodyMassLbs, waterFlOz };
  }

  // Android snapshot fetcher
  private async fetchAndroidSnapshot(): Promise<HealthSnapshot | null> {
    const HC = await loadHealthConnect();
    if (!HC) return null;

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();
      const tenyearFilter = { operator: 'between', startTime: TenYearWindowStart().toISOString(), endTime: now.toISOString() };
      const todayFilter = { operator: 'between', startTime: startOfDay.toISOString(), endTime: now.toISOString() };
      const sleepFilter = { operator: 'between', startTime: sleepWindowStart().toISOString(), endTime: now.toISOString() };

      // Each call is caught individually — a permission missing for one
      // metric (e.g. Blood Pressure denied) must not fail Promise.all and
      // wipe out every other metric that *did* have permission.
      const safeAggregate = (recordType: string, timeRangeFilter: any) =>
        HC.aggregateRecord({ recordType, timeRangeFilter }).catch((error: any) => {
          console.warn(`aggregateRecord(${recordType}) failed:`, error?.message ?? error);
          return null;
        });

      const [
        stepsAgg, hrAgg, sleepAgg,
        distanceAgg, floorsAgg, activeCalAgg, totalCalAgg,
        restingHrAgg, bpAgg, heightAgg, waterAgg,
      ] = await Promise.all([
        safeAggregate('Steps', todayFilter),
        safeAggregate('HeartRate', todayFilter),
        safeAggregate('SleepSession', sleepFilter),
        safeAggregate('Distance', todayFilter),
        safeAggregate('FloorsClimbed', todayFilter),
        safeAggregate('ActiveCaloriesBurned', todayFilter),
        safeAggregate('TotalCaloriesBurned', todayFilter),
        // Resting heart rate is typically computed from overnight data and
        // dated like sleep — use the same wide window, not local midnight.
        safeAggregate('RestingHeartRate', sleepFilter),
        safeAggregate('BloodPressure', todayFilter),
        safeAggregate('Height', tenyearFilter),
        safeAggregate('Hydration', todayFilter),
      ]);

      const steps = Math.round(stepsAgg?.COUNT_TOTAL ?? 0);
      const avgHeartRate = hrAgg?.dataOrigins?.length ? Math.round(hrAgg.BPM_AVG) : null;
      const sleepHours = sleepAgg?.dataOrigins?.length
        ? Number((sleepAgg.SLEEP_DURATION_TOTAL / 3600).toFixed(1)) // SLEEP_DURATION_TOTAL is in seconds
        : null;
      const distanceMiles = distanceAgg?.dataOrigins?.length ? Number(distanceAgg.DISTANCE.inMiles.toFixed(2)) : null;
      const floorsClimbed = floorsAgg?.dataOrigins?.length ? Math.round(floorsAgg.FLOORS_CLIMBED_TOTAL) : null;
      const activeCalories = activeCalAgg?.dataOrigins?.length ? Math.round(activeCalAgg.ACTIVE_CALORIES_TOTAL.inKilocalories) : null;
      const totalCalories = totalCalAgg?.dataOrigins?.length ? Math.round(totalCalAgg.ENERGY_TOTAL.inKilocalories) : null;
      const restingHeartRate = restingHrAgg?.dataOrigins?.length ? Math.round(restingHrAgg.BPM_AVG) : null;
      const systolic = bpAgg?.dataOrigins?.length ? Math.round(bpAgg.SYSTOLIC_AVG.inMillimetersOfMercury) : null;
      const diastolic = bpAgg?.dataOrigins?.length ? Math.round(bpAgg.DIASTOLIC_AVG.inMillimetersOfMercury) : null;
      const heightInches = heightAgg?.dataOrigins?.length ? Number(heightAgg.HEIGHT_AVG.inInches.toFixed(1)) : null;
      const waterFlOz = waterAgg?.dataOrigins?.length ? Number(waterAgg.VOLUME_TOTAL.inFluidOuncesUs.toFixed(1)) : 0;

      const safeReadRecords = (recordType: string, timeRangeFilter: any) =>
        HC.readRecords(recordType, { timeRangeFilter }).catch((error: any) => {
          console.warn(`readRecords(${recordType}) failed:`, error?.message ?? error);
          return null;
        });

      const [oxygenResult, tempResult, weightResult, fatResult, leanResult, exerciseResult] = await Promise.all([
        safeReadRecords('OxygenSaturation', todayFilter),
        safeReadRecords('BodyTemperature', todayFilter),
        // Weight, body fat, and lean mass are like height — people don't
        // necessarily log them "today," so use the same wide window +
        // latest-record approach rather than a today-only average.
        safeReadRecords('Weight', tenyearFilter),
        safeReadRecords('BodyFat', tenyearFilter),
        safeReadRecords('LeanBodyMass', tenyearFilter),
        safeReadRecords('ExerciseSession', todayFilter),
      ]);

      const oxygenSaturation = oxygenResult?.records?.length
        ? Math.round(oxygenResult.records[oxygenResult.records.length - 1].percentage) : null;
      const bodyTemperatureFahrenheit = tempResult?.records?.length
        ? Number(tempResult.records[tempResult.records.length - 1].temperature.inFahrenheit.toFixed(1)) : null;
      const weightLbs = weightResult?.records?.length
        ? Number(weightResult.records[weightResult.records.length - 1].weight.inPounds.toFixed(1)) : null;
      const bodyFatPercentage = fatResult?.records?.length
        ? Math.round(fatResult.records[fatResult.records.length - 1].percentage) : null;
      const leanBodyMassLbs = leanResult?.records?.length
        ? Number(leanResult.records[leanResult.records.length - 1].mass.inPounds.toFixed(1)) : null;
      const exerciseSessionCount = exerciseResult?.records?.length ?? 0;

      return {
        date: startOfDay.toISOString().split('T')[0],
        steps, avgHeartRate, sleepHours,
        distanceMiles, floorsClimbed, activeCalories, totalCalories,
        exerciseSessionCount, restingHeartRate, systolic, diastolic,
        oxygenSaturation, bodyTemperatureFahrenheit, weightLbs, heightInches,
        bodyFatPercentage, leanBodyMassLbs, waterFlOz,
      };
    } catch (error) {
      console.error('Error fetching Health Connect snapshot:', error);
      return null;
    }
  }

  // Saves the intake questionnaire someone fills out from the health data
  // page. Unlike recordConnection this is a direct user action, so instead
  // of a silent no-op it returns false when there's no session (general
  // user sign-in doesn't exist in the app yet) so the caller can tell the
  // person their answers weren't saved.
  async submitQuestionnaire(responses: Record<string, string>): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.from('questionnaire_responses').insert({
      user_id: session.user.id,
      responses,
    });

    if (error) {
      console.error('Error saving questionnaire response:', error);
      return false;
    }
    return true;
  }

  // Records that this device connected + which platform, so the later
  // daily-summary sync knows where readings came from. No-ops silently if
  // nobody's signed in yet — general user sign-in doesn't exist in the app
  // yet (see SignUpSystemGuide.md), and wearable_connections is RLS-locked
  // to auth.uid(), so there's nothing to attach the row to until it does.

  async recordConnection(): Promise<void> {
    const platform = getWearablePlatform();
    if (!platform) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: existing } = await supabase
      .from('wearable_connections')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('platform', platform)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('wearable_connections')
        .update({ connected_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('wearable_connections').insert({
        user_id: session.user.id,
        platform,
        connected_at: new Date().toISOString(),
      });
    }
  }
}
