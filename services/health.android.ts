import {
  ACTIVE_STEPS_PER_MINUTE,
  BaseHealthService,
  HealthSnapshot,
  HeartRateSample,
  SleepStages,
  emptyStages,
  localDateString,
  minutesBetween,
  snapshotWindows,
} from './health-shared';

export type { HealthSnapshot, SleepStages, HeartRateSample, WearablePlatform } from './health-shared';
export { ACTIVE_STEPS_PER_MINUTE } from './health-shared';

let HealthConnect: any = null;

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

// Function for height to gather data within a ten year span
function TenYearWindowStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() - 3562);
  start.setHours(12, 0, 0, 0);
  return start;
}

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
  const now = Date.now();
  let baselineRate = Infinity; // kcal per minute
  for (const r of totalCalorieRecords) {
    const recordMinutes = minutesBetween(r.startTime, r.endTime);
    // Fitbit writes the current 15-minute block before it's over, holding
    // only the calories burned so far — that would read as an impossibly low
    // resting rate and inflate everything else, so only finished blocks count.
    if (recordMinutes <= 0 || new Date(r.endTime).getTime() > now) continue;
    baselineRate = Math.min(baselineRate, (r.energy?.inKilocalories ?? 0) / recordMinutes);
  }
  if (baselineRate === Infinity) return null;

  let active = 0;
  for (const r of totalCalorieRecords) {
    const recordMinutes = minutesBetween(r.startTime, r.endTime);
    if (recordMinutes <= 0) continue;
    active += Math.max(0, (r.energy?.inKilocalories ?? 0) - baselineRate * recordMinutes);
  }
  return Math.round(active);
}

// Health Connect SleepStageType values
const HC_STAGE = { AWAKE: 1, OUT_OF_BED: 3, LIGHT: 4, DEEP: 5, REM: 6, AWAKE_IN_BED: 7 } as const;

export class HealthService extends BaseHealthService {
  protected readonly platform = 'health_connect' as const;

  protected async requestPlatformPermissions(): Promise<boolean> {
    const HC = await loadHealthConnect();
    if (!HC) return false;

    try {
      const isInitialized = await HC.initialize();
      if (!isInitialized) return false;

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

  async fetchSnapshot(day?: Date): Promise<HealthSnapshot | null> {
    const HC = await loadHealthConnect();
    if (!HC) return null;

    try {
      const { dayStart, dayEnd, sleepStart, sleepEnd } = snapshotWindows(day);
      // Weight and height read "the newest one as of the end of this day", so a
      // backfilled day doesn't pick up a weigh-in from after it.
      const tenyearFilter = { operator: 'between', startTime: TenYearWindowStart().toISOString(), endTime: dayEnd.toISOString() };
      const todayFilter = { operator: 'between', startTime: dayStart.toISOString(), endTime: dayEnd.toISOString() };
      const sleepFilter = { operator: 'between', startTime: sleepStart.toISOString(), endTime: sleepEnd.toISOString() };

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

      // Weight and resting heart rate are like height — people don't
      // necessarily log them "today", so grab the single newest record from
      // the wide window instead of averaging over just today.
      const readLatest = (recordType: string, timeRangeFilter: any) =>
        HC.readRecords(recordType, { timeRangeFilter, ascendingOrder: false, pageSize: 1 })
          .then((page: any) => page?.records?.[0] ?? null)
          .catch((error: any) => {
            console.warn(`readRecords(${recordType}) failed:`, error?.message ?? error);
            return null;
          });

      const [
        stepsAgg, distanceAgg, activeCalAgg, totalCalAgg, exerciseAgg,
        sleepAgg, heightAgg,
        heartRecords, sleepRecords, exerciseRecords, totalCalorieRecords, weightRecord, restingHrRecord,
      ] = await Promise.all([
        safeAggregate('Steps', todayFilter),
        safeAggregate('Distance', todayFilter),
        safeAggregate('ActiveCaloriesBurned', todayFilter),
        safeAggregate('TotalCaloriesBurned', todayFilter),
        safeAggregate('ExerciseSession', todayFilter),
        safeAggregate('SleepSession', sleepFilter),
        safeAggregate('Height', tenyearFilter),
        readAll('HeartRate', todayFilter),
        readAll('SleepSession', sleepFilter),
        readAll('ExerciseSession', todayFilter),
        readAll('TotalCaloriesBurned', todayFilter),
        readLatest('Weight', tenyearFilter),
        // aggregateRecord('RestingHeartRate', ...) returns null the moment any
        // single reading in the window can't be aggregated (seen in practice
        // with Fitbit-sourced data), silently dropping a value that did exist.
        // Reading records directly and taking the newest one avoids that.
        // Resting heart rate is typically computed from overnight data and
        // dated like sleep — use the same wide window, not local midnight.
        readLatest('RestingHeartRate', sleepFilter),
      ]);

      const steps = Math.round(stepsAgg?.COUNT_TOTAL ?? 0);
      const distanceMiles = distanceAgg?.dataOrigins?.length ? Number(distanceAgg.DISTANCE.inMiles.toFixed(2)) : null;
      const reportedActiveCalories = activeCalAgg?.dataOrigins?.length ? Math.round(activeCalAgg.ACTIVE_CALORIES_TOTAL.inKilocalories) : null;
      // Active and total calories can come from different apps. Here the
      // phone's own step counter writes active calories while Fitbit writes
      // only totals, so the "reported" number misses every watch workout.
      // Use whichever saw more activity: the reported figure, or the one
      // derived from the total-calorie records.
      const estimatedActiveCalories = totalCalorieRecords.length ? estimateActiveCalories(totalCalorieRecords) : null;
      const useEstimate =
        estimatedActiveCalories != null && (reportedActiveCalories == null || estimatedActiveCalories > reportedActiveCalories);
      const activeCalories = useEstimate ? estimatedActiveCalories : reportedActiveCalories;
      const activeCaloriesEstimated = useEstimate;
      const totalCalories = totalCalAgg?.dataOrigins?.length ? Math.round(totalCalAgg.ENERGY_TOTAL.inKilocalories) : null;
      const restingHeartRate = restingHrRecord ? Math.round(restingHrRecord.beatsPerMinute) : null;
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
        date: localDateString(dayStart),
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
}
