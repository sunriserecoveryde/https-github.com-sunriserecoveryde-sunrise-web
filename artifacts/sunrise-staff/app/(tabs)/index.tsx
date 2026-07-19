import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { usePatients } from '@/context/PatientContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useNursingNotes } from '@/context/NursingNotesContext';
import {
  BEDS,
  VITALS,
  Patient,
  Acuity,
  acuityColor,
} from '@/data/mockData';

type Filter = 'All' | Acuity | 'Available';
const FILTERS: Filter[] = ['All', 'Critical', 'High', 'Moderate', 'Routine', 'Available'];

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

function formatNoteType(type: string): string {
  if (type === 'observation') return 'Observation';
  if (type === 'med-update')  return 'Med Update';
  if (type === 'incident')    return 'Incident';
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
  const { acknowledge, isAcknowledged, acknowledgments } = useMdAcknowledgment();
  const alertPatients = patients.filter(isWithdrawalAlert);
  if (alertPatients.length === 0) return null;

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
  return (
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

function BedCard({ patient, onPress }: { patient: Patient; onPress: () => void }) {
  const colors = useColors();
  const { getNotesForPatient } = useNursingNotes();
  const ac = acuityColor(patient.acuity);
  const showCows = patient.cows != null && patient.cows > 0;
  const showCiwa = patient.ciwa != null && patient.ciwa > 0;
  const isAlert = isWithdrawalAlert(patient);
  const notes = getNotesForPatient(patient.id);
  const noteCount = notes.length;
  const latestNoteType = notes[0]?.noteType ?? null;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.bedCard, { backgroundColor: isAlert ? '#FFF5F5' : colors.card, borderLeftColor: ac.border }]}
    >
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
          {latestNoteType != null && latestNoteType !== 'observation' && (() => {
            const tc = latestNoteType === 'incident'
              ? { bg: colors.criticalBg, text: colors.critical }
              : { bg: colors.moderateBg, text: colors.moderate };
            const icon = latestNoteType === 'incident' ? 'warning-outline' : 'medkit-outline';
            return (
              <View style={[styles.noteTypePill, { backgroundColor: tc.bg, borderColor: tc.text }]}>
                <Ionicons name={icon as any} size={10} color={tc.text} />
                <Text style={[styles.noteTypePillText, { color: tc.text }]} numberOfLines={1}>
                  {formatNoteType(latestNoteType)}
                </Text>
              </View>
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
            return (
              <View style={[styles.scorePill, { backgroundColor: c.bg }]}>
                <Text style={[styles.scoreText, { color: c.text }]}>
                  {'COWS ' + patient.cows}
                  {trend != null && (
                    <Text style={{ color: trendColor(trend, colors) }}>{trendArrow(trend)}</Text>
                  )}
                </Text>
              </View>
            );
          })()}
          {showCiwa && (() => {
            const c = getScoreStyle(patient.ciwa!, 15, colors);
            const trend = getScoreTrend(patient.id, 'ciwa');
            return (
              <View style={[styles.scorePill, { backgroundColor: c.bg }]}>
                <Text style={[styles.scoreText, { color: c.text }]}>
                  {'CIWA ' + patient.ciwa}
                  {trend != null && (
                    <Text style={{ color: trendColor(trend, colors) }}>{trendArrow(trend)}</Text>
                  )}
                </Text>
              </View>
            );
          })()}
        </View>
        <View style={styles.moodSection}>
          <Text style={[styles.moodLabel, { color: colors.mutedForeground }]}>Mood</Text>
          <MoodBar value={patient.mood} colors={colors} />
        </View>
      </View>

      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for vitals history</Text>
    </Pressable>
  );
}

function AvailableBedCard({ bedId, status }: { bedId: string; status: string }) {
  const colors = useColors();
  const bgColor = status === 'Available' ? colors.successBg : colors.muted;
  const textColor = status === 'Available' ? colors.success : colors.mutedForeground;
  const icon = status === 'Available' ? 'bed-outline' : 'refresh-outline';
  return (
    <View style={[styles.availableBedCard, { backgroundColor: bgColor, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={18} color={textColor} />
      <Text style={[styles.availableBedId, { color: textColor }]}>{bedId}</Text>
      <Text style={[styles.availableBedStatus, { color: textColor }]}>{status}</Text>
    </View>
  );
}

// ─── Admit Patient Modal ──────────────────────────────────────────────────────

const ACUITY_OPTIONS: Acuity[] = ['Routine', 'Moderate', 'High', 'Critical'];
const PROGRAM_OPTIONS = ['Residential', 'PHP', 'IOP', 'OP'] as const;

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

  function resetForm() {
    setFirstName('');
    setLastName('');
    setBed('');
    setDiagnosis('');
    setAcuity('Routine');
    setProgram('Residential');
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
      age: 0,
      gender: 'M',
      program,
      primaryDiagnosis: diagnosis.trim() || 'Pending assessment',
      acuity,
      bed: bed.trim().toUpperCase(),
      bedStatus: 'Occupied',
      flags: [],
      admitDate,
      los: 0,
      counselor: 'TBD',
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
  const [filter, setFilter] = useState<Filter>('All');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [admitVisible, setAdmitVisible] = useState(false);
  const [shiftEndedToast, setShiftEndedToast] = useState(false);
  const shiftEndedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFiredHaptic = useRef(false);

  // ─── Live census data from context ────────────────────────────────────────
  const { patients, bedStatusMap, refreshFromApi } = usePatients();
  const { clearNotes } = useNursingNotes();
  const { clearAcknowledgments } = useMdAcknowledgment();
  const residentialPatients = patients.filter(p => p.bed != null);

  // Build bed lists from live context data
  const allBedIds = BEDS.map(b => b.id);
  const occupiedBedIds = new Set(patients.map(p => p.bed).filter(Boolean));
  const occupiedCount = occupiedBedIds.size;
  const nonOccupiedBeds = allBedIds
    .filter(id => !occupiedBedIds.has(id))
    .map(id => ({ id, status: bedStatusMap[id] ?? 'Available' }));
  const availableCount = nonOccupiedBeds.filter(b => b.status === 'Available').length;
  const cleaningCount = nonOccupiedBeds.filter(b => b.status === 'Cleaning').length;
  const availableBedIds = nonOccupiedBeds.filter(b => b.status === 'Available').map(b => b.id);

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

  useEffect(() => {
    if (alertCount > 0 && !hasFiredHaptic.current) {
      hasFiredHaptic.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [alertCount]);

  const filteredPatients = filter === 'Available'
    ? []
    : residentialPatients.filter(p => filter === 'All' || p.acuity === filter);

  const openPatient = (p: Patient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${p.id}` as any);
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
                        setBannerDismissed(false);
                        setFilter('All');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        // Show toast confirmation
                        if (shiftEndedTimer.current) clearTimeout(shiftEndedTimer.current);
                        setShiftEndedToast(true);
                        shiftEndedTimer.current = setTimeout(() => setShiftEndedToast(false), 2000);
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
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.orange }]}
            onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? '#fff' : colors.slateLight }]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : (
        <FlatList
          data={filter === 'Available' ? [] : filteredPatients}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <BedCard patient={item} onPress={() => openPatient(item)} />}
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
          ListHeaderComponent={filter === 'Available' ? (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Non-Occupied Beds</Text>
              <View style={styles.availableGrid}>
                {nonOccupiedBeds.map(b => <AvailableBedCard key={b.id} bedId={b.id} status={b.status} />)}
              </View>
            </View>
          ) : null}
          ListFooterComponent={filter !== 'Available' && nonOccupiedBeds.length > 0 ? (
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

      {/* Shift-ended toast */}
      {shiftEndedToast && (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.navy }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.toastText}>Shift ended — board reset</Text>
          </View>
        </View>
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  filterChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
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
  noteBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2, maxWidth: 140 },
  noteBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  noteBadgeSep: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular' },
  noteBadgeType: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  noteTypePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, marginTop: 2 },
  noteTypePillText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold', flexShrink: 1 },
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
