import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GroupRecorderModal } from '@/components/GroupRecorderModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { usePatients } from '@/context/PatientContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useNursingNotes } from '@/context/NursingNotesContext';
import { useCensusFilters } from '@/context/CensusFiltersContext';
import {
  BEDS,
  VITALS,
  Patient,
  Acuity,
  acuityColor,
} from '@/data/mockData';

type NoteFilter = 'observation' | 'med-update' | 'incident';
type AcuityFilter = 'All' | Acuity | 'Available';
// NoteFilter and AcuityFilter are also exported from CensusFiltersContext — keep local
// definitions so the rest of this file stays self-contained (the context's types are
// structurally identical; TypeScript will accept them interchangeably).

const ACUITY_FILTERS: AcuityFilter[] = ['All', 'Critical', 'High', 'Moderate', 'Routine', 'Available'];
const NOTE_TYPE_FILTERS: { value: NoteFilter; label: string }[] = [
  { value: 'observation', label: 'Observation' },
  { value: 'med-update', label: 'Med Update' },
  { value: 'incident', label: 'Incident' },
];
const NOTE_FILTER_VALUES: string[] = NOTE_TYPE_FILTERS.map(n => n.value);

// ─── Shift label ──────────────────────────────────────────────────────────────
// Day:     07:00 – 14:59
// Evening: 15:00 – 22:59
// Night:   23:00 – 06:59

function getShiftLabel(): string {
  const now = new Date();
  const h = now.getHours();
  let shift: string;
  if (h >= 7 && h < 15) {
    shift = 'Day Shift';
  } else if (h >= 15 && h < 23) {
    shift = 'Evening Shift';
  } else {
    shift = 'Night Shift';
  }
  const month = now.toLocaleString('en-US', { month: 'short' });
  const day = now.getDate();
  return `${month} ${day} · ${shift}`;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function getScoreStyle(score: number, threshold: number, colors: ReturnType<typeof useColors>) {
  if (score >= threshold) return { bg: colors.criticalBg, text: colors.critical };
  const mid = threshold * 0.65;
  if (score >= mid) return { bg: colors.highBg, text: colors.high };
  if (score >= mid * 0.5) return { bg: colors.moderateBg, text: colors.moderate };
  return { bg: colors.successBg, text: colors.success };
}

// ─── Score trend helper ───────────────────────────────────────────────────────

type Trend = 'rising' | 'falling' | 'stable';

function getScoreTrend(patientId: string, key: 'cows' | 'ciwa'): Trend | null {
  const entries = VITALS[patientId];
  if (!entries || entries.length < 2) return null;
  // entries[0] is most recent, entries[1] is previous
  const latest = entries[0][key];
  const prev   = entries[1][key];
  if (latest == null || prev == null) return null;
  if (latest > prev) return 'rising';
  if (latest < prev) return 'falling';
  return 'stable';
}

function trendArrow(trend: Trend): string {
  if (trend === 'rising')  return ' ↑';
  if (trend === 'falling') return ' ↓';
  return ' →';
}

function trendColor(trend: Trend, colors: ReturnType<typeof useColors>): string {
  if (trend === 'rising')  return colors.critical;
  if (trend === 'falling') return colors.success;
  return colors.mutedForeground;
}

// ─── Note type label ──────────────────────────────────────────────────────────

function formatNoteType(type: string, groupSessionType?: string): string {
  if (type === 'observation')   return 'Observation';
  if (type === 'med-update')    return 'Med Update';
  if (type === 'incident')      return 'Incident';
  if (type === 'group-session') return groupSessionType ? `Group · ${groupSessionType}` : 'Group Session';
  return type;
}

// ─── Withdrawal threshold ─────────────────────────────────────────────────────
const WD_THRESHOLD = 13;

function isWithdrawalAlert(p: Patient) {
  return (p.cows != null && p.cows >= WD_THRESHOLD) || (p.ciwa != null && p.ciwa >= WD_THRESHOLD);
}

// ─── Withdrawal alert banner ──────────────────────────────────────────────────

function WithdrawalAlertBanner({
  patients,
  colors,
  onSelectPatient,
  onDismiss,
}: {
  patients: Patient[];
  colors: ReturnType<typeof useColors>;
  onSelectPatient: (p: Patient) => void;
  onDismiss: () => void;
}) {
  const { acknowledge, isAcknowledged, acknowledgments, isRehydrating: mdIsRehydrating } = useMdAcknowledgment();
  const alertPatients = patients.filter(isWithdrawalAlert);
  if (alertPatients.length === 0) return null;
  // Guard: suppress acknowledgment-state-dependent rendering until AsyncStorage
  // has finished loading, preventing a cold-start flash where every patient
  // briefly appears un-acknowledged before persisted state is restored.
  if (mdIsRehydrating) return null;

  const pendingCount = alertPatients.filter(p => !isAcknowledged(p.id)).length;

  return (
    <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderBottomColor: colors.critical }]}>
      <Ionicons name="warning" size={16} color={pendingCount > 0 ? colors.critical : colors.mutedForeground} />
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: pendingCount > 0 ? colors.critical : colors.mutedForeground }]}>
          {pendingCount > 0
            ? `${pendingCount} withdrawal alert${pendingCount > 1 ? 's' : ''} — MD notification required`
            : 'All withdrawal alerts acknowledged'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.alertChips}>
            {alertPatients.map(p => {
              const showCiwa = (p.ciwa ?? 0) >= WD_THRESHOLD;
              const score = showCiwa ? p.ciwa! : p.cows!;
              const scoreKey = showCiwa ? 'ciwa' : 'cows';
              const trend = getScoreTrend(p.id, scoreKey);
              const acked = isAcknowledged(p.id);

              if (acked) {
                // Muted "MD notified" chip
                return (
                  <View
                    key={p.id}
                    style={[styles.alertChip, styles.alertChipAcked, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                    <Text style={[styles.alertChipText, { color: colors.mutedForeground }]}>
                      {p.bed}: {p.lastName} · MD notified {acknowledgments[p.id]?.displayTime}
                    </Text>
                  </View>
                );
              }

              return (
                <View key={p.id} style={styles.alertChipGroup}>
                  {/* Tap to navigate */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onSelectPatient(p); }}
                    style={[styles.alertChip, { backgroundColor: colors.critical }]}
                  >
                    <Text style={styles.alertChipText}>
                      {p.bed}: {p.lastName} · {showCiwa ? 'CIWA' : 'COWS'} {score}
                      {trend != null && (
                        <Text style={{ color: trendColor(trend, colors), fontSize: 11, fontWeight: '700' }}>{trendArrow(trend)}</Text>
                      )}
                    </Text>
                  </Pressable>
                  {/* Acknowledge button */}
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      acknowledge(p.id);
                    }}
                    style={[styles.ackBtn, { backgroundColor: colors.successBg, borderColor: colors.success }]}
                    hitSlop={4}
                  >
                    <Ionicons name="call-outline" size={11} color={colors.success} />
                    <Text style={[styles.ackBtnText, { color: colors.success }]}>MD notified</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onDismiss(); }}
        style={styles.alertDismiss}
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color={colors.critical} />
      </Pressable>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleToggle() {
  const colors = useColors();
  const { role, setRole } = useRole();
  const [hintReset, setHintReset] = useState(false);

  const resetSwipeHint = async () => {
    try {
      await AsyncStorage.removeItem('swipe_hint_shown_swipeHintShown');
      setHintReset(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setHintReset(false), 2000);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[styles.roleToggle, { backgroundColor: colors.navyLight, borderColor: colors.navy }]}>
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
        <Pressable
          style={[styles.roleBtn, role === 'counselor' && { backgroundColor: '#0d9488' }]}
          onPress={() => { Haptics.selectionAsync(); setRole('counselor'); }}
        >
          <Text style={[styles.roleBtnText, { color: role === 'counselor' ? '#fff' : colors.slateLight }]}>CL</Text>
        </Pressable>
      </View>
      {/* Dev-only: reset swipe hint so testers can replay onboarding */}
      <Pressable
        onPress={resetSwipeHint}
        style={[styles.roleToggle, { backgroundColor: colors.navyLight, borderColor: colors.navy, paddingHorizontal: 8, paddingVertical: 4 }]}
      >
        <Ionicons name={hintReset ? 'checkmark' : 'refresh-outline'} size={13} color={hintReset ? colors.success : colors.slateLight} />
      </Pressable>
    </View>
  );
}

function AcuityPill({ acuity }: { acuity: Acuity }) {
  const c = acuityColor(acuity);
  return (
    <View style={[styles.acuityPill, { backgroundColor: c.bg }]}>
      <Text style={[styles.acuityText, { color: c.text }]}>{acuity}</Text>
    </View>
  );
}

function FlagChip({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.flagChip, { backgroundColor: colors.muted }]}>
      <Text style={[styles.flagText2, { color: colors.navy }]}>{label}</Text>
    </View>
  );
}

function MoodBar({ value, colors }: { value: number; colors: ReturnType<typeof useColors> }) {
  const pct = value / 10;
  const barColor = value <= 3 ? colors.critical : value <= 6 ? colors.moderate : colors.success;
  return (
    <View style={styles.moodBarContainer}>
      <View style={[styles.moodBarTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.moodBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.moodBarLabel, { color: colors.mutedForeground }]}>{value}/10</Text>
    </View>
  );
}

function BedCard({
  patient,
  onPress,
  onNoteBadgePress,
  onNoteTypeChipPress,
  onScorePillPress,
  onVitalsPress,
  isPendingDischarge,
}: {
  patient: Patient;
  onPress: () => void;
  onNoteBadgePress?: () => void;
  onNoteTypeChipPress?: (type: 'incident' | 'med-update' | 'group-session') => void;
  /** Tapping a COWS/CIWA pill jumps directly to the Scores section. */
  onScorePillPress?: () => void;
  /** Tapping the vitals hint jumps directly to the Vitals section. */
  onVitalsPress?: () => void;
  /** True while the 4-second discharge undo window is open for this patient. */
  isPendingDischarge?: boolean;
}) {
  const colors = useColors();
  const { getNotesForPatient, isRehydrating } = useNursingNotes();
  const ac = acuityColor(patient.acuity);
  const showCows = patient.cows != null && patient.cows > 0;
  const showCiwa = patient.ciwa != null && patient.ciwa > 0;
  const isAlert = isWithdrawalAlert(patient);

  // #177: pulse the score pill whenever the patient's score crosses its threshold.
  const scorePillAnim = useRef(new Animated.Value(1)).current;
  const prevIsAlert = useRef(isAlert);
  useEffect(() => {
    if (isAlert && !prevIsAlert.current) {
      // Rising edge — score just crossed threshold
      Animated.sequence([
        Animated.spring(scorePillAnim, { toValue: 1.18, useNativeDriver: true, speed: 80, bounciness: 10 }),
        Animated.spring(scorePillAnim, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 4  }),
      ]).start();
    }
    prevIsAlert.current = isAlert;
  }, [isAlert]);
  const notes = getNotesForPatient(patient.id);
  const noteCount = notes.length;
  // Count non-Observation note types separately
  const incidentCount      = notes.filter(n => n.noteType === 'incident').length;
  const medUpdateCount     = notes.filter(n => n.noteType === 'med-update').length;
  const groupSessionCount  = notes.filter(n => n.noteType === 'group-session').length;
  const nonObsTypes = (incidentCount > 0 ? 1 : 0) + (medUpdateCount > 0 ? 1 : 0) + (groupSessionCount > 0 ? 1 : 0);
  // When >1 non-obs type exists show the per-type breakdown; otherwise fall back to single pill
  const showBreakdown = nonObsTypes > 1;
  // Used for the single-pill fallback (Incident > Med Update > Group > null for obs-only)
  const urgentNoteType: 'incident' | 'med-update' | 'group-session' | null = !showBreakdown
    ? (incidentCount > 0 ? 'incident' : medUpdateCount > 0 ? 'med-update' : groupSessionCount > 0 ? 'group-session' : null)
    : null;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.bedCard, { backgroundColor: isAlert ? '#FFF5F5' : colors.card, borderLeftColor: ac.border, opacity: isPendingDischarge ? 0.65 : 1 }]}
    >
      {isPendingDischarge && (
        <View style={[styles.dischargingBanner, { backgroundColor: colors.moderateBg, borderColor: colors.moderate }]}>
          <Ionicons name="time-outline" size={11} color={colors.moderate} />
          <Text style={[styles.dischargingBannerText, { color: colors.moderate }]}>Discharging…</Text>
        </View>
      )}
      <View style={styles.bedCardTop}>
        <View style={styles.bedCardTopLeft}>
          <View style={[styles.bedBadge, { backgroundColor: colors.navyMid }]}>
            <Text style={styles.bedBadgeText}>{patient.bed}</Text>
          </View>
          <View>
            <Text style={[styles.patientName, { color: colors.navy }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={[styles.patientMeta, { color: colors.mutedForeground }]}>
              {patient.age}{patient.gender} · LOS {patient.los}d
            </Text>
          </View>
        </View>
        <View style={styles.cardTopRight}>
          {isAlert && <Ionicons name="warning" size={14} color={colors.critical} style={{ marginBottom: 2 }} />}
          <AcuityPill acuity={patient.acuity} />
          {!isRehydrating && noteCount > 0 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNoteBadgePress?.();
              }}
              hitSlop={8}
              style={[styles.noteCountBadge, { backgroundColor: colors.navyLight }]}
            >
              <Ionicons name="document-text-outline" size={9} color="#fff" />
              <Text style={styles.noteCountText}>{noteCount}</Text>
            </Pressable>
          )}
          {!isRehydrating && showBreakdown ? (
            <View style={styles.noteTypeBreakdownRow}>
              {incidentCount > 0 && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNoteTypeChipPress?.('incident'); }}
                  hitSlop={6}
                  style={[styles.noteTypeChip, { backgroundColor: colors.criticalBg, borderColor: colors.critical }]}
                >
                  <Ionicons name="warning-outline" size={10} color={colors.critical} />
                  <Text style={[styles.noteTypeChipText, { color: colors.critical }]}>{incidentCount}</Text>
                </Pressable>
              )}
              {medUpdateCount > 0 && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNoteTypeChipPress?.('med-update'); }}
                  hitSlop={6}
                  style={[styles.noteTypeChip, { backgroundColor: colors.moderateBg, borderColor: colors.moderate }]}
                >
                  <Ionicons name="medkit-outline" size={10} color={colors.moderate} />
                  <Text style={[styles.noteTypeChipText, { color: colors.moderate }]}>{medUpdateCount}</Text>
                </Pressable>
              )}
              {groupSessionCount > 0 && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNoteTypeChipPress?.('group-session'); }}
                  hitSlop={6}
                  style={[styles.noteTypeChip, { backgroundColor: colors.successBg, borderColor: colors.success }]}
                >
                  <Ionicons name="people-outline" size={10} color={colors.success} />
                  <Text style={[styles.noteTypeChipText, { color: colors.success }]}>{groupSessionCount}</Text>
                </Pressable>
              )}
            </View>
          ) : !isRehydrating && urgentNoteType != null && (() => {
            const tc = urgentNoteType === 'incident'
              ? { bg: colors.criticalBg, text: colors.critical }
              : urgentNoteType === 'med-update'
              ? { bg: colors.moderateBg, text: colors.moderate }
              : { bg: colors.successBg, text: colors.success };
            const icon = urgentNoteType === 'incident'
              ? 'warning-outline'
              : urgentNoteType === 'med-update'
              ? 'medkit-outline'
              : 'people-outline';
            return (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNoteTypeChipPress?.(urgentNoteType); }}
                hitSlop={6}
                style={[styles.noteTypePill, { backgroundColor: tc.bg, borderColor: tc.text }]}
              >
                <Ionicons name={icon as any} size={10} color={tc.text} />
                <Text style={[styles.noteTypePillText, { color: tc.text }]} numberOfLines={1}>
                  {formatNoteType(urgentNoteType)}
                </Text>
              </Pressable>
            );
          })()}
        </View>
      </View>

      <Text style={[styles.diagnosis, { color: colors.navyLight }]} numberOfLines={1}>
        {patient.primaryDiagnosis}
      </Text>

      {patient.flags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flagsRow}>
          {patient.flags.map(f => <FlagChip key={f} label={f} />)}
        </ScrollView>
      )}

      <View style={styles.bedCardBottom}>
        <View style={styles.scoresRow}>
          {showCows && (() => {
            const c = getScoreStyle(patient.cows!, 13, colors);
            const trend = getScoreTrend(patient.id, 'cows');
            const atThreshold = patient.cows! >= 13;
            return (
              <Animated.View style={atThreshold ? { transform: [{ scale: scorePillAnim }] } : undefined}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onScorePillPress?.(); }}
                  hitSlop={6}
                  style={({ pressed }) => [styles.scorePill, { backgroundColor: c.bg, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Text style={[styles.scoreText, { color: c.text }]}>
                    {'COWS ' + patient.cows}
                    {trend != null && (
                      <Text style={{ color: trendColor(trend, colors) }}>{trendArrow(trend)}</Text>
                    )}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })()}
          {showCiwa && (() => {
            const c = getScoreStyle(patient.ciwa!, 15, colors);
            const trend = getScoreTrend(patient.id, 'ciwa');
            const atThreshold = patient.ciwa! >= 15;
            return (
              <Animated.View style={atThreshold ? { transform: [{ scale: scorePillAnim }] } : undefined}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onScorePillPress?.(); }}
                  hitSlop={6}
                  style={({ pressed }) => [styles.scorePill, { backgroundColor: c.bg, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Text style={[styles.scoreText, { color: c.text }]}>
                    {'CIWA ' + patient.ciwa}
                    {trend != null && (
                      <Text style={{ color: trendColor(trend, colors) }}>{trendArrow(trend)}</Text>
                    )}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })()}
        </View>
        {!isRehydrating && groupSessionCount > 0 && (
          <View style={[styles.groupNoteChip, { backgroundColor: '#ccfbf1', borderColor: '#0d9488' }]}>
            <Ionicons name="people-outline" size={10} color="#0d9488" />
            <Text style={[styles.groupNoteChipText, { color: '#0d9488' }]}>
              {groupSessionCount} group {groupSessionCount === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        )}
        <View style={styles.moodSection}>
          <Text style={[styles.moodLabel, { color: colors.mutedForeground }]}>Mood</Text>
          <MoodBar value={patient.mood} colors={colors} />
        </View>
      </View>

      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onVitalsPress?.(); }}
        hitSlop={8}
      >
        <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for vitals history →</Text>
      </Pressable>
    </Pressable>
  );
}

function AvailableBedCard({ bedId, status }: { bedId: string; status: string }) {
  const colors = useColors();
  const isDischarging = status === 'Discharging';
  const bgColor = isDischarging
    ? colors.moderateBg
    : status === 'Available' ? colors.successBg : colors.muted;
  const textColor = isDischarging
    ? colors.moderate
    : status === 'Available' ? colors.success : colors.mutedForeground;
  const borderColor = isDischarging ? colors.moderate : colors.border;
  const icon = isDischarging ? 'time-outline' : status === 'Available' ? 'bed-outline' : 'refresh-outline';
  return (
    <View style={[styles.availableBedCard, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons name={icon as any} size={18} color={textColor} />
      <Text style={[styles.availableBedId, { color: textColor }]}>{bedId}</Text>
      <Text style={[styles.availableBedStatus, { color: textColor }]}>{status}</Text>
    </View>
  );
}

// ─── Admit Patient Modal ──────────────────────────────────────────────────────

const ACUITY_OPTIONS: Acuity[] = ['Routine', 'Moderate', 'High', 'Critical'];
const PROGRAM_OPTIONS = ['Residential', 'PHP', 'IOP', 'OP'] as const;
const GENDER_OPTIONS = ['M', 'F', 'NB', 'Other'] as const;
// #43: quick-pick counselor list so charge nurses don't have to type a name
const COUNSELOR_OPTIONS = ['J. Rivera', 'M. Thompson', 'K. Patel', 'D. Williams', 'S. Okafor', 'TBD'] as const;

function AdmitModal({
  visible,
  onClose,
  availableBeds,
}: {
  visible: boolean;
  onClose: () => void;
  availableBeds: string[];
}) {
  const colors = useColors();
  const { admitPatient } = usePatients();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bed, setBed] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [acuity, setAcuity] = useState<Acuity>('Routine');
  const [program, setProgram] = useState<typeof PROGRAM_OPTIONS[number]>('Residential');
  // #43: auto-fill fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<typeof GENDER_OPTIONS[number]>('M');
  const [counselor, setCounselor] = useState<typeof COUNSELOR_OPTIONS[number]>('TBD');

  function resetForm() {
    setFirstName('');
    setLastName('');
    setBed('');
    setDiagnosis('');
    setAcuity('Routine');
    setProgram('Residential');
    setAge('');
    setGender('M');
    setCounselor('TBD');
  }

  function handleAdmit() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing fields', 'First name and last name are required.');
      return;
    }
    if (!bed) {
      Alert.alert('No bed selected', 'Please select an available bed before admitting.');
      return;
    }
    // Guard: bed must still be available at submit time (race condition safety)
    if (!availableBeds.includes(bed)) {
      Alert.alert('Bed unavailable', `Bed ${bed} is no longer available. Please choose another.`);
      setBed('');
      return;
    }

    const today = new Date();
    const admitDate = `${today.getMonth() + 1}/${today.getDate()}`;

    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: age.trim() ? parseInt(age.trim(), 10) : 0,
      gender,
      program,
      primaryDiagnosis: diagnosis.trim() || 'Pending assessment',
      acuity,
      bed: bed.trim().toUpperCase(),
      bedStatus: 'Occupied',
      flags: [],
      admitDate,
      los: 0,
      counselor,
      mood: 5,
      cravings: 5,
      lastUa: 'Pending',
      nextAppointment: 'TBD',
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    admitPatient(newPatient);
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[modalStyles.header, { backgroundColor: colors.navy }]}>
          <Pressable onPress={() => { resetForm(); onClose(); }} hitSlop={12}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={modalStyles.title}>Admit Patient</Text>
          <Pressable onPress={handleAdmit} hitSlop={12}>
            <Text style={[modalStyles.admitText, { color: colors.orange }]}>Admit</Text>
          </Pressable>
        </View>

        <ScrollView style={modalStyles.form} contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Name */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>PATIENT NAME *</Text>
            <View style={modalStyles.nameRow}>
              <TextInput
                style={[modalStyles.input, { flex: 1, backgroundColor: colors.card, color: colors.navy, borderColor: colors.border }]}
                placeholder="First"
                placeholderTextColor={colors.mutedForeground}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={[modalStyles.input, { flex: 1, backgroundColor: colors.card, color: colors.navy, borderColor: colors.border }]}
                placeholder="Last"
                placeholderTextColor={colors.mutedForeground}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Bed — chip-only to prevent invalid/duplicate assignments */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>BED ASSIGNMENT *</Text>
            {availableBeds.length > 0 ? (
              <View style={modalStyles.bedChips}>
                {availableBeds.map(b => (
                  <Pressable
                    key={b}
                    onPress={() => { Haptics.selectionAsync(); setBed(b); }}
                    style={[modalStyles.bedChip, { backgroundColor: bed === b ? colors.orange : colors.successBg, borderColor: bed === b ? colors.orange : colors.success }]}
                  >
                    <Text style={[modalStyles.bedChipText, { color: bed === b ? '#fff' : colors.success }]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={[modalStyles.noBedsBanner, { backgroundColor: colors.criticalBg, borderColor: colors.critical }]}>
                <Ionicons name="bed-outline" size={16} color={colors.critical} />
                <Text style={[modalStyles.noBedsBannerText, { color: colors.critical }]}>
                  No beds available — discharge or clean a bed first.
                </Text>
              </View>
            )}
          </View>

          {/* Diagnosis */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>PRIMARY DIAGNOSIS</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, color: colors.navy, borderColor: colors.border }]}
              placeholder="e.g. Opioid Use Disorder"
              placeholderTextColor={colors.mutedForeground}
              value={diagnosis}
              onChangeText={setDiagnosis}
              autoCapitalize="words"
            />
          </View>

          {/* Program */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>PROGRAM</Text>
            <View style={modalStyles.chipRow}>
              {PROGRAM_OPTIONS.map(p => (
                <Pressable
                  key={p}
                  onPress={() => { Haptics.selectionAsync(); setProgram(p); }}
                  style={[modalStyles.optionChip, { backgroundColor: program === p ? colors.navy : colors.muted, borderColor: program === p ? colors.navy : colors.border }]}
                >
                  <Text style={[modalStyles.optionChipText, { color: program === p ? '#fff' : colors.navy }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Acuity */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>ACUITY</Text>
            <View style={modalStyles.chipRow}>
              {ACUITY_OPTIONS.map(a => {
                const ac = acuityColor(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => { Haptics.selectionAsync(); setAcuity(a); }}
                    style={[modalStyles.optionChip, { backgroundColor: acuity === a ? ac.bg : colors.muted, borderColor: acuity === a ? ac.border : colors.border }]}
                  >
                    <Text style={[modalStyles.optionChipText, { color: acuity === a ? ac.text : colors.navy }]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Age + Gender (#43) */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>AGE &amp; GENDER</Text>
            <View style={modalStyles.nameRow}>
              <TextInput
                style={[modalStyles.input, { width: 72, backgroundColor: colors.card, color: colors.navy, borderColor: colors.border }]}
                placeholder="Age"
                placeholderTextColor={colors.mutedForeground}
                value={age}
                onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
              />
              <View style={[modalStyles.chipRow, { flex: 1 }]}>
                {GENDER_OPTIONS.map(g => (
                  <Pressable
                    key={g}
                    onPress={() => { Haptics.selectionAsync(); setGender(g); }}
                    style={[modalStyles.optionChip, { backgroundColor: gender === g ? colors.navy : colors.muted, borderColor: gender === g ? colors.navy : colors.border }]}
                  >
                    <Text style={[modalStyles.optionChipText, { color: gender === g ? '#fff' : colors.navy }]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Counselor (#43) */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.mutedForeground }]}>ASSIGNED COUNSELOR</Text>
            <View style={[modalStyles.chipRow, { flexWrap: 'wrap' }]}>
              {COUNSELOR_OPTIONS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => { Haptics.selectionAsync(); setCounselor(c); }}
                  style={[modalStyles.optionChip, { backgroundColor: counselor === c ? colors.navyMid : colors.muted, borderColor: counselor === c ? colors.navy : colors.border }]}
                >
                  <Text style={[modalStyles.optionChipText, { color: counselor === c ? '#fff' : colors.navy }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CensusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const { acuityFilter, setAcuityFilter, noteFilter, setNoteFilter, resetFilters } = useCensusFilters();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [admitVisible, setAdmitVisible] = useState(false);
  const [groupRecorderVisible, setGroupRecorderVisible] = useState(false);
  const { role } = useRole();
  const [pendingNoticeDismissed, setPendingNoticeDismissed] = useState(false);
  const [shiftEndedToast, setShiftEndedToast] = useState(false);
  const shiftEndedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  // #176: track previous alertCount so the haptic fires each time the count
  // rises (not just once), giving nurses a physical cue when a new patient
  // crosses the withdrawal threshold.
  const prevAlertCount = useRef(0);

  // ─── Live census data from context ────────────────────────────────────────
  // Must be declared before the discharge toast refs so we can seed their
  // initial values from pendingDischarge (handles the case where the nurse
  // switches tabs and comes back while the undo window is still open).
  const { patients, bedStatusMap, refreshFromApi, pendingDischarge, undoDischarge, clearPendingDischarge } = usePatients();

  // ─── Discharge undo toast (driven by PatientContext.pendingDischarge) ───────
  // Initialise from the live pendingDischarge value so that if the component
  // remounts (tab switch, Android backgrounding, etc.) mid-window the toast
  // re-appears with time still remaining rather than being silently lost.
  //
  // Guard: only treat pendingDischarge as "active" if its window hasn't already
  // expired.  If the nurse was away long enough for the 4-second timer to fire
  // while the component was unmounted, expiresAt will be in the past — we must
  // not open the toast in that case.
  const pendingIsActive = pendingDischarge !== null && pendingDischarge.expiresAt > Date.now();
  const [dischargeToastVisible, setDischargeToastVisible] = useState(() => pendingIsActive);
  const dischargeToastAnim = useRef(new Animated.Value(pendingIsActive ? 0 : 100)).current;
  const dischargeToastShownRef = useRef(pendingIsActive);
  /** When true the next toast dismissal skips the slide-out animation (e.g. shift-end). */
  const skipDischargeToastExitRef = useRef(false);
  /** Countdown bar: 1 = full, 0 = empty. JS-driven so width % works.
   *  On remount mid-window we seed the correct proportional fill so the bar
   *  starts at the right position instead of jumping back to full.
   *  When the window has already expired we initialise to 1 (matches the
   *  hidden-toast default) so no 0-width flash occurs. */
  const dischargeCountdownAnim = useRef(new Animated.Value(
    pendingIsActive
      ? Math.max(0, Math.min(1, (pendingDischarge!.expiresAt - Date.now()) / 4000))
      : 1,
  )).current;
  /** Reference to the running countdown so it can be stopped on re-trigger. */
  const countdownAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  /** True only on the very first run of the discharge useEffect.
   *  Lets us distinguish "remount with pre-seeded toast" from "new discharge". */
  const isInitialEffectRunRef = useRef(true);
  const { clearNotes, getNotesForPatient } = useNursingNotes();
  const { clearAcknowledgments } = useMdAcknowledgment();
  const residentialPatients = patients.filter(p => p.bed != null);

  // Build bed lists from live context data
  const allBedIds = BEDS.map(b => b.id);
  const occupiedBedIds = new Set(patients.map(p => p.bed).filter(Boolean));
  const occupiedCount = occupiedBedIds.size;
  const pendingDischargeBedId = pendingDischarge?.patient.bed ?? null;
  const nonOccupiedBeds = allBedIds
    .filter(id => !occupiedBedIds.has(id))
    .map(id => ({
      id,
      // Override status to "Discharging" for the pending discharge bed
      status: id === pendingDischargeBedId ? 'Discharging' : (bedStatusMap[id] ?? 'Available'),
    }));
  // Exclude the discharging bed from "Available" so it can't be assigned
  const availableCount = nonOccupiedBeds.filter(b => b.status === 'Available').length;
  const cleaningCount = nonOccupiedBeds.filter(b => b.status === 'Cleaning').length;
  const availableBedIds = nonOccupiedBeds.filter(b => b.status === 'Available').map(b => b.id);

  // Count patients matching each note-type chip — uses the same predicate as the filter
  // so the badge accurately previews how many patients will appear after tapping.
  const noteTypeCounts = React.useMemo(() => {
    const counts: Record<NoteFilter, number> = { observation: 0, 'med-update': 0, incident: 0 };
    for (const p of residentialPatients) {
      const notes = getNotesForPatient(p.id);
      for (const type of NOTE_TYPE_FILTERS.map(f => f.value)) {
        if (notes.some(n => n.noteType === type)) counts[type]++;
      }
    }
    return counts;
  }, [residentialPatients, getNotesForPatient]);

  // Stats computed from live context (satisfies real-time requirement)
  const alertCount = residentialPatients.filter(isWithdrawalAlert).length;
  const stats = { occupied: occupiedCount, available: availableCount, cleaning: cleaningCount, wdAlerts: alertCount };

  // ─── Pull-to-refresh ──────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const loading = false; // context provides data immediately on mount

  const loadCensus = useCallback(async (isRefresh = false) => {
    if (!isRefresh) return;
    setRefreshing(true);
    try {
      await refreshFromApi();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFromApi]);

  // ─── Auto-refresh every 60 s while screen is focused ─────────────────────
  useFocusEffect(
    useCallback(() => {
      // Fetch immediately on focus, then poll every 60 seconds
      refreshFromApi();
      const timer = setInterval(refreshFromApi, 60_000);
      return () => clearInterval(timer);
    }, [refreshFromApi]),
  );

  // #176: fire a warning haptic each time alertCount increases so nurses
  // feel a new threshold breach even with the screen partially off-center.
  useEffect(() => {
    if (alertCount > prevAlertCount.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevAlertCount.current = alertCount;
  }, [alertCount]);

  // Reset the notice dismiss flag whenever a new pending discharge starts
  // so the notice re-appears for the new patient.
  useEffect(() => {
    if (pendingDischarge) {
      setPendingNoticeDismissed(false);
    }
  }, [pendingDischarge?.patient.id]);

  const filteredPatients = acuityFilter === 'Available'
    ? []
    : residentialPatients.filter(p => {
        const acuityMatch = acuityFilter === 'All' || p.acuity === acuityFilter;
        const noteMatch = noteFilter == null || getNotesForPatient(p.id).some(n => n.noteType === noteFilter);
        return acuityMatch && noteMatch;
      });

  // True when a pending-discharge patient exists but is hidden by the active filter.
  // displayedPatients re-inserts them at the top, but nurses still need to know
  // why a "Discharging…" card appears outside their chosen filter.
  const pendingHiddenByCensusFilter = React.useMemo(() => {
    if (!pendingDischarge) return false;
    const pd = pendingDischarge.patient;
    if (pd.bed == null) return false; // non-residential — not shown on this tab
    return !filteredPatients.some(p => p.id === pd.id);
  }, [filteredPatients, pendingDischarge]);

  const showCensusPendingNotice = pendingHiddenByCensusFilter && !pendingNoticeDismissed;

  // Re-insert the pending-discharge patient so nurses can see the bed is not yet free.
  // Always shown at the top of the list regardless of active filters — its transient
  // "Discharging…" state is more important than any filter match.
  const displayedPatients = React.useMemo(() => {
    if (!pendingDischarge) return filteredPatients;
    const pd = pendingDischarge.patient;
    // Only insert if not already present (edge case: undo race)
    if (filteredPatients.some(p => p.id === pd.id)) return filteredPatients;
    // Only show residential (bed-assigned) patients on this census screen
    if (pd.bed == null) return filteredPatients;
    return [pd, ...filteredPatients];
  }, [filteredPatients, pendingDischarge]);

  const openPatient = (p: Patient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}` as any);
  };

  const openPatientNotes = (p: Patient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}?scrollTo=notes` as any);
  };

  const openPatientNotesFiltered = (p: Patient, noteType: 'incident' | 'med-update' | 'group-session') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}?scrollTo=notes&noteFilter=${noteType}` as any);
  };

  const openPatientVitals = (p: Patient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}?scrollTo=vitals` as any);
  };

  const openPatientScores = (p: Patient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}?scrollTo=scores` as any);
  };

  // Drive the discharge undo toast from context
  useEffect(() => {
    // Compute remaining time first so we can use it in the `active` guard.
    // An expired pendingDischarge record (expiresAt in the past) must be treated
    // the same as null — no toast, no bar animation — to prevent a 0ms flash.
    const remainingMs = pendingDischarge ? Math.max(0, pendingDischarge.expiresAt - Date.now()) : 0;
    const active = pendingDischarge !== null && remainingMs > 0;

    /**
     * Start (or restart) the countdown bar.
     * @param durationMs  How long the remaining animation should run.
     * @param resetToFull When true (default), reset the bar to 1 before animating.
     *                    Pass false on remount so the pre-seeded proportional value
     *                    is preserved and the bar continues from where it left off.
     */
    function startCountdown(durationMs: number, resetToFull = true) {
      countdownAnimRef.current?.stop();
      if (resetToFull) {
        dischargeCountdownAnim.setValue(1);
      }
      countdownAnimRef.current = Animated.timing(dischargeCountdownAnim, {
        toValue: 0,
        duration: durationMs,
        useNativeDriver: false, // width % requires JS driver
      });
      countdownAnimRef.current.start();
    }

    const isRemount = isInitialEffectRunRef.current && dischargeToastShownRef.current;
    isInitialEffectRunRef.current = false;

    if (active && !dischargeToastShownRef.current) {
      // Fresh discharge — slide in and start countdown from full.
      dischargeToastShownRef.current = true;
      setDischargeToastVisible(true);
      Animated.spring(dischargeToastAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      startCountdown(remainingMs);
    } else if (active && isRemount) {
      // Remount mid-window (tab switch and return).
      if (remainingMs <= 0) {
        // The undo window expired while the nurse was away.  The context timer
        // will have already fired (or is about to), so pendingDischarge is null
        // (or will become null imminently).  Either way we must not show a
        // zero-width bar or let the toast flash — hide immediately.
        dischargeToastShownRef.current = false;
        dischargeToastAnim.stopAnimation();
        dischargeToastAnim.setValue(100);
        setDischargeToastVisible(false);
      } else {
        // The toast anim value is already seeded to 0 (visible) and the countdown
        // value is already seeded to the correct proportional fill — just resume
        // the animation without any resets.
        startCountdown(remainingMs, false /* do NOT reset to full */);
      }
    } else if (active && dischargeToastShownRef.current) {
      // New discharge while the previous toast is still open — re-animate and
      // reset the countdown to full for the new 4-second window.
      dischargeToastAnim.setValue(100);
      Animated.spring(dischargeToastAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      startCountdown(remainingMs);
    } else if (!active && dischargeToastShownRef.current) {
      // Dismissed (undo or timer) — slide out and stop countdown.
      dischargeToastShownRef.current = false;
      countdownAnimRef.current?.stop();
      countdownAnimRef.current = null;
      if (skipDischargeToastExitRef.current) {
        // Shift ended — hide immediately without animating.
        // stopAnimation() is called first so it cancels any in-progress spring
        // entrance (i.e. End Shift tapped while the toast is still sliding up).
        // setValue(100) then immediately moves the view off-screen regardless
        // of where the spring had paused, leaving no lingering translateY offset.
        skipDischargeToastExitRef.current = false;
        dischargeToastAnim.stopAnimation();
        dischargeToastAnim.setValue(100);
        setDischargeToastVisible(false);
      } else {
        Animated.timing(dischargeToastAnim, {
          toValue: 100,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setDischargeToastVisible(false));
      }
    }
  }, [pendingDischarge]);

  // Cancel all running timers and animations when the census screen unmounts
  // (e.g. the app is force-quit or the navigator removes the tab).  Without
  // this, the shift-ended toast setTimeout and the countdown Animated.timing
  // can fire callbacks on an unmounted component tree, and any in-progress
  // spring on dischargeToastAnim / toastAnim will keep ticking in the
  // background.
  useEffect(() => {
    return () => {
      if (shiftEndedTimer.current) {
        clearTimeout(shiftEndedTimer.current);
        shiftEndedTimer.current = null;
      }
      countdownAnimRef.current?.stop();
      countdownAnimRef.current = null;
      dischargeToastAnim.stopAnimation();
      toastAnim.stopAnimation();
    };
  }, []);

  const handleUndoDischarge = () => {
    undoDischarge();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Shift label (computed once on mount; stable within a session) ─────────
  const [shiftLabel] = useState(getShiftLabel);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Census Board</Text>
            <Text style={styles.headerSubtitle}>{shiftLabel}</Text>
          </View>
          <View style={styles.headerActions}>
            {role === 'counselor' && (
              <Pressable
                style={[styles.admitBtn, { backgroundColor: '#0d9488' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setGroupRecorderVisible(true); }}
              >
                <Ionicons name="people-outline" size={14} color="#fff" />
                <Text style={styles.admitBtnText}>Group Rec</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.admitBtn, { backgroundColor: colors.orange }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAdmitVisible(true); }}
            >
              <Ionicons name="person-add-outline" size={14} color="#fff" />
              <Text style={styles.admitBtnText}>Admit</Text>
            </Pressable>
            <Pressable
              style={[styles.admitBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'End Shift',
                  "This will clear all notes you've added this shift. The next nurse will start fresh.",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'End Shift',
                      style: 'destructive',
                      onPress: () => {
                        clearNotes();
                        clearAcknowledgments();
                        // Signal the toast to hide instantly (no slide-out) before clearing
                        skipDischargeToastExitRef.current = true;
                        clearPendingDischarge();
                        setBannerDismissed(false);
                        resetFilters();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        // Show toast confirmation with slide-up entrance and fade-out exit
                        if (shiftEndedTimer.current) clearTimeout(shiftEndedTimer.current);
                        toastAnim.setValue(0);
                        setShiftEndedToast(true);
                        Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
                        shiftEndedTimer.current = setTimeout(() => {
                          Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                            setShiftEndedToast(false);
                          });
                        }, 1700);
                      },
                    },
                  ],
                );
              }}
            >
              <Ionicons name="log-out-outline" size={14} color="#fff" />
              <Text style={styles.admitBtnText}>End Shift</Text>
            </Pressable>
            <RoleToggle />
          </View>
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.occupied}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.amber }]}>{stats.cleaning}</Text>
            <Text style={styles.statLabel}>Cleaning</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: alertCount > 0 ? colors.critical : '#fff' }]}>{stats.wdAlerts}</Text>
            <Text style={styles.statLabel}>WD Alerts</Text>
          </View>
        </View>
      </View>

      {/* Withdrawal alert banner */}
      {!bannerDismissed && (
        <WithdrawalAlertBanner
          patients={residentialPatients}
          colors={colors}
          onSelectPatient={openPatient}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { backgroundColor: colors.navyMid }]}
        contentContainerStyle={styles.filterContent}
      >
        {acuityFilter !== 'All' && noteFilter != null && (
          <Pressable
            style={[styles.filterChip, styles.clearAllChip, { backgroundColor: colors.orange }]}
            onPress={() => {
              Haptics.selectionAsync();
              setAcuityFilter('All');
              setNoteFilter(null);
            }}
          >
            <Ionicons name="close-circle" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={[styles.filterChipText, { color: '#fff' }]}>2 filters · Clear</Text>
          </Pressable>
        )}
        {ACUITY_FILTERS.map(f => {
          const isAll = f === 'All';
          // "All" is active only when both dimensions are reset
          const isActive = isAll
            ? acuityFilter === 'All' && noteFilter == null
            : acuityFilter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, isActive && { backgroundColor: colors.orange }]}
              onPress={() => {
                Haptics.selectionAsync();
                if (isAll) {
                  setAcuityFilter('All');
                  setNoteFilter(null);
                } else {
                  setAcuityFilter(acuityFilter === f ? 'All' : f);
                }
              }}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#fff' : colors.slateLight }]}>{f}</Text>
            </Pressable>
          );
        })}
        <View style={styles.filterDivider} />
        {NOTE_TYPE_FILTERS.map(({ value, label }) => {
          const count = noteTypeCounts[value];
          const isActive = noteFilter === value;
          const isZero = count === 0;
          return (
            <Pressable
              key={value}
              style={[
                styles.filterChip,
                isActive && { backgroundColor: colors.orange },
                isZero && !isActive && { opacity: 0.45 },
              ]}
              onPress={() => { Haptics.selectionAsync(); setNoteFilter(noteFilter === value ? null : value); }}
            >
              <Ionicons
                name="document-text-outline"
                size={11}
                color={isActive ? '#fff' : colors.slateLight}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.filterChipText, { color: isActive ? '#fff' : colors.slateLight }]}>{label}</Text>
              <View style={[
                styles.filterCountBadge,
                { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.navyLight },
              ]}>
                <Text style={[styles.filterCountBadgeText, { color: isActive ? '#fff' : colors.slateLight }]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Hidden-patient notice — shown when the pending-discharge patient is
          filtered out by the active acuity or note-type chip */}
      {showCensusPendingNotice && (
        <View style={[styles.hiddenNotice, { backgroundColor: colors.moderateBg, borderColor: colors.moderate }]}>
          <Ionicons name="eye-off-outline" size={14} color={colors.moderate} />
          <Text style={[styles.hiddenNoticeText, { color: colors.moderate }]} numberOfLines={1}>
            {pendingDischarge!.patient.firstName} {pendingDischarge!.patient.lastName} is hidden by the active filter
          </Text>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); resetFilters(); setPendingNoticeDismissed(true); }}
            hitSlop={8}
            style={[styles.hiddenNoticeBtn, { borderColor: colors.moderate }]}
          >
            <Text style={[styles.hiddenNoticeBtnText, { color: colors.moderate }]}>Show all</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setPendingNoticeDismissed(true); }}
            hitSlop={8}
          >
            <Ionicons name="close" size={14} color={colors.moderate} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : (
        <FlatList
          data={acuityFilter === 'Available' ? [] : displayedPatients}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <BedCard
              patient={item}
              onPress={() => openPatient(item)}
              onNoteBadgePress={() => openPatientNotes(item)}
              onNoteTypeChipPress={(type) => openPatientNotesFiltered(item, type)}
              onScorePillPress={() => openPatientScores(item)}
              onVitalsPress={() => openPatientVitals(item)}
              isPendingDischarge={pendingDischarge?.patient.id === item.id}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCensus(true)}
              tintColor={colors.navy}
              colors={[colors.navy]}
            />
          }
          ListHeaderComponent={acuityFilter === 'Available' ? (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Non-Occupied Beds</Text>
              <View style={styles.availableGrid}>
                {nonOccupiedBeds.map(b => <AvailableBedCard key={b.id} bedId={b.id} status={b.status} />)}
              </View>
            </View>
          ) : null}
          ListFooterComponent={acuityFilter !== 'Available' && nonOccupiedBeds.length > 0 ? (
            <View style={styles.footerBeds}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Other Beds</Text>
              <View style={styles.availableGrid}>
                {nonOccupiedBeds.map(b => <AvailableBedCard key={b.id} bedId={b.id} status={b.status} />)}
              </View>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bed-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No patients match this filter</Text>
            </View>
          }
        />
      )}

      <AdmitModal
        visible={admitVisible}
        onClose={() => setAdmitVisible(false)}
        availableBeds={availableBedIds}
      />

      <GroupRecorderModal
        visible={groupRecorderVisible}
        onClose={() => setGroupRecorderVisible(false)}
        patients={residentialPatients}
      />

      {/* ─── Discharge undo toast ─── */}
      {dischargeToastVisible && (
        <Animated.View
          style={[
            styles.dischargeUndoToast,
            { bottom: Math.max(insets.bottom, 8) + 16, transform: [{ translateY: dischargeToastAnim }] },
          ]}
        >
          <View style={styles.dischargeUndoToastRow}>
            <Text style={styles.dischargeUndoToastText}>
              {pendingDischarge
                ? `${pendingDischarge.patient.firstName} ${pendingDischarge.patient.lastName} discharged`
                : 'Patient discharged'}
            </Text>
            <Pressable
              onPress={handleUndoDischarge}
              hitSlop={12}
              style={styles.dischargeUndoBtn}
            >
              <Text style={styles.dischargeUndoBtnText}>Undo</Text>
            </Pressable>
          </View>
          {/* Countdown bar — shrinks from full to empty over the 4-second window */}
          <View style={styles.dischargeCountdownTrack}>
            <Animated.View
              style={[
                styles.dischargeCountdownBar,
                {
                  width: dischargeCountdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {/* Shift-ended toast */}
      {shiftEndedToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.toast, { backgroundColor: colors.navy }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.toastText}>Shift ended — board reset</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  admitBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  admitBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  statsRow: { flexDirection: 'row', marginTop: 12, paddingBottom: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  // Alert banner
  alertBanner: { borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  alertChips: { flexDirection: 'row', gap: 6 },
  alertChip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  alertChipText: { fontSize: 11, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  alertDismiss: { padding: 2, alignSelf: 'flex-start' },
  alertChipGroup: { flexDirection: 'column', gap: 4, alignItems: 'flex-start' },
  alertChipAcked: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  ackBtnText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Filters
  filterScroll: {},
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center' },
  filterChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  filterCountBadge: { marginLeft: 5, borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterCountBadgeText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  filterDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4, alignSelf: 'stretch' },
  clearAllChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  // Bed cards
  listContent: { padding: 12, gap: 10 },
  bedCard: {
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bedCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  bedCardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardTopRight: { alignItems: 'center', gap: 2 },
  bedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedBadgeText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  patientName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  patientMeta: { fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  acuityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  acuityText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  diagnosis: { fontSize: 13, marginBottom: 8, fontFamily: 'Inter_400Regular' },
  flagsRow: { marginBottom: 10 },
  flagChip: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
  flagText2: { fontSize: 11, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  bedCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoresRow: { flexDirection: 'row', gap: 6 },
  scorePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  scoreText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  moodSection: { alignItems: 'flex-end', flex: 1, marginLeft: 12 },
  moodLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  moodBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodBarTrack: { width: 70, height: 6, borderRadius: 3 },
  moodBarFill: { height: 6, borderRadius: 3 },
  moodBarLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  tapHint: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 6, opacity: 0.6 },
  dischargingBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, marginBottom: 8 },
  dischargingBannerText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  noteBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2, maxWidth: 140 },
  noteBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  noteBadgeSep: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular' },
  noteBadgeType: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  noteTypePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, marginTop: 2 },
  noteTypePillText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold', flexShrink: 1 },
  noteCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, marginTop: 2 },
  noteCountText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold', color: '#fff' },
  noteTypeBreakdownRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  noteTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1 },
  groupNoteChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, alignSelf: 'flex-start' },
  groupNoteChipText: { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  noteTypeChipText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Role toggle
  roleToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  roleBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Available beds
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  availableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableBedCard: { borderRadius: 8, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, minWidth: 80 },
  availableBedId: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  availableBedStatus: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  footerBeds: { marginTop: 8 },
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  // Loading
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Hidden-patient notice (Census tab)
  hiddenNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  hiddenNoticeText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  hiddenNoticeBtn: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  hiddenNoticeBtnText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Discharge undo toast
  dischargeUndoToast: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: '#1C2B3A', borderRadius: 12,
    paddingTop: 13, paddingBottom: 0, paddingHorizontal: 18,
    flexDirection: 'column',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 10,
    zIndex: 999, overflow: 'hidden',
  },
  dischargeUndoToastRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10,
  },
  dischargeUndoToastText: { fontSize: 14, color: '#fff', fontFamily: 'Inter_400Regular', flex: 1, marginRight: 8 },
  dischargeUndoBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  dischargeUndoBtnText: { fontSize: 14, fontWeight: '700', color: '#4FC3F7', fontFamily: 'Inter_700Bold' },
  dischargeCountdownTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: -18 },
  dischargeCountdownBar: { height: 3, backgroundColor: '#4FC3F7' },
  // Shift-ended toast
  toastContainer: {
    position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 999,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  cancelText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  admitText: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  form: { flex: 1 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  bedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bedChip: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 6 },
  bedChipText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  noBedsBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  noBedsBannerText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  optionChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
