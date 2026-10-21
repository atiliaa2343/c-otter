// Fallback for any platform without its own implementation (currently just
// web — iOS and Android each have a real one in health.ios.ts / health.android.ts,
// which Metro picks automatically over this file). Health data access doesn't
// exist on the web build, so every method here is a no-op, matching how the
// old single-file version behaved for any platform besides ios/android.
import type { HealthSnapshot } from './health-shared';

export type { HealthSnapshot, SleepStages, HeartRateSample, WearablePlatform } from './health-shared';
export { ACTIVE_STEPS_PER_MINUTE } from './health-shared';

export class HealthService {
  async requestPermissions(): Promise<boolean> {
    return false;
  }

  async syncOnLaunch(): Promise<void> {}

  async fetchTodaySnapshot(): Promise<HealthSnapshot | null> {
    return null;
  }

  async fetchDaySnapshot(_day: Date): Promise<HealthSnapshot | null> {
    return null;
  }

  async recordConnection(): Promise<string | null> {
    return null;
  }

  async syncDailySummary(): Promise<boolean> {
    return false;
  }
}
