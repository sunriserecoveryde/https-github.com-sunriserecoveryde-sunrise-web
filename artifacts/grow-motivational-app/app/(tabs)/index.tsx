import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const DAILY_LESSONS = [
  {
    id: 'sun',
    day: 0,
    category: 'Reflection',
    title: 'Reframing Your Story',
    duration: '5 min',
    content:
      'Recovery is not the absence of struggle — it is proof that you are stronger than what you fought. Today, practice reframing a past setback as evidence of your resilience. Write one sentence that begins: "Because I went through that, I now know…"',
    tip: 'Cognitive reframing is a core CBT skill that rewires how you interpret difficult events.',
  },
  {
    id: 'mon',
    day: 1,
    category: 'Awareness',
    title: 'Understanding Your Triggers',
    duration: '6 min',
    content:
      'Triggers are people, places, feelings, or events that spark cravings. They are not your enemy — they are information. Today, identify your top three personal triggers and write them down. Awareness is the first step to response-ability.',
    tip: 'Most triggers fall into four buckets: HALT — Hungry, Angry, Lonely, Tired.',
  },
  {
    id: 'tue',
    day: 2,
    category: 'Mindfulness',
    title: 'The Power of This Moment',
    duration: '5 min',
    content:
      'Cravings and anxiety often live in the past or future. The present moment, right now, is manageable. Spend two minutes doing nothing but observing what you can see, hear, and feel around you. Notice that in this exact moment, you are okay.',
    tip: 'Mindfulness reduces cravings by decreasing activity in the default mode network.',
  },
  {
    id: 'wed',
    day: 3,
    category: 'Connection',
    title: 'Your Support Network',
    duration: '4 min',
    content:
      'No one recovers alone. Research consistently shows that the quality of your relationships is one of the strongest predictors of long-term recovery. Today, reach out to one person in your support network — a text, a call, or a coffee.',
    tip: 'Isolation amplifies cravings. Connection is medicine.',
  },
  {
    id: 'thu',
    day: 4,
    category: 'Wellness',
    title: 'Managing Stress in Recovery',
    duration: '7 min',
    content:
      'Stress is the number-one trigger for relapse. The good news: stress is manageable. Today, practice one stress reduction tool — box breathing, a walk, or progressive muscle relaxation. Treat stress management as a non-negotiable part of your recovery plan.',
    tip: 'Even 10 minutes of moderate exercise reduces cortisol by up to 26%.',
  },
  {
    id: 'fri',
    day: 5,
    category: 'Growth',
    title: 'Celebrating Your Progress',
    duration: '4 min',
    content:
      "Milestones matter. Your brain's reward system responds to recognition — even self-recognition. Today, name three things you have done differently since choosing recovery. Big or small, they count. Celebrate yourself out loud, even if it feels awkward.",
    tip: 'Positive reinforcement strengthens the neural pathways of recovery behavior.',
  },
  {
    id: 'sat',
    day: 6,
    category: 'Self-Care',
    title: 'Rest Is Recovery',
    duration: '5 min',
    content:
      'Sleep deprivation dramatically increases cravings, irritability, and risk of relapse. Tonight, commit to a wind-down routine: dim lights 30 minutes before bed, put your phone away, and do something calming. Sleep is not laziness — it is healing.',
    tip: 'Poor sleep reduces prefrontal cortex function — the part of your brain that says no to cravings.',
  },
];

const JOURNAL_PROMPTS = [
  'What is one thing that went well today, no matter how small?',
  'What emotion am I carrying right now, and where do I feel it in my body?',
  'Who has supported my recovery journey, and how can I express gratitude?',
  'What would I tell a close friend who was struggling with what I am facing today?',
  'What is one small action I can take tomorrow to move closer to the life I want?',
];

const MOOD_ICONS: [string, string][] = [
  ['😞', 'Very Low'],
  ['😕', 'Low'],
  ['😐', 'Okay'],
  ['🙂', 'Good'],
  ['😊', 'Great'],
];

function MoodIcon({ index, selected, onPress }: { index: number; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.moodBtn,
        { backgroundColor: selected ? colors.primary + '22' : colors.card, borderColor: selected ? colors.primary : colors.border },
      ]}
    >
      <Text style={styles.moodEmoji}>{MOOD_ICONS[index][0]}</Text>
      {selected && <Text style={[styles.moodLabel, { color: colors.primary }]}>{MOOD_ICONS[index][1]}</Text>}
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, getSobrietyDays, completeLesson, lessonsCompleted, recordMood, getTodayMood, addJournalEntry } = useApp();
  const isWeb = Platform.OS === 'web';

  const dayOfWeek = new Date().getDay();
  const lesson = DAILY_LESSONS.find((l) => l.day === dayOfWeek) ?? DAILY_LESSONS[0];
  const isLessonDone = lessonsCompleted.includes(lesson.id);
  const todayMood = getTodayMood();
  const sobrietyDays = getSobrietyDays();

  const [lessonExpanded, setLessonExpanded] = useState(false);
  const [journalVisible, setJournalVisible] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalDone, setJournalDone] = useState(false);
  const todayPrompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length];

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = userName && userName !== 'Friend' ? `, ${userName}` : '';

  const handleMood = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordMood(rating);
  };

  const handleCompleteLesson = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeLesson(lesson.id);
    setLessonExpanded(false);
  };

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    addJournalEntry(todayPrompt, journalText.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJournalDone(true);
    setJournalText('');
    setTimeout(() => {
      setJournalVisible(false);
      setJournalDone(false);
    }, 1200);
  };

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={`${greeting}${displayName}`} subtitle="Today's journey" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      >
        {/* Streak banner */}
        <LinearGradient
          colors={['#F97316', '#FBBF24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.streakBanner}
        >
          <View>
            <Text style={styles.streakNum}>{sobrietyDays}</Text>
            <Text style={styles.streakLabel}>days in recovery</Text>
          </View>
          <View style={styles.streakRight}>
            <Ionicons name="flame" size={40} color="rgba(255,255,255,0.6)" />
          </View>
        </LinearGradient>

        {/* Daily lesson */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S LESSON</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLessonExpanded((v) => !v);
          }}
          activeOpacity={0.85}
          style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.lessonTop}>
            <View
              style={[styles.lessonCategory, { backgroundColor: colors.primary + '22' }]}
            >
              <Text style={[styles.lessonCategoryText, { color: colors.primary }]}>
                {lesson.category}
              </Text>
            </View>
            <View style={styles.lessonMeta}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.lessonDuration, { color: colors.mutedForeground }]}>
                {lesson.duration}
              </Text>
              {isLessonDone && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
            </View>
          </View>
          <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{lesson.title}</Text>

          {lessonExpanded && (
            <View style={styles.lessonBody}>
              <Text style={[styles.lessonContent, { color: colors.foreground }]}>
                {lesson.content}
              </Text>
              <View style={[styles.lessonTip, { backgroundColor: colors.muted }]}>
                <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                <Text style={[styles.lessonTipText, { color: colors.mutedForeground }]}>
                  {lesson.tip}
                </Text>
              </View>
              {!isLessonDone && (
                <TouchableOpacity
                  onPress={handleCompleteLesson}
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.doneBtnText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.lessonChevron}>
            <Feather
              name={lessonExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </TouchableOpacity>

        {/* Mood check-in */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HOW ARE YOU FEELING?</Text>
        <View style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {todayMood !== null ? (
            <View style={styles.moodDone}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Text style={[styles.moodDoneText, { color: colors.foreground }]}>
                Check-in recorded — {MOOD_ICONS[todayMood - 1][1]}
              </Text>
            </View>
          ) : (
            <View style={styles.moodRow}>
              {MOOD_ICONS.map((_, i) => (
                <MoodIcon
                  key={i}
                  index={i}
                  selected={todayMood === i + 1}
                  onPress={() => handleMood(i + 1)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Journal prompt */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          TODAY'S JOURNAL PROMPT
        </Text>
        <TouchableOpacity
          onPress={() => setJournalVisible(true)}
          activeOpacity={0.85}
          style={[styles.journalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.journalIcon, { backgroundColor: colors.accent + '22' }]}>
            <Feather name="edit-3" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.journalPrompt, { color: colors.foreground }]} numberOfLines={2}>
              {todayPrompt}
            </Text>
            <Text style={[styles.journalCta, { color: colors.primary }]}>Tap to reflect →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Journal modal */}
      <Modal visible={journalVisible} animationType="slide" transparent onRequestClose={() => setJournalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setJournalVisible(false)}>
          <Pressable
            style={[styles.journalSheet, { backgroundColor: colors.card, paddingBottom: isWeb ? 40 : insets.bottom + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.journalModalTitle, { color: colors.foreground }]}>Journal</Text>
            <Text style={[styles.journalModalPrompt, { color: colors.mutedForeground }]}>
              {todayPrompt}
            </Text>
            {journalDone ? (
              <View style={styles.journalSuccess}>
                <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
                <Text style={[styles.journalSuccessText, { color: colors.foreground }]}>Saved!</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.journalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  multiline
                  placeholder="Write your reflection…"
                  placeholderTextColor={colors.mutedForeground}
                  value={journalText}
                  onChangeText={setJournalText}
                  autoFocus
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <TouchableOpacity
                  onPress={handleSaveJournal}
                  disabled={!journalText.trim()}
                  style={[styles.journalSave, { backgroundColor: journalText.trim() ? colors.primary : colors.muted }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.journalSaveText, { color: journalText.trim() ? '#fff' : colors.mutedForeground }]}>
                    Save Entry
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  streakBanner: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakNum: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 56,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },
  streakRight: { opacity: 0.7 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  lessonCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  lessonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonCategory: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  lessonCategoryText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  lessonTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  lessonBody: { marginTop: 14, gap: 12 },
  lessonContent: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  lessonTip: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  lessonTipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  lessonChevron: { alignItems: 'center', marginTop: 10 },
  moodCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  moodDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  moodDoneText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  journalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  journalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalPrompt: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
    marginBottom: 4,
  },
  journalCta: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  journalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  journalModalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  journalModalPrompt: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  journalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 140,
    lineHeight: 22,
  },
  journalSave: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  journalSaveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  journalSuccess: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  journalSuccessText: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
});
