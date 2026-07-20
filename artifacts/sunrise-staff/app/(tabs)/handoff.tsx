import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { useNursingNotes } from '@/context/NursingNotesContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useWithdrawalFilters } from '@/context/WithdrawalFiltersContext';
import { RESIDENTIAL_PATIENTS, Patient, acuityColor, acuitySortOrder } from '@/data/mockData';

type Shift = 'day' | 'eve' | 'night';

const SHIFTS: { id: Shift; label: string; time: string }[] = [
  { id: 'day', label: 'Day', time: '07:00 – 15:00' },
  { id: 'eve', label: 'Eve', time: '15:00 – 23:00' },
  { id: 'night', label: 'Night', time: '23:00 – 07:00' },
];

function ShiftSelector({ current, onChange }: { current: Shift; onChange: (s: Shift) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.shiftRow, { backgroundColor: colors.navyMid }]}>
      {SHIFTS.map(s => (
        <Pressable
          key={s.id}
          style={[styles.shiftBtn, current === s.id && { backgroundColor: colors.orange }]}
          onPress={() => { Haptics.selectionAsync(); onChange(s.id); }}
        >
          <Text style={[styles.shiftBtnLabel, { color: current === s.id ? '#fff' : colors.slateLight }]}>{s.label}</Text>
          <Text style={[styles.shiftBtnTime, { color: current === s.id ? 'rgba(255,255,255,0.7)' : colors.navyLight }]}>{s.time}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function HandoffCard({
  patient,
  note,
  onNoteChange,
}: {
  patient: Patient;
  note: string;
  onNoteChange: (n: string) => void;
}) {
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const ac = acuityColor(patient.acuity);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: ac.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.bedBadge, { backgroundColor: colors.navyMid }]}>
          <Text style={styles.bedBadgeText}>{patient.bed}</Text>
        </View>
        <View style={styles.cardPatientInfo}>
          <Text style={[styles.cardName, { color: colors.navy }]}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {patient.primaryDiagnosis} · LOS {patient.los}d
          </Text>
        </View>
        <View style={[styles.acuityPill, { backgroundColor: ac.bg }]}>
          <Text style={[styles.acuityText, { color: ac.text }]}>{patient.acuity}</Text>
        </View>
      </View>

      {/* Vitals line */}
      <View style={styles.vitalsLine}>
        {patient.cows != null && (
          <View style={[styles.vitalChip, { backgroundColor: patient.cows > 12 ? colors.criticalBg : patient.cows > 8 ? colors.highBg : colors.successBg }]}>
            <Text style={[styles.vitalChipText, { color: patient.cows > 12 ? colors.critical : patient.cows > 8 ? colors.high : colors.success }]}>
              COWS {patient.cows}
            </Text>
          </View>
        )}
        {patient.ciwa != null && (
          <View style={[styles.vitalChip, { backgroundColor: patient.ciwa > 12 ? colors.criticalBg : patient.ciwa > 8 ? colors.highBg : colors.successBg }]}>
            <Text style={[styles.vitalChipText, { color: patient.ciwa > 12 ? colors.critical : patient.ciwa > 8 ? colors.high : colors.success }]}>
              CIWA {patient.ciwa}
            </Text>
          </View>
        )}
        <View style={[styles.vitalChip, { backgroundColor: colors.muted }]}>
          <Text style={[styles.vitalChipText, { color: colors.mutedForeground }]}>
            Mood {patient.mood}/10
          </Text>
        </View>
        <View style={[styles.vitalChip, { backgroundColor: colors.muted }]}>
          <Text style={[styles.vitalChipText, { color: colors.mutedForeground }]}>
            UA: {patient.lastUa}
          </Text>
        </View>
      </View>

      {/* Flags */}
      {patient.flags.length > 0 && (
        <View style={styles.flagsRow}>
          {patient.flags.map(f => (
            <View key={f} style={[styles.flagChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.flagText, { color: colors.navy }]}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Handoff note */}
      <Pressable onPress={() => setEditing(true)}>
        {editing ? (
          <TextInput
            style={[styles.noteInput, { color: colors.navy, borderColor: colors.orange, backgroundColor: colors.background }]}
            value={note}
            onChangeText={onNoteChange}
            multiline
            autoFocus
            onBlur={() => setEditing(false)}
            placeholder="Add handoff note…"
            placeholderTextColor={colors.mutedForeground}
          />
        ) : (
          <View style={[styles.noteTap, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.noteText, { color: note ? colors.navy : colors.mutedForeground }]} numberOfLines={3}>
              {note || 'Tap to add handoff note…'}
            </Text>
            <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

// NOTE: This tab does NOT render a "Discharging…" indicator.
// It sources its patient list from the static RESIDENTIAL_PATIENTS array rather
// than PatientContext, so it never reads `pendingDischarge` or
// `isPendingDischarge`.  No discharge-undo test coverage is required here; if
// this tab is ever refactored to consume PatientContext, add tests mirroring the
// pattern in __tests__/crossTabDischargeUndo.test.ts at that time.

const STORAGE_KEY_NOTES = '@sunrise_handoff_notes_2026-07-19';
const STORAGE_KEY_SHIFT = '@sunrise_handoff_shift_2026-07-19';

// ─────────────────────────────────────────────────────────────────────────────
// Persisted keys and their cold-start flash guards
// ─────────────────────────────────────────────────────────────────────────────
// Guard styles mirror the pattern in WithdrawalFiltersContext.tsx / vitals.tsx:
//
//   A) useRehydratedValue(isRehydrating, value, loadingValue)
//   B) Opacity animation — start at 0, fade to 1 once loaded.
//   C) Raw !loaded guard in JSX.
//
// ┌────────────────────────────────────────────┬─────────────────────┬───────┐
// │ AsyncStorage key                           │ Local state         │ Guard │
// ├────────────────────────────────────────────┼─────────────────────┼───────┤
// │ @sunrise_handoff_notes_<date>              │ notes               │ B     │
// │ @sunrise_handoff_shift_<date>              │ shift               │ B     │
// └────────────────────────────────────────────┴─────────────────────┴───────┘
//
// Guard B: contentOpacity starts at 0 and fades to 1 once `loaded` is true.
// Both keys are read together in a single Promise.all on mount, so a single
// opacity wrapper covers them both — the shift selector and the note list
// appear together once AsyncStorage resolves, preventing a flash of 'Day'
// shift or the static default handoff notes.
// ─────────────────────────────────────────────────────────────────────────────

export default function HandoffScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const { role, setRole } = useRole();
  const { clearNotes, getNotesForPatient } = useNursingNotes();
  const { clearAcknowledgments } = useMdAcknowledgment();
  const { clearFilters } = useWithdrawalFilters();
  const [shift, setShift] = useState<Shift>('day');
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(RESIDENTIAL_PATIENTS.map(p => [p.id, p.handoffNote ?? '']))
  );
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ── Shift selector + content rehydration guard ───────────────────────────
  // While !loaded: shimmer skeleton on the shift selector so it's never blank.
  // Once loaded: fade in the real ShiftSelector (shiftBarOpacity) and the
  // full content body (contentOpacity) together.
  // See persisted key registry above for the full guard table.
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const shiftBarOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;
  const shimmerLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!loaded) {
      shimmerLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 0.7, duration: 600, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      shimmerLoopRef.current.start();
    } else {
      shimmerLoopRef.current?.stop();
      shimmerLoopRef.current = null;
      Animated.parallel([
        Animated.timing(shiftBarOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    return () => {
      shimmerLoopRef.current?.stop();
      shimmerLoopRef.current = null;
    };
  }, [loaded]);

  // Load persisted notes on mount
  React.useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const [savedNotes, savedShift] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_NOTES),
          AsyncStorage.getItem(STORAGE_KEY_SHIFT),
        ]);
        if (savedNotes) {
          setNotes(prev => ({ ...prev, ...JSON.parse(savedNotes) }));
        }
        if (savedShift) {
          setShift(savedShift as Shift);
        }
      } catch (_) {
        // ignore storage errors
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist notes when they change (after initial load)
  React.useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
      } catch (_) {}
    })();
  }, [notes, loaded]);

  // Persist shift selection
  React.useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(STORAGE_KEY_SHIFT, shift);
      } catch (_) {}
    })();
  }, [shift, loaded]);

  const sortedPatients = [...RESIDENTIAL_PATIENTS].sort(
    (a, b) => acuitySortOrder(a.acuity) - acuitySortOrder(b.acuity)
  );

  function formatEditedTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  }

  function handleShareAll() {
    const date = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const shiftLabel = SHIFTS.find(s => s.id === shift)!;
    const lines: string[] = [];
    lines.push(`SHIFT HANDOFF — ${shiftLabel.label} Shift (${shiftLabel.time})`);
    lines.push(date);
    lines.push('');

    sortedPatients.forEach(patient => {
      // Patient header
      lines.push(`─── Bed ${patient.bed} · ${patient.firstName} ${patient.lastName} · ${patient.acuity} ───`);
      lines.push(`${patient.primaryDiagnosis} · LOS ${patient.los}d`);

      // Vitals chips
      const vitalsChips: string[] = [];
      if (patient.cows != null) vitalsChips.push(`COWS ${patient.cows}`);
      if (patient.ciwa != null) vitalsChips.push(`CIWA ${patient.ciwa}`);
      vitalsChips.push(`Mood ${patient.mood}/10`);
      vitalsChips.push(`UA: ${patient.lastUa}`);
      lines.push(vitalsChips.join(' · '));

      // Flags
      if (patient.flags.length > 0) {
        lines.push(`Flags: ${patient.flags.join(', ')}`);
      }

      // Nursing notes from context
      const nursingNotes = getNotesForPatient(patient.id);
      if (nursingNotes.length > 0) {
        lines.push('');
        lines.push('Nursing Notes:');
        nursingNotes.forEach(note => {
          const editSuffix = note.editedAt ? ` (edited ${formatEditedTime(note.editedAt)})` : '';
          const typeLabel =
            note.noteType === 'observation' ? 'Observation'
            : note.noteType === 'med-update' ? 'Med Update'
            : 'Incident';
          lines.push(`  [${typeLabel}] ${note.displayTime}${editSuffix}`);
          lines.push(`  ${note.text}`);
        });
      }

      // Handoff note (from tab's local state)
      const handoffNote = notes[patient.id];
      if (handoffNote) {
        lines.push('');
        lines.push('Handoff Note:');
        lines.push(handoffNote);
      }

      lines.push('');
    });

    const message = lines.join('\n').trim();
    Share.share({ message });
  }

  function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearNotes();
    clearAcknowledgments();
    clearFilters();
    setCompleted(true);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Shift Handoff</Text>
            <Text style={styles.headerSubtitle}>Jul 19, 2026 · {RESIDENTIAL_PATIENTS.length} patients</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.exportBtn, { backgroundColor: colors.navyLight }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleShareAll(); }}
            >
              <Ionicons name="share-outline" size={16} color={colors.slateLight} />
              <Text style={[styles.exportBtnText, { color: colors.slateLight }]}>Export</Text>
            </Pressable>
            <View style={[styles.roleToggle, { backgroundColor: colors.navyLight }]}>
              <Pressable
                style={[styles.roleBtn, role === 'nursing' && { backgroundColor: colors.orange }]}
                onPress={() => { Haptics.selectionAsync(); setRole('nursing'); }}
              >
                <Text style={[styles.roleBtnText, { color: role === 'nursing' ? '#fff' : colors.slateLight }]}>RN</Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === 'bht' && { backgroundColor: colors.orange }]}
                onPress={() => { Haptics.selectionAsync(); setRole('bht'); }}
              >
                <Text style={[styles.roleBtnText, { color: role === 'bht' ? '#fff' : colors.slateLight }]}>BHT</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Shift selector — Guard B (shimmer skeleton):
          While rehydrating (!loaded) → pulsing placeholder so the bar is never blank.
          After rehydration → real Day / Eve / Night selector fades in. */}
      {!loaded ? (
        <View style={[styles.shiftRow, { backgroundColor: colors.navyMid }]}>
          {[70, 70, 80].map((w, i) => (
            <Animated.View
              key={i}
              style={[styles.shiftBtnSkeleton, { flex: 1, opacity: shimmerAnim }]}
            />
          ))}
        </View>
      ) : (
        <Animated.View style={{ opacity: shiftBarOpacity }}>
          <ShiftSelector current={shift} onChange={setShift} />
        </Animated.View>
      )}

      {/* Content body — Guard B (opacity animation): starts invisible so handoff
          notes don't flash with stale defaults before AsyncStorage resolves. */}
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>

        {completed ? (
          <View style={styles.completedBanner}>
            <View style={[styles.completedCard, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.completedTitle, { color: colors.success }]}>Handoff Complete</Text>
              <Text style={[styles.completedSub, { color: colors.mutedForeground }]}>
                {shift === 'day' ? 'Eve' : shift === 'eve' ? 'Night' : 'Day'} shift has been notified.
              </Text>
              <Pressable
                style={[styles.undoBtn, { borderColor: colors.success }]}
                onPress={() => setCompleted(false)}
              >
                <Text style={[styles.undoText, { color: colors.success }]}>Undo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={sortedPatients}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <HandoffCard
                patient={item}
                note={notes[item.id] ?? ''}
                onNoteChange={n => setNotes(prev => ({ ...prev, [item.id]: n }))}
              />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: 120 + (Platform.OS === 'web' ? 34 : 0) }]}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <Pressable style={[styles.completeBtn, { backgroundColor: colors.orange }]} onPress={handleComplete}>
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <Text style={styles.completeBtnText}>Complete Handoff to {shift === 'day' ? 'Eve' : shift === 'eve' ? 'Night' : 'Day'} Shift</Text>
              </Pressable>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  exportBtnText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  roleToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  roleBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  shiftRow: { flexDirection: 'row', padding: 8, gap: 6 },
  shiftBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  shiftBtnLabel: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  shiftBtnTime: { fontSize: 10, marginTop: 2, fontFamily: 'Inter_400Regular' },
  shiftBtnSkeleton: { height: 52, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', margin: 4 },
  listContent: { padding: 12, gap: 10 },
  card: { borderRadius: 12, borderLeftWidth: 4, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedBadgeText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  cardPatientInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  cardSub: { fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  acuityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  acuityText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  vitalsLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  vitalChip: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  vitalChipText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  flagChip: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  flagText: { fontSize: 11, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  noteTap: { borderRadius: 8, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  noteInput: { borderRadius: 8, borderWidth: 2, padding: 10, fontSize: 13, lineHeight: 19, minHeight: 80, fontFamily: 'Inter_400Regular' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 12, borderRadius: 14, paddingVertical: 16 },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  completedBanner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  completedCard: { alignItems: 'center', gap: 12, padding: 32, borderRadius: 20, borderWidth: 2, width: '100%' },
  completedTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  completedSub: { fontSize: 15, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  undoBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 8, marginTop: 8 },
  undoText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
