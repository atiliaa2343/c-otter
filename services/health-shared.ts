import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/db/supabase';

export type WearablePlatform = 'apple_health' | 'health_connect';

// Set once the person has granted health access, so the app can sync quietly
// on launch without popping a permission prompt for someone who never opted in.
export const PERMISSION_GRANTED_KEY = 'health_permission_granted';

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

// One day of health data. Read live for "today so far" (never stored), or for
// a finished day, in which case it's saved to health_metrics.
export interface HealthSnapshot {
  date: string;
  steps: number;
  distanceMiles: number | null;
  activeCalories: number | null;
  // true when the source reported no active calories and activeCalories was
  // estimated as total minus the resting baseline (see estimateActiveCalories
  // in health.android.ts)
  activeCaloriesEstimated: boolean;
  totalCalories: number | null; // reported directly on Android; active + basal on iOS
  activityMinutes: number | null;
  // true when the source logged no exercise sessions and activityMinutes was
  // estimated from step cadence instead (see estimateActiveMinutes in health.android.ts)
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

// A minute counts as "active" when at least this many steps landed in it.
// Only used by health.android.ts's step-cadence estimate, but kept here so
// every platform's HealthService (and the UI) can reference the same value.
export const ACTIVE_STEPS_PER_MINUTE = 100; // check

// YYYY-MM-DD in the device's local time. toISOString() would convert to UTC
// first, which shifts the date for anyone whose local midnight is a different
// UTC day.
export function localDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Midnight-to-midnight window for a given calendar day.
function dayWindow(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// Noon-to-noon window ending at noon on `date` - sleep is dated by wake-up,
// not bedtime, so "last night" is noon-to-noon rather than midnight-to-midnight.
export function sleepWindowFor(date: Date): { start: Date; end: Date } {
  const end = new Date(date);
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  return { start, end };
}

// The time ranges to read for one snapshot: `day` undefined means "today so
// far" (midnight to now, sleep from noon yesterday to now); a date means that
// finished calendar day (midnight to midnight, sleep from noon the day before
// to noon that day - dated by wake-up).
export function snapshotWindows(day?: Date) {
  if (!day) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const now = new Date();
    return { dayStart, dayEnd: now, sleepStart: sleepWindowFor(now).start, sleepEnd: now };
  }
  const { start, end } = dayWindow(day);
  const sleep = sleepWindowFor(day);
  return { dayStart: start, dayEnd: end, sleepStart: sleep.start, sleepEnd: sleep.end };
}

// Whether the watch/phone recorded anything at all that day. Weight and height
// are left out on purpose: they're long-lived readings that would be present
// every day, so they can't tell a day with data from a day with none.
export function snapshotHasData(s: HealthSnapshot): boolean {
  return (
    s.steps > 0 ||
    s.distanceMiles != null ||
    s.activeCalories != null ||
    s.totalCalories != null ||
    (s.activityMinutes ?? 0) > 0 ||
    s.exerciseSessionCount > 0 ||
    s.heartRateSamples.length > 0 ||
    s.restingHeartRate != null ||
    s.sleepHours != null
  );
}

export function emptyStages(): SleepStages {
  return { awakeMinutes: 0, lightMinutes: 0, deepMinutes: 0, remMinutes: 0, unspecifiedMinutes: 0 };
}

export const minutesBetween = (start: any, end: any) =>
  Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);

// Module-level, not per instance: the root layout and the health page each
// make their own HealthService, and both run these on app open.
let recordConnectionInFlight: Promise<string | null> | null = null;
let syncInFlight: Promise<boolean> | null = null;

// Sync orchestration shared by every platform's HealthService. Each platform
// file only implements requestPlatformPermissions() and fetchSnapshot();
// everything about *when* to sync and *how* a finished day gets saved to
// health_metrics lives here once instead of being duplicated per platform.
export abstract class BaseHealthService {
  protected abstract readonly platform: WearablePlatform;
  protected abstract requestPlatformPermissions(): Promise<boolean>;
  abstract fetchSnapshot(day?: Date): Promise<HealthSnapshot | null>;

  async requestPermissions(): Promise<boolean> {
    const granted = await this.requestPlatformPermissions();
    if (granted) await AsyncStorage.setItem(PERMISSION_GRANTED_KEY, 'true').catch(() => {});
    return granted;
  }

  // Called when the app opens: logs any finished days (usually just
  // yesterday) that haven't been saved yet. Does nothing until the person has
  // granted health access once from the health data page, so it never shows a
  // permission prompt out of the blue. Re-requesting permissions here is what
  // initializes HealthKit / Health Connect for this session; it doesn't
  // prompt again once they've already answered.
  async syncOnLaunch(): Promise<void> {
    const optedIn = await AsyncStorage.getItem(PERMISSION_GRANTED_KEY).catch(() => null);
    if (!optedIn) return;
    if (!(await this.requestPermissions())) return;
    await this.syncDailySummary();
  }

  // Fetches a snapshot of today's health data.
  async fetchTodaySnapshot(): Promise<HealthSnapshot | null> {
    return this.fetchSnapshot();
  }

  // Fetches a snapshot of one finished calendar day.
  async fetchDaySnapshot(day: Date): Promise<HealthSnapshot | null> {
    return this.fetchSnapshot(day);
  }

  // Records that this device connected + which platform, so the later
  // daily-summary sync knows where readings came from. No-ops silently if
  // nobody's signed in yet — general user sign-in doesn't exist in the app
  // yet (see SignUpSystemGuide.md), and wearable_connections is RLS-locked
  // to auth.uid(), so there's nothing to attach the row to until it does.
  //
  // Reuses the most recently connected row. Older builds could create several
  // rows per platform (two callers racing on app open, then .maybeSingle()
  // erroring on the duplicates and being read as "no row"), so this must cope
  // with more than one existing.
  async recordConnection(): Promise<string | null> {
    recordConnectionInFlight ??= this.recordConnectionOnce().finally(() => {
      recordConnectionInFlight = null;
    });
    return recordConnectionInFlight;
  }

  private async recordConnectionOnce(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: existing, error: lookupError } = await supabase
      .from('wearable_connections')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('platform', this.platform)
      .order('connected_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // A failed lookup isn't "no row" — inserting here is how duplicates piled up.
    if (lookupError) {
      console.error('Error looking up wearable connection:', lookupError);
      return null;
    }

    if (existing) {
      await supabase
        .from('wearable_connections')
        .update({ connected_at: new Date().toISOString() })
        .eq('id', existing.id);
      return existing.id;
    }

    const { data: created, error } = await supabase
      .from('wearable_connections')
      .insert({ user_id: session.user.id, platform: this.platform, connected_at: new Date().toISOString() })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording wearable connection:', error);
      return null;
    }
    return created.id;
  }

  // How far back to backfill when last_synced_at is missing or very stale.
  // Matches the ~30 days Health Connect / HealthKit reliably keep on hand
  // without extra history permissions, so a longer gap wouldn't find much
  // anyway.
  private static readonly MAX_BACKFILL_DAYS = 30;

  // Saves one finished day to health_metrics as a single 'JSON' row: `value`
  // is the step count and `unit` (free text) holds the whole day as JSON,
  // since the table has no JSON column. A day that's already synced has its
  // row updated in place instead of duplicated. A day with nothing recorded
  // gets no row - missing means missing, not zero. Returns whether a row was
  // saved; throws on a save error so syncDailySummary retries next time.
  private async syncOneDay(userId: string, connectionId: string, date: Date): Promise<boolean> {
    const s = await this.fetchSnapshot(date);
    if (!s) throw new Error('Could not read health data from this device.');
    if (!snapshotHasData(s)) return false;

    const daySummary = {
      date: s.date,
      steps: s.steps,
      distanceMiles: s.distanceMiles,
      activeCalories: s.activeCalories,
      activeCaloriesEstimated: s.activeCaloriesEstimated,
      totalCalories: s.totalCalories,
      activityMinutes: s.activityMinutes,
      activityMinutesEstimated: s.activityMinutesEstimated,
      workoutSessions: s.exerciseSessionCount,
      heartRate: {
        avg: s.avgHeartRate,
        resting: s.restingHeartRate,
        readings: s.heartRateSamples,
      },
      sleep: { hours: s.sleepHours, stages: s.sleepStages },
      weightLbs: s.weightLbs,
      heightInches: s.heightInches,
    };

    const row = {
      user_id: userId,
      wearable_connection_id: connectionId,
      metric_type: 'JSON',
      value: s.steps,
      unit: JSON.stringify(daySummary),
      recorded_at: s.date,
      source: this.platform,
    };

    const { data: existing, error: lookupError } = await supabase
      .from('health_metrics')
      .select('id')
      .eq('user_id', userId)
      .eq('metric_type', 'JSON')
      .eq('recorded_at', s.date)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const { error } = existing
      ? await supabase.from('health_metrics').update(row).eq('id', existing.id)
      : await supabase.from('health_metrics').insert(row);
    if (error) throw error;
    return true;
  }

  // Backfills every finished day since the connection's last sync into
  // health_metrics. Never touches today, only yesterday and earlier - today
  // is still changing, so it's only ever read live (see HealthPlatformNotes.md).
  // Reads wearable_connections.last_synced_at to pick up wherever it left off,
  // rather than always re-syncing just yesterday, so a gap of a few days (app
  // not opened, phone off) doesn't silently lose those days' readings.
  async syncDailySummary(): Promise<boolean> {
    // The root layout and the health page both sync on open; let the second
    // caller share the first run instead of racing it.
    syncInFlight ??= this.syncDailySummaryOnce().finally(() => {
      syncInFlight = null;
    });
    return syncInFlight;
  }

  private async syncDailySummaryOnce(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    try {
      const connectionId = await this.recordConnection();
      if (!connectionId) return false;

      // Latest sync across every row for this platform, not just the one
      // recordConnection picked — older builds left duplicate rows, and the
      // sync history may be on any of them.
      const { data: connection, error: connectionError } = await supabase
        .from('wearable_connections')
        .select('last_synced_at')
        .eq('user_id', session.user.id)
        .eq('platform', this.platform)
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (connectionError) throw connectionError;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      let firstMissingDay: Date;
      if (connection?.last_synced_at) {
        // Resuming an existing connection — catch up on whatever it missed,
        // capped so a long-dormant connection doesn't try to backfill forever.
        const oldestAllowed = new Date(yesterday);
        oldestAllowed.setDate(oldestAllowed.getDate() - (BaseHealthService.MAX_BACKFILL_DAYS - 1));
        // last_synced_at is stamped with the day the sync *ran*, and that run
        // only ever covers the day before it (see the "first sync" branch
        // below) — so the run's own day is the earliest day not yet synced,
        // not the day after it.
        firstMissingDay = new Date(connection.last_synced_at);
        firstMissingDay.setHours(0, 0, 0, 0);
        if (firstMissingDay < oldestAllowed) firstMissingDay = oldestAllowed;
      } else {
        // First sync ever for this connection — nothing to catch up on yet,
        // so just grab yesterday rather than backfilling days before the
        // connection existed.
        firstMissingDay = yesterday;
      }

      for (const day = new Date(firstMissingDay); day <= yesterday; day.setDate(day.getDate() + 1)) {
        await this.syncOneDay(session.user.id, connectionId, new Date(day));
      }

      await supabase
        .from('wearable_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', connectionId);

      return true;
    } catch (error) {
      console.error('Error syncing daily summary:', error);
      return false;
    }
  }
}
