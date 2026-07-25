import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';

interface Skill {
  id: string;
  name: string;
  category: string;
  duration: string;
  description: string;
  steps: string[];
  icon: string;
}

const SKILLS: Skill[] = [
  // Breathing
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    category: 'Breathing',
    duration: '4 min',
    description: 'A military-grade technique to calm your nervous system instantly.',
    steps: [
      'Breathe in slowly for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale slowly for 4 counts',
      'Hold empty for 4 counts',
      'Repeat 4 times',
    ],
    icon: 'wind',
  },
  {
    id: '478-breathing',
    name: '4-7-8 Breathing',
    category: 'Breathing',
    duration: '3 min',
    description: 'Dr. Andrew Weil\'s natural tranquilizer for the nervous system.',
    steps: [
      'Exhale completely through your mouth',
      'Close your mouth, inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through your mouth for 8 counts',
      'Repeat 3-4 times',
    ],
    icon: 'wind',
  },
  {
    id: 'belly-breathing',
    name: 'Belly Breathing',
    category: 'Breathing',
    duration: '3 min',
    description: 'Diaphragmatic breathing that activates the parasympathetic nervous system.',
    steps: [
      'Place one hand on your chest, one on your belly',
      'Breathe in so your belly pushes your hand out',
      'Your chest should barely move',
      'Exhale slowly, feeling your belly fall',
      'Repeat for 2-3 minutes',
    ],
    icon: 'wind',
  },
  // Grounding
  {
    id: '54321',
    name: '5-4-3-2-1 Grounding',
    category: 'Grounding',
    duration: '3 min',
    description: 'Use all five senses to anchor yourself to the present moment.',
    steps: [
      'Name 5 things you can SEE',
      'Name 4 things you can TOUCH (and touch them)',
      'Name 3 things you can HEAR',
      'Name 2 things you can SMELL',
      'Name 1 thing you can TASTE',
    ],
    icon: 'anchor',
  },
  {
    id: 'hold-ice',
    name: 'Ice Cube Hold',
    category: 'Grounding',
    duration: '2 min',
    description: 'A sensory interrupt technique that breaks the craving cycle.',
    steps: [
      'Get an ice cube from the freezer',
      'Hold it in your palm or squeeze it',
      'Focus entirely on the sensation',
      'Notice cold, wet, temperature changes',
      'The craving often passes within 2 minutes',
    ],
    icon: 'thermometer',
  },
  {
    id: 'name-surroundings',
    name: 'Name 10 Objects',
    category: 'Grounding',
    duration: '2 min',
    description: 'Redirect attention by cataloguing your immediate environment.',
    steps: [
      'Look around the room you are in',
      'Silently name 10 specific objects you see',
      'Describe each one in detail: color, shape, texture',
      'Keep going until your mind is quiet',
      'Notice how your body feels now',
    ],
    icon: 'eye',
  },
  // Mindfulness
  {
    id: 'body-scan',
    name: 'Body Scan',
    category: 'Mindfulness',
    duration: '10 min',
    description: 'Progressive body awareness that releases tension and builds presence.',
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes and breathe slowly',
      'Start at the top of your head',
      'Slowly move attention down to your toes',
      'Notice sensation without judgment — just observe',
    ],
    icon: 'user',
  },
  {
    id: 'urge-surfing',
    name: 'Urge Surfing',
    category: 'Mindfulness',
    duration: '5 min',
    description: 'Ride the craving wave without acting on it. Developed by Alan Marlatt.',
    steps: [
      'Notice the craving without judgment',
      'Imagine it as an ocean wave building',
      'Observe the craving\'s physical sensations',
      'Breathe and watch the wave rise and fall',
      'Remember: every wave passes, and so will this',
    ],
    icon: 'activity',
  },
  {
    id: 'mindful-observation',
    name: 'Mindful Observation',
    category: 'Mindfulness',
    duration: '5 min',
    description: 'Choose one object and observe it with full, undivided attention.',
    steps: [
      'Pick any natural object: a plant, candle, or stone',
      'Look at it as if seeing it for the first time',
      'Notice colors, textures, shadows, details',
      'If your mind wanders, gently return',
      'Stay with it for 5 minutes',
    ],
    icon: 'search',
  },
  // Physical
  {
    id: 'cold-water',
    name: 'Cold Water Reset',
    category: 'Physical',
    duration: '1 min',
    description: 'Activates the dive reflex to quickly slow your heart rate.',
    steps: [
      'Go to a sink or get a bowl of cold water',
      'Splash cold water on your face 3-5 times',
      'Or submerge your wrists in cold water',
      'Focus on the sensation',
      'Take three slow breaths',
    ],
    icon: 'droplet',
  },
  {
    id: 'pmr',
    name: 'Progressive Muscle Relaxation',
    category: 'Physical',
    duration: '10 min',
    description: 'Tense and release each muscle group to discharge physical stress.',
    steps: [
      'Start with your feet — tense them tightly for 5 seconds',
      'Release suddenly and notice the relaxation',
      'Move to calves, thighs, abdomen, hands, arms, shoulders',
      'Scrunch your face muscles, then release',
      'End with 3 deep breaths',
    ],
    icon: 'zap',
  },
  {
    id: 'walk',
    name: '10-Minute Walk',
    category: 'Physical',
    duration: '10 min',
    description: 'Walking reduces cortisol and changes your physical environment.',
    steps: [
      'Put your phone away or put it on silent',
      'Step outside if possible',
      'Walk at a comfortable pace',
      'Notice what you see, hear, and feel',
      'Return feeling different than when you left',
    ],
    icon: 'map',
  },
  // Cognitive
  {
    id: 'thought-record',
    name: 'Thought Record',
    category: 'Cognitive',
    duration: '10 min',
    description: 'A CBT technique to examine and reframe automatic negative thoughts.',
    steps: [
      'Write down the upsetting thought exactly',
      'What is the evidence FOR this thought?',
      'What is the evidence AGAINST it?',
      'Write a more balanced alternative thought',
      'Rate your mood before and after',
    ],
    icon: 'file-text',
  },
  {
    id: 'opposite-action',
    name: 'Opposite Action',
    category: 'Cognitive',
    duration: '5 min',
    description: 'A DBT skill: act opposite to what your emotion urges you to do.',
    steps: [
      'Identify the emotion and its action urge',
      'Ask: is acting on this urge helpful right now?',
      'Identify the opposite behavior',
      'Do the opposite action fully, not halfway',
      'Repeat until the emotion shifts',
    ],
    icon: 'refresh-cw',
  },
  {
    id: 'gratitude-3',
    name: 'Three Good Things',
    category: 'Cognitive',
    duration: '5 min',
    description: 'Martin Seligman\'s evidence-based exercise to shift toward positive attention.',
    steps: [
      'Find a quiet place to sit',
      'Write down three things that went well today',
      'For each one, write WHY it happened',
      'It can be small: a good cup of coffee counts',
      'Practice daily for two weeks for lasting effect',
    ],
    icon: 'star',
  },
  // Social
  {
    id: 'call-sponsor',
    name: 'Call Your Sponsor',
    category: 'Social',
    duration: 'Now',
    description: 'Direct connection with someone who understands your journey.',
    steps: [
      'Open your phone contacts',
      'Find your sponsor or support person',
      'Call — don\'t text',
      'Be honest about how you are feeling',
      'Remember: asking for help is strength',
    ],
    icon: 'phone',
  },
  {
    id: 'sober-friend',
    name: 'Text a Sober Friend',
    category: 'Social',
    duration: 'Now',
    description: 'Peer connection breaks isolation and activates your support network.',
    steps: [
      'Think of someone who supports your recovery',
      'Send a genuine message: how you really are',
      'You don\'t have to have a crisis to reach out',
      'Simply connecting is the skill',
      'Respond warmly if they reply',
    ],
    icon: 'message-circle',
  },
  {
    id: 'meeting',
    name: 'Attend a Meeting',
    category: 'Social',
    duration: '60 min',
    description: 'Group support provides accountability, connection, and lived wisdom.',
    steps: [
      'Find a meeting near you (AA, NA, SMART, etc.)',
      'You don\'t have to share — just showing up counts',
      'Arrive a few minutes early',
      'Introduce yourself if you feel comfortable',
      'Notice you are not alone',
    ],
    icon: 'users',
  },
];

const CATEGORIES = ['All', 'Breathing', 'Grounding', 'Mindfulness', 'Physical', 'Cognitive', 'Social'];

function SkillCard({ skill, onUse }: { skill: Skill; onUse: () => void }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded((v) => !v);
      }}
      activeOpacity={0.85}
      style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.skillTop}>
        <View style={[styles.skillIconWrap, { backgroundColor: colors.primary + '22' }]}>
          <Feather name={skill.icon as any} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.skillName, { color: colors.foreground }]}>{skill.name}</Text>
          <View style={styles.skillMeta}>
            <View style={[styles.skillTag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.skillTagText, { color: colors.mutedForeground }]}>
                {skill.category}
              </Text>
            </View>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.skillDuration, { color: colors.mutedForeground }]}>
              {skill.duration}
            </Text>
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={styles.skillBody}>
          <Text style={[styles.skillDesc, { color: colors.mutedForeground }]}>
            {skill.description}
          </Text>
          <View style={[styles.skillSteps, { backgroundColor: colors.muted }]}>
            {skill.steps.map((step, i) => (
              <View key={i} style={styles.skillStep}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={onUse}
            style={[styles.useBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.useBtnText}>I Used This Skill</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SkillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markSkillUsed } = useApp();
  const isWeb = Platform.OS === 'web';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    let list = SKILLS;
    if (activeCategory !== 'All') {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, activeCategory]);

  const handleUse = (skillId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markSkillUsed(skillId);
  };

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Coping Skills"
        subtitle={`${SKILLS.length} evidence-based tools`}
      />

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search skills…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.pillList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(item);
              }}
              activeOpacity={0.8}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    activeCategory === item ? colors.primary : colors.card,
                  borderColor:
                    activeCategory === item ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color:
                      activeCategory === item ? '#fff' : colors.mutedForeground,
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Skills list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        renderItem={({ item }) => (
          <SkillCard skill={item} onUse={() => handleUse(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No skills match your search
            </Text>
          </View>
        }
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  pillList: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  skillCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  skillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  skillMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  skillTagText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  skillDuration: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  skillBody: { marginTop: 12, gap: 10 },
  skillDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  skillSteps: { borderRadius: 10, padding: 12, gap: 10 },
  skillStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  stepText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  useBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
