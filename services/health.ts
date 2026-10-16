import { Platform } from 'react-native';
import { supabase } from '@/db/supabase';

export type WearablePlatform = 'apple_health' | 'health_connect';

// A live read of "today so far" — never written to health_metrics, since
// that table only holds finished daily summaries (see HealthPlatformNotes.md).
export interface SleepStages {
  awakeMinutes: number;
  lightMinutes: number; // "Core" sleep on Apple Health
  deepMinutes: number;
  remMinutes: number;
  unspecifiedMinutes: number; // asleep, but the source didn't say which stage
}

export interface HeartRateSample {
  time: string; // ISO timestamp
  bpm: number;
}

export interface HealthSnapshot {
  date: string;
  steps: number;
  distanceMiles: number | null;
  activeCalories: number | null;
  // true when the source reported no active calories and activeCalories was
  // estimated as total minus the resting baseline (see estimateActiveCalories)
  activeCaloriesEstimated: boolean;
  totalCalories: number | null; // reported directly on Android; active + basal on iOS
  activityMinutes: number | null;
  // true when the source logged no exercise sessions and activityMinutes was
  // estimated from step cadence instead (see estimateActiveMinutes)
  activityMinutesEstimated: boolean;
  exerciseSessionCount: number; // logged workouts today; 0 means none, not unknown
  avgHeartRate: number | null;
  // Every heart rate reading from today, for storing in the database later.
  heartRateSamples: HeartRateSample[];
  restingHeartRate: number | null;
  sleepHours: number | null;
  sleepStages: SleepStages | null;
  weightLbs: number | null;
  heightInches: number | null;
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

// Function for height to gather data within a ten year span
function TenYearWindowStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() - 3562);
  start.setHours(12, 0, 0, 0);
  return start;
}

// A minute counts as "active" when at least this many steps landed in it.
export const ACTIVE_STEPS_PER_MINUTE = 100; // check

// Some sources (Fitbit here) never write exercise sessions, which would leave
// activity duration permanently empty. Falling back to "minutes with brisk
// stepping" gives a usable number, and the UI labels it as an estimate.
function estimateActiveMinutes(stepRecords: any[]): number {
  const perMinute = new Map<number, number>();
  for (const r of stepRecords) {
    const minute = Math.floor(new Date(r.startTime).getTime() / 60000);
    perMinute.set(minute, (perMinute.get(minute) ?? 0) + (r.count ?? 0));
  }
  let active = 0;
  perMinute.forEach((count) => {
    if (count >= ACTIVE_STEPS_PER_MINUTE) active++;
  });
  return active;
}

// Some sources (Fitbit here) write total calories but never active calories.
// Their total is a flat resting rate every minute plus extra when moving, so
// the lowest per-minute rate of the day is the resting baseline, and whatever
// is burned above it is active.
function estimateActiveCalories(totalCalorieRecords: any[]): number | null {
  let minutes = 0;
  let totalKcal = 0;
  let baselineRate = Infinity; // kcal per minute
  for (const r of totalCalorieRecords) {
    const recordMinutes = minutesBetween(r.startTime, r.endTime);
    const kcal = r.energy?.inKilocalories ?? 0;
    if (recordMinutes <= 0) continue;
    minutes += recordMinutes;
    totalKcal += kcal;
    baselineRate = Math.min(baselineRate, kcal / recordMinutes);
  }
  if (minutes === 0) return null;
  return Math.round(Math.max(0, totalKcal - baselineRate * minutes));
}

// Health Connect SleepStageType values
const HC_STAGE = { AWAKE: 1, OUT_OF_BED: 3, LIGHT: 4, DEEP: 5, REM: 6, AWAKE_IN_BED: 7 } as const;

function emptyStages(): SleepStages {
  return { awakeMinutes: 0, lightMinutes: 0, deepMinutes: 0, remMinutes: 0, unspecifiedMinutes: 0 };
}

const minutesBetween = (start: any, end: any) =>
  Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);

// HealthKit returns either a single {value} or an array of samples depending on the call.
const sumValues = (result: any): number =>
  Array.isArray(result) ? result.reduce((sum, r) => sum + (r?.value ?? 0), 0) : result?.value ?? 0;

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
            HealthKit.Constants.Permissions.DistanceWalkingRunning,
            HealthKit.Constants.Permissions.ActiveEnergyBurned,
            HealthKit.Constants.Permissions.BasalEnergyBurned, // added to active for the iOS total
            HealthKit.Constants.Permissions.AppleExerciseTime, // activity minutes
            HealthKit.Constants.Permissions.HeartRate,
            HealthKit.Constants.Permissions.RestingHeartRate,
            HealthKit.Constants.Permissions.SleepAnalysis,
            HealthKit.Constants.Permissions.BodyMass, // "Weight" is called BodyMass on iOS
            HealthKit.Constants.Permissions.Height,
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
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'RestingHeartRate' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'read', recordType: 'Height' },
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

    // Every HealthKit call is callback-style and reports errors as a string —
    // resolve null on error so one denied metric doesn't break the others.
    const call = <T>(method: string, opts: object, pick: (result: any) => T): Promise<T | null> =>
      new Promise((resolve) => {
        HealthKit[method](opts, (error: any, result: any) => {
          resolve(error || result == null ? null : pick(result));
        });
      });

    const [steps, distanceMiles, activeCalories, basalCalories, exerciseMinutes, heartSamples, restingHeartRate, sleepSamples, weightLbs, heightInches, workoutCount] =
      await Promise.all([
        call('getStepCount', options, (r) => Math.round(sumValues(r))),
        call('getDistanceWalkingRunning', { ...options, unit: 'mile' }, (r) => Number(sumValues(r).toFixed(2))),
        call('getActiveEnergyBurned', options, (r) => Math.round(sumValues(r))),
        call('getBasalEnergyBurned', options, (r) => Math.round(sumValues(r))),
        call('getAppleExerciseTime', options, (r) => Math.round(sumValues(r))),
        call('getHeartRateSamples', options, (r: any[]) => r),
        // Same wider window as sleep — resting heart rate is typically computed
        // from overnight data and dated like a sleep session, not local midnight.
        call('getRestingHeartRate', sleepOptions, (r) => Math.round(sumValues(r))),
        call('getSleepSamples', sleepOptions, (r: any[]) => r),
        call('getLatestWeight', { unit: 'pound' }, (r) => Number((r.value ?? 0).toFixed(1))),
        call('getLatestHeight', { unit: 'inch' }, (r) => Number((r.value ?? 0).toFixed(1))),
        call('getAnchoredWorkouts', options, (r) => r.data?.length ?? 0),
      ]);

    const heartRateSamples: HeartRateSample[] = (heartSamples ?? []).map((r: any) => ({
      time: new Date(r.startDate).toISOString(),
      bpm: Math.round(r.value),
    }));
    const avgHeartRate = heartRateSamples.length
      ? Math.round(heartRateSamples.reduce((sum, r) => sum + r.bpm, 0) / heartRateSamples.length)
      : null;

    // HealthKit reports sleep as one sample per stage: INBED / AWAKE / ASLEEP (unspecified) / CORE / DEEP / REM.
    let sleepStages: SleepStages | null = null;
    let inBedMinutes = 0;
    if (sleepSamples?.length) {
      const stages = emptyStages();
      for (const sample of sleepSamples) {
        const minutes = minutesBetween(sample.startDate, sample.endDate);
        switch (String(sample.value).toUpperCase()) {
          case 'AWAKE': stages.awakeMinutes += minutes; break;
          case 'CORE': stages.lightMinutes += minutes; break;
          case 'DEEP': stages.deepMinutes += minutes; break;
          case 'REM': stages.remMinutes += minutes; break;
          case 'ASLEEP': stages.unspecifiedMinutes += minutes; break;
          case 'INBED': inBedMinutes += minutes; break;
        }
      }
      sleepStages = stages;
    }
    const asleepMinutes = sleepStages
      ? sleepStages.lightMinutes + sleepStages.deepMinutes + sleepStages.remMinutes + sleepStages.unspecifiedMinutes
      : 0;
    const sleepMinutes = asleepMinutes || inBedMinutes;
    const sleepHours = sleepMinutes > 0 ? Number((sleepMinutes / 60).toFixed(1)) : null;

    return {
      date: startOfDay.toISOString().split('T')[0],
      steps: steps ?? 0,
      distanceMiles, activeCalories, activeCaloriesEstimated: false,
      totalCalories: activeCalories != null && basalCalories != null ? activeCalories + basalCalories : null,
      activityMinutes: exerciseMinutes,
      activityMinutesEstimated: false,
      exerciseSessionCount: workoutCount ?? 0,
      avgHeartRate, heartRateSamples, restingHeartRate,
      sleepHours,
      sleepStages: asleepMinutes > 0 || (sleepStages?.awakeMinutes ?? 0) > 0 ? sleepStages : null,
      weightLbs, heightInches,
    };
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
      // metric must not fail Promise.all and wipe out every other metric
      // that *did* have permission.
      const safeAggregate = (recordType: string, timeRangeFilter: any) =>
        HC.aggregateRecord({ recordType, timeRangeFilter }).catch((error: any) => {
          console.warn(`aggregateRecord(${recordType}) failed:`, error?.message ?? error);
          return null;
        });

      // readRecords is paged — follow pageToken until it runs out.
      const readAll = async (recordType: string, timeRangeFilter: any): Promise<any[]> => {
        const records: any[] = [];
        try {
          let pageToken: string | undefined;
          do {
            const page: any = await HC.readRecords(recordType, { timeRangeFilter, pageSize: 1000, pageToken });
            records.push(...(page?.records ?? []));
            pageToken = page?.pageToken || undefined;
          } while (pageToken);
        } catch (error: any) {
          console.warn(`readRecords(${recordType}) failed:`, error?.message ?? error);
        }
        return records;
      };

      // Weight is like height — people don't necessarily log it "today", so
      // grab the single newest record from the wide window.
      const readLatest = (recordType: string, timeRangeFilter: any) =>
        HC.readRecords(recordType, { timeRangeFilter, ascendingOrder: false, pageSize: 1 })
          .then((page: any) => page?.records?.[0] ?? null)
          .catch((error: any) => {
            console.warn(`readRecords(${recordType}) failed:`, error?.message ?? error);
            return null;
          });

      const [
        stepsAgg, distanceAgg, activeCalAgg, totalCalAgg, exerciseAgg,
        restingHrAgg, sleepAgg, heightAgg,
        heartRecords, sleepRecords, exerciseRecords, totalCalorieRecords, weightRecord,
      ] = await Promise.all([
        safeAggregate('Steps', todayFilter),
        safeAggregate('Distance', todayFilter),
        safeAggregate('ActiveCaloriesBurned', todayFilter),
        safeAggregate('TotalCaloriesBurned', todayFilter),
        safeAggregate('ExerciseSession', todayFilter),
        // Resting heart rate is typically computed from overnight data and
        // dated like sleep — use the same wide window, not local midnight.
        safeAggregate('RestingHeartRate', sleepFilter),
        safeAggregate('SleepSession', sleepFilter),
        safeAggregate('Height', tenyearFilter),
        readAll('HeartRate', todayFilter),
        readAll('SleepSession', sleepFilter),
        readAll('ExerciseSession', todayFilter),
        readAll('TotalCaloriesBurned', todayFilter),
        readLatest('Weight', tenyearFilter),
      ]);

      const steps = Math.round(stepsAgg?.COUNT_TOTAL ?? 0);
      const distanceMiles = distanceAgg?.dataOrigins?.length ? Number(distanceAgg.DISTANCE.inMiles.toFixed(2)) : null;
      const reportedActiveCalories = activeCalAgg?.dataOrigins?.length ? Math.round(activeCalAgg.ACTIVE_CALORIES_TOTAL.inKilocalories) : null;
      const activeCalories = reportedActiveCalories ?? (totalCalorieRecords.length ? estimateActiveCalories(totalCalorieRecords) : null);
      const activeCaloriesEstimated = reportedActiveCalories == null && activeCalories != null;
      const totalCalories = totalCalAgg?.dataOrigins?.length ? Math.round(totalCalAgg.ENERGY_TOTAL.inKilocalories) : null;
      const restingHeartRate = restingHrAgg?.dataOrigins?.length ? Math.round(restingHrAgg.BPM_AVG) : null;
      const sleepHours = sleepAgg?.dataOrigins?.length
        ? Number((sleepAgg.SLEEP_DURATION_TOTAL / 3600).toFixed(1)) // SLEEP_DURATION_TOTAL is in seconds
        : null;
      const heightInches = heightAgg?.dataOrigins?.length ? Number(heightAgg.HEIGHT_AVG.inInches.toFixed(1)) : null;
      const weightLbs = weightRecord ? Number(weightRecord.weight.inPounds.toFixed(1)) : null;

      // Every individual reading — a record is a batch of samples.
      const heartRateSamples: HeartRateSample[] = heartRecords.flatMap((record: any) =>
        (record.samples ?? []).map((sample: any) => ({ time: sample.time, bpm: sample.beatsPerMinute })),
      );
      const avgHeartRate = heartRateSamples.length
        ? Math.round(heartRateSamples.reduce((sum, s) => sum + s.bpm, 0) / heartRateSamples.length)
        : null;

      let sleepStages: SleepStages | null = null;
      for (const record of sleepRecords) {
        for (const stage of record.stages ?? []) {
          sleepStages ??= emptyStages();
          const minutes = minutesBetween(stage.startTime, stage.endTime);
          switch (stage.stage) {
            case HC_STAGE.AWAKE:
            case HC_STAGE.OUT_OF_BED:
            case HC_STAGE.AWAKE_IN_BED: sleepStages.awakeMinutes += minutes; break;
            case HC_STAGE.LIGHT: sleepStages.lightMinutes += minutes; break;
            case HC_STAGE.DEEP: sleepStages.deepMinutes += minutes; break;
            case HC_STAGE.REM: sleepStages.remMinutes += minutes; break;
            default: sleepStages.unspecifiedMinutes += minutes; // SLEEPING / UNKNOWN
          }
        }
      }

      let activityMinutes: number | null = null;
      let activityMinutesEstimated = false;
      const exerciseMinutes = exerciseAgg?.dataOrigins?.length ? Math.round(exerciseAgg.EXERCISE_DURATION_TOTAL.inSeconds / 60) : 0;
      if (exerciseMinutes > 0) {
        activityMinutes = exerciseMinutes;
      } else {
        const stepRecords = await readAll('Steps', todayFilter);
        if (stepRecords.length) {
          activityMinutes = estimateActiveMinutes(stepRecords);
          activityMinutesEstimated = true;
        }
      }

      return {
        date: startOfDay.toISOString().split('T')[0],
        steps, distanceMiles, activeCalories, activeCaloriesEstimated, totalCalories,
        activityMinutes, activityMinutesEstimated,
        exerciseSessionCount: exerciseRecords.length,
        avgHeartRate, heartRateSamples, restingHeartRate,
        sleepHours, sleepStages,
        weightLbs, heightInches,
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
