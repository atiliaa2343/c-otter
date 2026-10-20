import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthService, HealthSnapshot, ACTIVE_STEPS_PER_MINUTE } from '@/services/health';
import { QuestionnaireService } from '@/services/questionnaire';
import { HealthQuestionnaire } from '@/components/HealthQuestionnaire';
import { useThemeColor } from '@/hooks/useThemeColor';

const healthService = new HealthService();
const questionnaireService = new QuestionnaireService();

type HealthTab = 'today' | 'questionnaire';

const STEP_GOAL = 10000;

// Accent colors for the cards. They read on both the light and dark
// backgrounds, so they don't need per-theme variants.
const ACCENT = {
  steps: '#2563eb',
  calories: '#f97316',
  workouts: '#10b981',
  heartRate: '#8B7FE8',
  weight: '#ec4899',
  height: '#0ea5e9',
  sleep: '#6366f1',
};

const SLEEP_STAGE_COLORS = {
  deep: '#4338ca',
  rem: '#8b5cf6',
  light: '#a5b4fc',
  unspecified: '#c7d2fe',
  awake: '#fbbf24',
};

const formatNumber = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatMinutes = (minutes: number) => {
  const rounded = Math.round(minutes);
  return rounded >= 60 ? `${Math.floor(rounded / 60)}h ${rounded % 60}m` : `${rounded}m`;
};

// A ring of tick marks that fill clockwise with progress. Built from plain
// Views (each tick sits at the top of a full-height column that's rotated
// around the ring's center) so it doesn't need react-native-svg.
function ProgressRing({
  progress,
  size,
  color,
  trackColor,
  children,
}: {
  progress: number;
  size: number;
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}) {
  const ticks = 48;
  const filled = Math.round(Math.max(0, Math.min(1, progress)) * ticks);
  const tickWidth = 4;
  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: ticks }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: size / 2 - tickWidth / 2,
            width: tickWidth,
            height: size,
            transform: [{ rotate: `${(i / ticks) * 360}deg` }],
          }}
        >
          <View style={{ width: tickWidth, height: 14, borderRadius: 2, backgroundColor: i < filled ? color : trackColor }} />
        </View>
      ))}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// makes this file usable in other files
export function HealthData() {

  const [activeTab, setActiveTab] = useState<HealthTab>('today');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [hasPendingQuestionnaire, setHasPendingQuestionnaire] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');
  const trackColor = useThemeColor({}, 'backgroundTertiary');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    checkPermissions();
    // Independent of Health Connect/HealthKit permission — this only needs
    // a signed-in session, so it runs on its own rather than waiting on
    // checkPermissions (which can be denied without affecting this).
    questionnaireService.hasPendingQuestionnaire().then(setHasPendingQuestionnaire);
  }, []);

  // Function to check and request health data permissions
  const checkPermissions = async () => {
    setIsLoading(true);
    try {
      const granted = await healthService.requestPermissions();
      setHasPermission(granted);
      if (granted) {
        await healthService.recordConnection();
        // Best-effort — a sync failure shouldn't block showing today's live numbers.
        healthService.syncDailySummary().catch((error) => console.error('syncDailySummary failed:', error));
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

  const card = {
    backgroundColor: cardColor,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cardBorder,
    padding: 16,
  };

  const iconBadge = (name: keyof typeof Ionicons.glyphMap, color: string) => (
    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={16} color={color} />
    </View>
  );

  const estimatedTag = (
    <View style={{ backgroundColor: trackColor, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: textSecondary }}>EST.</Text>
    </View>
  );

  const renderStepsCard = () => {
    const steps = snapshot?.steps ?? 0;
    return (
      <View style={[card, { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }]}>
        <ProgressRing progress={steps / STEP_GOAL} size={136} color={ACCENT.steps} trackColor={trackColor}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>{formatNumber(steps)}</Text>
          <Text style={{ fontSize: 12, color: textSecondary }}>steps</Text>
          <Text style={{ fontSize: 10, color: textTertiary, marginTop: 2 }}>of {formatNumber(STEP_GOAL)}</Text>
        </ProgressRing>

        <View style={{ flex: 1, marginLeft: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {iconBadge('navigate', ACCENT.steps)}
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                {snapshot?.distanceMiles != null ? `${snapshot.distanceMiles} mi` : '—'}
              </Text>
              <Text style={{ fontSize: 12, color: textSecondary }}>Distance</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {iconBadge('time', ACCENT.workouts)}
            <View style={{ marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                  {snapshot?.activityMinutes != null ? formatMinutes(snapshot.activityMinutes) : '—'}
                </Text>
                {snapshot?.activityMinutesEstimated ? estimatedTag : null}
              </View>
              <Text style={{ fontSize: 12, color: textSecondary }}>Active time</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSmallCard = (
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    label: string,
    value: string,
    unit: string,
    note?: string,
    estimated?: boolean,
  ) => (
    <View style={[card, { flex: 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary }}>{label}</Text>
        {iconBadge(icon, color)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>{value}</Text>
        {unit ? <Text style={{ fontSize: 13, color: textSecondary, marginLeft: 4 }}>{unit}</Text> : null}
        {estimated ? estimatedTag : null}
      </View>
      {note ? <Text style={{ fontSize: 11, color: textTertiary, marginTop: 4 }}>{note}</Text> : null}
    </View>
  );

  const renderHeartRateCard = () => {
    const hasAvg = !!snapshot?.avgHeartRate;
    const readings = snapshot?.heartRateSamples.length ?? 0;
    return (
      <View style={{ backgroundColor: ACCENT.heartRate, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffffcc' }}>Heart rate</Text>
            <Ionicons name="pulse" size={14} color="#ffffffcc" style={{ marginLeft: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff' }}>{hasAvg ? `${snapshot!.avgHeartRate}` : '—'}</Text>
            {hasAvg ? <Text style={{ fontSize: 13, color: '#ffffffcc', marginLeft: 4 }}>bpm avg</Text> : null}
          </View>
          {readings ? <Text style={{ fontSize: 11, color: '#ffffffaa', marginTop: 2 }}>{readings} readings today</Text> : null}
        </View>
        {snapshot?.restingHeartRate != null ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: '#ffffffcc' }}>Resting</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>
              {snapshot.restingHeartRate} <Text style={{ fontSize: 12, fontWeight: '400' }}>bpm</Text>
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderSleepCard = () => {
    const stages = snapshot?.sleepStages;
    const segments = stages
      ? [
          { label: 'Deep', minutes: stages.deepMinutes, color: SLEEP_STAGE_COLORS.deep },
          { label: 'REM', minutes: stages.remMinutes, color: SLEEP_STAGE_COLORS.rem },
          { label: 'Light', minutes: stages.lightMinutes, color: SLEEP_STAGE_COLORS.light },
          { label: 'Unstaged', minutes: stages.unspecifiedMinutes, color: SLEEP_STAGE_COLORS.unspecified },
          { label: 'Awake', minutes: stages.awakeMinutes, color: SLEEP_STAGE_COLORS.awake },
        ].filter((s) => s.minutes > 0)
      : [];
    return (
      <View style={[card, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary }}>Sleep last night</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>
                {snapshot?.sleepHours != null ? `${snapshot.sleepHours}` : '—'}
              </Text>
              {snapshot?.sleepHours != null ? <Text style={{ fontSize: 13, color: textSecondary, marginLeft: 4 }}>hrs</Text> : null}
            </View>
          </View>
          {iconBadge('moon', ACCENT.sleep)}
        </View>

        {segments.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 14, gap: 2 }}>
              {segments.map((s) => (
                <View key={s.label} style={{ flex: s.minutes, backgroundColor: s.color }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, columnGap: 14, rowGap: 6 }}>
              {segments.map((s) => (
                <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color, marginRight: 5 }} />
                  <Text style={{ fontSize: 12, color: textSecondary }}>
                    {s.label} <Text style={{ color: textColor, fontWeight: '600' }}>{formatMinutes(s.minutes)}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>
    );
  };

  const renderTodayContent = () => {
    if (hasPermission === null) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: primaryColor + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="medkit" size={48} color={primaryColor} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center', color: textColor }}>
            Health Data Access Required
          </Text>
          <Text style={{ marginTop: 8, textAlign: 'center', color: textSecondary }}>
            {Platform.OS === 'ios'
              ? 'Ce. OTTER reads your steps, heart rate, and sleep from Apple Health to show your daily activity.'
              : 'Ce. OTTER reads your steps, heart rate, and sleep from Health Connect to show your daily activity.'}
          </Text>
          <TouchableOpacity
            onPress={checkPermissions}
            disabled={isLoading}
            style={{ marginTop: 20, backgroundColor: primaryColor, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999 }}
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

    const workouts = snapshot?.exerciseSessionCount ?? 0;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshToday} />}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>Health Overview</Text>
              <Text style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>Your daily health statistics</Text>
            </View>
            <View style={{ backgroundColor: cardColor, borderWidth: 1, borderColor: cardBorder, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {renderStepsCard()}

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {renderSmallCard(
              'flame',
              ACCENT.calories,
              'Calories',
              snapshot?.totalCalories != null ? formatNumber(snapshot.totalCalories) : '—',
              snapshot?.totalCalories != null ? 'cal' : '',
              [
                snapshot?.totalCalories != null ? 'Total burned today' : null,
                snapshot?.activeCalories != null
                  ? `${formatNumber(snapshot.activeCalories)} cal from activity${snapshot.activeCaloriesEstimated ? ' (est.)' : ''}`
                  : null,
              ].filter(Boolean).join('\n') || undefined,
            )}
            {renderSmallCard(
              'barbell',
              ACCENT.workouts,
              'Workouts',
              `${workouts}`,
              workouts === 1 ? 'session' : 'sessions',
              'Logged today',
            )}
          </View>

          {renderHeartRateCard()}

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {renderSmallCard(
              'scale',
              ACCENT.weight,
              'Weight',
              snapshot?.weightLbs != null ? `${snapshot.weightLbs}` : '—',
              snapshot?.weightLbs != null ? 'lbs' : '',
              'Latest reading',
            )}
            {renderSmallCard(
              'resize',
              ACCENT.height,
              'Height',
              snapshot?.heightInches != null
                ? `${Math.floor(snapshot.heightInches / 12)}'${Math.round(snapshot.heightInches % 12)}"`
                : '—',
              '',
              'Latest reading',
            )}
          </View>

          {renderSleepCard()}

          {snapshot?.activeCaloriesEstimated || snapshot?.activityMinutesEstimated ? (
            <Text style={{ color: textTertiary, fontSize: 12, marginBottom: 6 }}>
              EST. = estimated.
              {snapshot.activeCaloriesEstimated ? ' Calories: total calories minus your resting baseline.' : ''}
              {snapshot.activityMinutesEstimated ? ` Active time: minutes with ${ACTIVE_STEPS_PER_MINUTE}+ steps, since no workouts were logged.` : ''}
            </Text>
          ) : null}
          <Text style={{ color: textTertiary, fontSize: 12 }}>
            Pull to refresh. These numbers are read live and aren't saved. Yesterday's full summary (steps, distance, calories, activity, heart rate, sleep, weight, height) is saved to your account each time you open the app.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderTab = (tab: HealthTab, label: string, showBadge?: boolean) => {
    const selected = activeTab === tab;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(tab)}
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          paddingVertical: 10,
          borderRadius: 999,
          alignItems: 'center',
          backgroundColor: selected ? primaryColor : 'transparent',
        }}
      >
        <Text style={{ fontWeight: '600', color: selected ? '#fff' : textSecondary }}>{label}</Text>
        {showBadge && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#ef4444',
              marginLeft: 6,
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View
        style={{
          flexDirection: 'row',
          margin: 16,
          marginBottom: 0,
          padding: 4,
          borderRadius: 999,
          backgroundColor: cardColor,
          borderWidth: 1,
          borderColor: cardBorder,
        }}
      >
        {renderTab('today', 'Today')}
        {renderTab('questionnaire', 'Questionnaire', hasPendingQuestionnaire)}
      </View>

      {activeTab === 'today' ? (
        renderTodayContent()
      ) : (
        <HealthQuestionnaire onSubmitted={() => setHasPendingQuestionnaire(false)} />
      )}
    </View>
  );
}
