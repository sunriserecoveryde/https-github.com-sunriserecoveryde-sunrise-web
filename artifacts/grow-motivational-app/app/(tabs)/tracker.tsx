import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';

interface Milestone {
  days: number;
  label: string;
  message: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  { days: 1, label: '24 Hours', message: 'First day. The hardest step taken.', icon: 'sunrise' },
  { days: 3, label: '3 Days', message: 'Through the hardest withdrawal window.', icon: 'star' },
  { days: 7, label: '1 Week', message: 'One full week of commitment.', icon: 'award' },
  { days: 14, label: '2 Weeks', message: 'Building real momentum now.', icon: 'trending-up' },
  { days: 30, label: '30 Days', message: 'One month — a genuine milestone.', icon: 'calendar' },
  { days: 60, label: '60 Days', message: 'Two months of strength.', icon: 'shield' },
  { days: 90, label: '90 Days', message: 'Quarter year. Your brain is healing.', icon: 'zap' },
  { days: 180, label: '6 Months', message: 'Half a year of freedom.', icon: 'heart' },
  { days: 365, label: '1 Year', message: 'One full year. Extraordinary.', icon: 'award' },
  { days: 730, label: '2 Years', message: 'Two years of growth and renewal.', icon: 'award' },
  { days: 1825, label: '5 Years', message: 'Five years. A transformed life.', icon: 'award' },
];

function MilestoneItem({
  milestone,
  daysSober,
}: {
  milestone: Milestone;
  daysSober: number;
}) {
  const colors = useColors();
  const achieved = daysSober >= milestone.days;
  const isNext = !achieved && daysSober < milestone.days;
  const remaining = milestone.days - daysSober;

  return (
    <View
      style={[
        styles.milestoneRow,
        {
          backgroundColor: achieved ? '#1A2E1A' : colors.card,
          borderColor: achieved ? '#22C55E' : isNext ? colors.primary : colors.border,
          borderWidth: isNext ? 1.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.milestoneIcon,
          {
            backgroundColor: achieved ? '#22C55E' : isNext ? colors.primary + '33' : colors.muted,
          },
        ]}
      >
        <Feather
          name={milestone.icon as any}
          size={16}
          color={achieved ? '#fff' : isNext ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.milestoneTop}>
          <Text
            style={[
              styles.milestoneLabel,
              { color: achieved ? '#22C55E' : isNext ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {milestone.label}
          </Text>
          {achieved && (
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          )}
          {isNext && (
            <View style={[styles.nextBadge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.nextBadgeText, { color: colors.primary }]}>Next</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.milestoneMessage,
            { color: achieved ? '#86EFAC' : colors.mutedForeground },
          ]}
        >
          {achieved ? milestone.message : isNext ? `${remaining} day${remaining === 1 ? '' : 's'} away` : milestone.message}
        </Text>
      </View>
    </View>
  );
}

export default function TrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSobrietyDays, sobrietyStartDate, resetSobriety, userType, userName } = useApp();
  const isWeb = Platform.OS === 'web';

  const daysSober = getSobrietyDays();
  const nextMilestone = MILESTONES.find((m) => m.days > daysSober);
  const daysToNext = nextMilestone ? nextMilestone.days - daysSober : 0;

  const startDateDisplay = sobrietyStartDate
    ? new Date(sobrietyStartDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

  const hoursDisplay = Math.floor((daysSober * 24) % 24);
  const weeksDisplay = Math.floor(daysSober / 7);
  const monthsDisplay = Math.floor(daysSober / 30);

  const handleReset = () => {
    Alert.alert(
      'Reset Sobriety Counter',
      'This will set your sobriety start date to today. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetSobriety();
          },
        },
      ],
    );
  };

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  // Only show sobriety tracker for individuals
  if (userType !== 'individual' && userType !== '') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Tracker" />
        <View style={styles.nonIndividual}>
          <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.nonIndividualTitle, { color: colors.foreground }]}>
            Recovery Tracker
          </Text>
          <Text style={[styles.nonIndividualSub, { color: colors.mutedForeground }]}>
            The sobriety tracker is designed for individuals in recovery. If you support someone in
            recovery, encourage them to track their progress in their own Grow account.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="My Tracker"
        subtitle={sobrietyStartDate ? `Since ${startDateDisplay}` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      >
        {/* Main counter */}
        <LinearGradient
          colors={['#F97316', '#FBBF24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.counterCard}
        >
          <Text style={styles.counterNum}>{daysSober}</Text>
          <Text style={styles.counterLabel}>days in recovery</Text>
          {userName && userName !== 'Friend' && (
            <Text style={styles.counterName}>Keep going, {userName}</Text>
          )}
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Weeks', value: weeksDisplay },
            { label: 'Months', value: monthsDisplay },
            { label: 'To next', value: `${daysToNext}d` },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Next milestone banner */}
        {nextMilestone && (
          <View
            style={[
              styles.nextBanner,
              { backgroundColor: colors.card, borderColor: colors.primary + '44' },
            ]}
          >
            <Ionicons name="flag-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextBannerTitle, { color: colors.foreground }]}>
                Next: {nextMilestone.label}
              </Text>
              <Text style={[styles.nextBannerSub, { color: colors.mutedForeground }]}>
                {daysToNext} day{daysToNext === 1 ? '' : 's'} until "{nextMilestone.message}"
              </Text>
            </View>
          </View>
        )}

        {/* Milestones */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MILESTONES</Text>
        {MILESTONES.map((milestone) => (
          <MilestoneItem key={milestone.days} milestone={milestone} daysSober={daysSober} />
        ))}

        {/* Reset */}
        <TouchableOpacity
          onPress={handleReset}
          activeOpacity={0.8}
          style={[styles.resetBtn, { borderColor: colors.destructive + '44' }]}
        >
          <Feather name="refresh-cw" size={14} color={colors.destructive} />
          <Text style={[styles.resetText, { color: colors.destructive }]}>
            Reset Counter
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Relapse is not failure — it is part of many recovery journeys. What matters is what you do
          next. In crisis, call 988.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  counterCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 4,
  },
  counterNum: {
    fontSize: 64,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 70,
  },
  counterLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  counterName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  nextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextBannerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  nextBannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 6,
    marginLeft: 2,
    marginBottom: 2,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  milestoneLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  milestoneMessage: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nextBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  resetText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  nonIndividual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  nonIndividualTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  nonIndividualSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
