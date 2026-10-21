import {
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

let AppleHealthKit: any = null;

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

// HealthKit returns either a single {value} or an array of samples depending on the call.
const sumValues = (result: any): number =>
  Array.isArray(result) ? result.reduce((sum, r) => sum + (r?.value ?? 0), 0) : result?.value ?? 0;

export class HealthService extends BaseHealthService {
  protected readonly platform = 'apple_health' as const;

  protected async requestPlatformPermissions(): Promise<boolean> {
    const HealthKit = await loadAppleHealthKit();
    if (!HealthKit) return false;

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

  async fetchSnapshot(day?: Date): Promise<HealthSnapshot | null> {
    const HealthKit = await loadAppleHealthKit();
    if (!HealthKit) return null;

    const { dayStart, dayEnd, sleepStart, sleepEnd } = snapshotWindows(day);
    const options = { startDate: dayStart.toISOString(), endDate: dayEnd.toISOString() };
    const sleepOptions = { startDate: sleepStart.toISOString(), endDate: sleepEnd.toISOString() };

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
      date: localDateString(dayStart),
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
}
