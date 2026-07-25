import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp, ReminderSettings } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatReminderTime } from '@/utils/notifications';

const QUICK_TIMES = [
  { label: '7 AM', hour: 7, minute: 0 },
  { label: '8 AM', hour: 8, minute: 0 },
  { label: '9 AM', hour: 9, minute: 0 },
  { label: 'Noon', hour: 12, minute: 0 },
  { label: '6 PM', hour: 18, minute: 0 },
  { label: '9 PM', hour: 21, minute: 0 },
];

const MOOD_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#86EFAC', '#22C55E'];
const MOOD_LABELS = ['Very Low', 'Low', 'Okay', 'Good', 'Great'];

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MoodDot({ rating, date }: { rating: number; date: string }) {
  const colors = useColors();
  const color = MOOD_COLORS[rating - 1] ?? colors.muted;
  const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
  return (
    <View style={styles.moodDotWrap}>
      <View style={[styles.moodDot, { backgroundColor: color }]} />
      <Text style={[styles.moodDotLabel, { color: colors.mutedForeground }]}>{dayLabel}</Text>
    </View>
  );
}

function EmptyMoodDot({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.moodDotWrap}>
      <View style={[styles.moodDot, { backgroundColor: colors.muted }]} />
      <Text style={[styles.moodDotLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSobrietyDays, lessonsCompleted, skillsUsed, journalEntries, dailyMoods, reminderSettings, updateReminderSettings } = useApp();
  const isWeb = Platform.OS === 'web';

  const handleToggleReminder = async (enabled: boolean) => {
    const next: ReminderSettings = { ...reminderSettings, enabled };
    await updateReminderSettings(next);
    if (enabled && isWeb) {
      Alert.alert('Mobile only', 'Push notifications require the Grow mobile app.');
    }
  };

  const handlePickTime = async (hour: number, minute: number) => {
    const next: ReminderSettings = { ...reminderSettings, hour, minute };
    await updateReminderSettings(next);
  };

  const daysSober = getSobrietyDays();
  const skillsThisWeek = skillsUsed.filter((s) => {
    const ts = parseInt(s.split('_')[1] ?? '0', 10);
    return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
  }).length;

  // Build last 7 days mood data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const moodMap = Object.fromEntries(dailyMoods.map((m) => [m.date, m.rating]));

  // Recent journal entries (last 5)
  const recentJournals = journalEntries.slice(0, 5);

  const avgMood =
    dailyMoods.length > 0
      ? (dailyMoods.reduce((sum, m) => sum + m.rating, 0) / dailyMoods.length).toFixed(1)
      : null;

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="My Progress" subtitle="Your recovery journey at a glance" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            value={daysSober}
            label="Days Sober"
            icon="clock"
            color="#F97316"
          />
          <StatCard
            value={lessonsCompleted.length}
            label="Lessons Done"
            icon="book-open"
            color="#FBBF24"
          />
          <StatCard
            value={skillsThisWeek}
            label="Skills This Week"
            icon="zap"
            color="#38BDF8"
          />
          <StatCard
            value={journalEntries.length}
            label="Journal Entries"
            icon="edit-3"
            color="#22C55E"
          />
        </View>

        {/* Mood chart */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          MOOD — LAST 7 DAYS
        </Text>
        <View style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.moodRow}>
            {last7.map((date, i) => {
              const rating = moodMap[date];
              const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
              return rating !== undefined ? (
                <MoodDot key={date} rating={rating} date={date} />
              ) : (
                <EmptyMoodDot key={date} label={dayLabel} />
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.moodLegend}>
            {MOOD_COLORS.map((c, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                  {MOOD_LABELS[i]}
                </Text>
              </View>
            ))}
          </View>

          {avgMood !== null && (
            <View style={[styles.avgRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>Overall average</Text>
              <View style={[styles.avgBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.avgValue, { color: colors.primary }]}>{avgMood} / 5</Text>
              </View>
            </View>
          )}

          {dailyMoods.length === 0 && (
            <View style={styles.moodEmpty}>
              <Feather name="smile" size={24} color={colors.mutedForeground} />
              <Text style={[styles.moodEmptyText, { color: colors.mutedForeground }]}>
                Check in daily on the Today tab to see your mood trend here.
              </Text>
            </View>
          )}
        </View>

        {/* Weekly lesson completion */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          LESSONS COMPLETED
        </Text>
        <View style={[styles.lessonBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.lessonBarTop}>
            <Text style={[styles.lessonBarNum, { color: colors.foreground }]}>
              {lessonsCompleted.length}
            </Text>
            <Text style={[styles.lessonBarLabel, { color: colors.mutedForeground }]}>
              total lessons
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, (lessonsCompleted.length / 7) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
            {lessonsCompleted.length >= 7
              ? 'You have completed at least one lesson per day this week!'
              : `${7 - Math.min(lessonsCompleted.length, 7)} more to complete a full week`}
          </Text>
        </View>

        {/* Daily reminder settings */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DAILY REMINDER
        </Text>
        <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Toggle row */}
          <View style={styles.reminderToggleRow}>
            <View style={[styles.reminderIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderToggleLabel, { color: colors.foreground }]}>
                Check-in reminder
              </Text>
              <Text style={[styles.reminderToggleSub, { color: colors.mutedForeground }]}>
                {reminderSettings.enabled && !isWeb
                  ? `Every day at ${formatReminderTime(reminderSettings.hour, reminderSettings.minute)}`
                  : isWeb
                  ? 'Requires the mobile app'
                  : 'Off'}
              </Text>
            </View>
            <Switch
              value={reminderSettings.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
              disabled={isWeb}
            />
          </View>

          {/* Time picker (when enabled and not web) */}
          {reminderSettings.enabled && !isWeb && (
            <>
              <View style={[styles.reminderDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.reminderTimeLabel, { color: colors.mutedForeground }]}>
                REMINDER TIME
              </Text>
              <View style={styles.quickTimeRow}>
                {QUICK_TIMES.map((t) => {
                  const selected = t.hour === reminderSettings.hour && t.minute === reminderSettings.minute;
                  return (
                    <TouchableOpacity
                      key={t.label}
                      onPress={() => handlePickTime(t.hour, t.minute)}
                      style={[
                        styles.quickTimeChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.muted,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickTimeText,
                          { color: selected ? '#fff' : colors.foreground },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Journal entries */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          RECENT JOURNAL ENTRIES
        </Text>
        {recentJournals.length === 0 ? (
          <View style={[styles.emptyJournal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="edit-3" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyJournalText, { color: colors.mutedForeground }]}>
              No entries yet. Tap the journal prompt on the Today tab to start reflecting.
            </Text>
          </View>
        ) : (
          recentJournals.map((entry) => (
            <View
              key={entry.id}
              style={[styles.journalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.journalMeta}>
                <Feather name="edit-3" size={13} color={colors.accent} />
                <Text style={[styles.journalDate, { color: colors.mutedForeground }]}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={[styles.journalPrompt, { color: colors.mutedForeground }]} numberOfLines={1}>
                {entry.prompt}
              </Text>
              <Text style={[styles.journalText, { color: colors.foreground }]} numberOfLines={3}>
                {entry.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  moodCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  moodDotWrap: { alignItems: 'center', gap: 4, flex: 1 },
  moodDot: { width: 28, height: 28, borderRadius: 14 },
  moodDotLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  moodLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avgLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  avgBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  avgValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  moodEmpty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  moodEmptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  lessonBar: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  lessonBarTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  lessonBarNum: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  lessonBarLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  emptyJournal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyJournalText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  journalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginBottom: 2,
  },
  journalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  journalDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  journalPrompt: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  journalText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  reminderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
    gap: 4,
  },
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderToggleLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  reminderToggleSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  reminderDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  reminderTimeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  quickTimeText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
