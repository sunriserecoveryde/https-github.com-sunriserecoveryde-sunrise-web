import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { usePatients } from '@/context/PatientContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useNursingNotes, NursingNote, NoteHistoryEntry } from '@/context/NursingNotesContext';
import { useRole } from '@/context/RoleContext';
import {
  PATIENTS,
  VITALS,
  MEDICATIONS,
  VitalEntry,
  Medication,
  MedClass,
  acuityColor,
} from '@/data/mockData';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 180,
  height = 48,
  label,
  unit = '',
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  label?: string;
  unit?: string;
}) {
  if (data.length < 2) return null;

  const padX = 6;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padY + innerH - ((v - min) / range) * innerH;

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const latestX = toX(data.length - 1);
  const latestY = toY(data[data.length - 1]);

  return (
    <View style={{ alignItems: 'center' }}>
      {label && (
        <Text style={[sparkStyles.label, { color }]}>{label}</Text>
      )}
      <Svg width={width} height={height}>
        {/* Grid line */}
        <Line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
        {/* Trend line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Latest value dot */}
        <Circle cx={latestX} cy={latestY} r={3.5} fill={color} />
        {/* Min label */}
        <SvgText x={padX} y={height - 2} fontSize={9} fill="rgba(0,0,0,0.35)">{min}{unit}</SvgText>
        {/* Max label */}
        <SvgText x={padX} y={11} fontSize={9} fill="rgba(0,0,0,0.35)">{max}{unit}</SvgText>
        {/* Latest value */}
        <SvgText x={latestX + 5} y={latestY + 4} fontSize={10} fontWeight="700" fill={color}>
          {data[data.length - 1]}{unit}
        </SvgText>
      </Svg>
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2, fontFamily: 'Inter_700Bold' },
});

// ─── Withdrawal threshold (must match census board) ───────────────────────────
const WD_THRESHOLD = 13; // COWS > 12 or CIWA > 12 per facility protocol

function isWithdrawalAlert(p: { cows?: number | null; ciwa?: number | null }): boolean {
  return (p.cows != null && p.cows >= WD_THRESHOLD) || (p.ciwa != null && p.ciwa >= WD_THRESHOLD);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSystolic(bp: string): number {
  return parseInt(bp.split('/')[0], 10) || 0;
}

function medClassColor(cls: MedClass, colors: ReturnType<typeof useColors>): { bg: string; text: string } {
  switch (cls) {
    case 'MAT':        return { bg: colors.purpleBg, text: colors.purple };
    case 'Psychiatric': return { bg: colors.routineBg, text: colors.blue };
    case 'Medical':    return { bg: colors.successBg, text: colors.success };
    case 'PRN':        return { bg: colors.moderateBg, text: colors.moderate };
  }
}

function getSeverityLabel(score: number, isCiwa: boolean) {
  if (isCiwa) {
    if (score <= 7) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Severe';
    return 'DANGER';
  }
  if (score <= 5) return 'Mild';
  if (score <= 12) return 'Moderate';
  if (score <= 24) return 'Severe';
  return 'DANGER';
}

function getScoreStyle(score: number, threshold: number, colors: ReturnType<typeof useColors>) {
  if (score >= threshold) return { bg: colors.criticalBg, text: colors.critical };
  const mid = threshold * 0.65;
  if (score >= mid) return { bg: colors.highBg, text: colors.high };
  if (score >= mid * 0.5) return { bg: colors.moderateBg, text: colors.moderate };
  return { bg: colors.successBg, text: colors.success };
}

// ─── Section components ───────────────────────────────────────────────────────

function SectionTitle({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function Card({ children, colors, style }: { children: React.ReactNode; colors: ReturnType<typeof useColors>; style?: any }) {
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

// ─── SwipeableNoteRow ─────────────────────────────────────────────────────────

const SWIPE_OPEN_THRESHOLD = 40;
const DELETE_BTN_WIDTH = 80;
const HINT_NUDGE = -28; // px to slide left for the discovery hint

function SwipeableNoteRow({
  children,
  onDelete,
  onLongPress,
  playHint = false,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  onLongPress: () => void;
  playHint?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  // One-time left-nudge hint so nurses discover the swipe gesture
  useEffect(() => {
    if (!playHint) return;
    const delay = setTimeout(() => {
      Animated.sequence([
        Animated.spring(translateX, {
          toValue: HINT_NUDGE,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
      ]).start();
    }, 600); // brief pause after render so the screen settles first
    return () => clearTimeout(delay);
  }, [playHint]);

  const snapTo = (toValue: number, cb?: () => void) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start(cb);
    isOpen.current = toValue !== 0;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        // Allow leftward drag (negative) and a small rubber-band rightward
        const x = isOpen.current ? Math.min(gs.dx - DELETE_BTN_WIDTH, 0) : Math.min(gs.dx, 0);
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, gs) => {
        const currentX = isOpen.current ? gs.dx - DELETE_BTN_WIDTH : gs.dx;
        if (currentX < -SWIPE_OPEN_THRESHOLD) {
          snapTo(-DELETE_BTN_WIDTH);
        } else {
          snapTo(0);
        }
      },
    }),
  ).current;

  const close = () => snapTo(0);

  return (
    <View style={sw.wrapper}>
      {/* Red delete button revealed underneath */}
      <View style={sw.deleteBackground}>
        <Pressable
          style={({ pressed }) => [sw.deleteBtn, { opacity: pressed ? 0.75 : 1 }]}
          onPress={() => {
            close();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={sw.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>

      {/* Swipeable card layer */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={400}
          onPress={() => { if (isOpen.current) snapTo(0); }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const sw = StyleSheet.create({
  wrapper: { overflow: 'hidden', borderRadius: 12, marginBottom: 8 },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BTN_WIDTH,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { alignItems: 'center', justifyContent: 'center', gap: 4, width: DELETE_BTN_WIDTH },
  deleteBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useRole();
  const nurseDisplayName = role === 'bht' ? 'James T., BHT' : 'Sarah M., RN';
  const { patients, dischargePatient } = usePatients();
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false);

  // ─── Add Note state ────────────────────────────────────────────────────────
  const { getNotesForPatient, addNote: addNoteToStore, updateNote, removeNote, restoreNote } = useNursingNotes();

  // ─── Swipe hint (runs once per session when notes exist) ──────────────────
  const swipeHintShown = useRef(false);

  // ─── Undo-delete toast ─────────────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<{
    note: NursingNote;
    patientId: string;
    originalIndex: number;
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(100)).current;
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const dismissToast = () => {
    Animated.timing(toastAnim, {
      toValue: 100,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPendingDelete(null));
    deleteTimerRef.current = null;
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    restoreNote(pendingDelete.patientId, pendingDelete.note, pendingDelete.originalIndex);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(toastAnim, {
      toValue: 100,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPendingDelete(null));
  };

  const handleDeleteNote = (note: NursingNote, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Commit any in-flight deletion before starting a new one
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    removeNote(id, note.id);
    setPendingDelete({ note, patientId: id, originalIndex: index });
    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
    deleteTimerRef.current = setTimeout(dismissToast, 4000);
  };

  type NoteType = 'observation' | 'med-update' | 'incident';

  const NOTE_TYPES: { value: NoteType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { value: 'observation', label: 'Observation', icon: 'eye-outline' },
    { value: 'med-update',  label: 'Med Update',  icon: 'medkit-outline' },
    { value: 'incident',    label: 'Incident',    icon: 'warning-outline' },
  ];

  const noteTypeColor = (type: NoteType) => {
    switch (type) {
      case 'observation': return { bg: colors.routineBg,  text: colors.blue };
      case 'med-update':  return { bg: colors.moderateBg, text: colors.moderate };
      case 'incident':    return { bg: colors.criticalBg, text: colors.critical };
    }
  };

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('observation');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // ─── History modal state ───────────────────────────────────────────────────
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<NoteHistoryEntry[]>([]);
  const [historyNoteText, setHistoryNoteText] = useState('');

  const openHistoryModal = (entries: NoteHistoryEntry[], currentText: string) => {
    setHistoryEntries(entries);
    setHistoryNoteText(currentText);
    setHistoryModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatHistoryTimestamp = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return iso;
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Tracks which note's 'Edited' tag is currently expanded to show the edit time
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);

  const toggleEditTime = (noteId: string) => {
    Haptics.selectionAsync();
    setExpandedEditId(prev => (prev === noteId ? null : noteId));
  };
  const openNoteModal = (prefill?: { id: string; text: string; noteType: NoteType }) => {
    if (prefill) {
      setEditingNoteId(prefill.id);
      setNoteText(prefill.text);
      setNoteType(prefill.noteType);
    } else {
      setEditingNoteId(null);
      setNoteText('');
      setNoteType('observation');
    }
    setNoteModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const closeNoteModal = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setNoteModalVisible(false);
      setNoteText('');
      setNoteType('observation');
      setEditingNoteId(null);
    });
  };

  const submitNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    if (editingNoteId) {
      updateNote(id, editingNoteId, trimmed, noteType, nurseDisplayName);
    } else {
      addNoteToStore(id, trimmed, noteType);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeNoteModal();
  };
  // ─── Share / export handoff notes ─────────────────────────────────────────
  const formatEditedTime = (isoString: string): string => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleShareNotes = () => {
    const sessionNotes = getNotesForPatient(id);
    if (sessionNotes.length === 0 && !patient?.handoffNote) return;

    const lines: string[] = [];
    lines.push(`NURSING HANDOFF — ${patient?.firstName ?? ''} ${patient?.lastName ?? ''} (${patient?.bed ?? patient?.program ?? ''})`);
    lines.push(`MRN: ${patient?.mrn ?? ''} · ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`);
    lines.push('');

    sessionNotes.forEach(note => {
      const lastEdit = note.history?.[note.history.length - 1];
      const editSuffix = lastEdit ? ` (edited ${formatEditedTime(lastEdit.savedAt)})` : '';
      const typeLabel = NOTE_TYPES.find(x => x.value === note.noteType)?.label ?? note.noteType;
      lines.push(`[${typeLabel}] ${note.displayTime}${editSuffix}`);
      lines.push(note.text);
      lines.push('');
    });

    if (patient?.handoffNote) {
      lines.push('[Handoff Note]');
      lines.push(patient.handoffNote);
      lines.push('');
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({ message: lines.join('\n').trim() });
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Look up patient from live roster first, fall back to static data for robustness
  const patient = patients.find(p => p.id === id) ?? PATIENTS.find(p => p.id === id);
  if (!patient) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Patient not found</Text>
      </View>
    );
  }

  const { acknowledgments, acknowledge, isAcknowledged } = useMdAcknowledgment();
  const mdAck = acknowledgments[patient.id];

  const vitals: VitalEntry[] = VITALS[patient.id] ?? [];
  const medications: Medication[] = (MEDICATIONS[patient.id] ?? []).filter(m => m.status === 'Active');
  const ac = acuityColor(patient.acuity);
  const hasCows = patient.cows != null && patient.cows > 0;
  const hasCiwa = patient.ciwa != null && patient.ciwa > 0;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  // Build sparkline series from vitals (oldest → newest)
  const vitalsAsc = [...vitals].reverse();
  const cowsSeries = vitalsAsc.map(v => v.cows).filter((v): v is number => v != null);
  const ciwaSeries = vitalsAsc.map(v => v.ciwa).filter((v): v is number => v != null);
  const bpSeries   = vitalsAsc.map(v => parseSystolic(v.bp));
  const hrSeries   = vitalsAsc.map(v => v.hr);

  const hasSparklines = vitalsAsc.length >= 2;

  // For withdrawal scores: rising = worse = red, falling = better = green, flat = blue
  const withdrawalTrendColor = (series: number[]) => {
    if (series.length < 2) return colors.blue;
    const delta = series[series.length - 1] - series[0];
    if (delta > 0) return colors.critical;   // rising — bad
    if (delta < 0) return colors.success;    // falling — good
    return colors.blue;                      // flat — neutral
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ─── Header ─── */}
      <View style={[s.header, { backgroundColor: colors.navy, paddingTop: topPad }]}>
        <View style={s.headerRow}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <Text style={s.backText}>Census</Text>
          </Pressable>

          <View style={[s.acuityBadge, { backgroundColor: ac.bg }]}>
            <Text style={[s.acuityText, { color: ac.text }]}>{patient.acuity}</Text>
          </View>
        </View>

        <View style={s.patientBlock}>
          <View style={[s.bedBadge, { backgroundColor: colors.navyMid }]}>
            <Text style={s.bedBadgeText}>{patient.bed ?? patient.program}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerName}>{patient.firstName} {patient.lastName}</Text>
            <Text style={s.headerMeta}>
              {patient.mrn} · {patient.age}{patient.gender} · LOS {patient.los}d · {patient.counselor}
            </Text>
            <Text style={s.headerDx} numberOfLines={1}>{patient.primaryDiagnosis}</Text>
          </View>
        </View>

        {/* Quick-stat row */}
        <View style={s.quickStats}>
          <View style={s.quickStat}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Next Appt</Text>
            <Text style={s.quickStatValue}>{patient.nextAppointment}</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStat}>
            <Ionicons name="flask-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Last UA</Text>
            <Text style={s.quickStatValue}>{patient.lastUa}</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStat}>
            <Ionicons name="happy-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Mood / Cravings</Text>
            <Text style={s.quickStatValue}>{patient.mood}/10 · {patient.cravings}/10</Text>
          </View>
        </View>
      </View>

      {/* ─── Add Note Modal ─── */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeNoteModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeNoteModal}>
            <View style={s.noteOverlay} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              s.bottomSheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Sheet handle */}
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: colors.navy }]}>{editingNoteId ? 'Edit Nursing Note' : 'Add Nursing Note'}</Text>
              <Pressable onPress={closeNoteModal} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[s.sheetPatientName, { color: colors.mutedForeground }]}>
              {patient.firstName} {patient.lastName} · {patient.bed ?? patient.program}
            </Text>

            {/* Note type selector */}
            <View style={s.noteTypeRow}>
              {NOTE_TYPES.map(nt => {
                const selected = noteType === nt.value;
                const tc = noteTypeColor(nt.value);
                return (
                  <Pressable
                    key={nt.value}
                    onPress={() => {
                      setNoteType(nt.value);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      s.noteTypeBtn,
                      {
                        backgroundColor: selected ? tc.bg : colors.muted,
                        borderColor: selected ? tc.text : colors.border,
                        borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Ionicons name={nt.icon} size={13} color={selected ? tc.text : colors.mutedForeground} />
                    <Text style={[s.noteTypeBtnText, { color: selected ? tc.text : colors.mutedForeground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                      {nt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Edit-mode history warning banner */}
            {editingNoteId && noteText.trim().length > 0 && (
              <View style={[s.editHistoryBanner, { backgroundColor: colors.routineBg, borderColor: colors.blue }]}>
                <Ionicons name="information-circle-outline" size={15} color={colors.blue} />
                <Text style={[s.editHistoryBannerText, { color: colors.blue }]}>
                  Your current note will be saved to edit history
                </Text>
              </View>
            )}

            <TextInput
              style={[
                s.noteInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.navy,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Type nursing note here…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />

            <Pressable
              onPress={submitNote}
              style={({ pressed }) => [
                s.submitBtn,
                { backgroundColor: colors.navy, opacity: pressed ? 0.85 : 1 },
                !noteText.trim() && { opacity: 0.4 },
              ]}
              disabled={!noteText.trim()}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={s.submitBtnText}>{editingNoteId ? 'Save Changes' : 'Save Note'}</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        onScroll={() => { if (expandedEditId !== null) setExpandedEditId(null); }}
        scrollEventThrottle={16}
      >

        {/* ─── Withdrawal scores ─── */}
        {(hasCows || hasCiwa) && (
          <View style={s.section}>
            <SectionTitle title="WITHDRAWAL SCORES" colors={colors} />
            <View style={s.scoreRow}>
              {hasCows && (() => {
                const c = getScoreStyle(patient.cows!, 13, colors);
                return (
                  <View style={[s.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                    <Text style={[s.scoreLabel, { color: c.text }]}>COWS</Text>
                    <Text style={[s.scoreValue, { color: c.text }]}>{patient.cows}</Text>
                    <Text style={[s.scoreSev, { color: c.text }]}>{getSeverityLabel(patient.cows!, false)}</Text>
                  </View>
                );
              })()}
              {hasCiwa && (() => {
                const c = getScoreStyle(patient.ciwa!, 15, colors);
                return (
                  <View style={[s.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                    <Text style={[s.scoreLabel, { color: c.text }]}>CIWA-Ar</Text>
                    <Text style={[s.scoreValue, { color: c.text }]}>{patient.ciwa}</Text>
                    <Text style={[s.scoreSev, { color: c.text }]}>{getSeverityLabel(patient.ciwa!, true)}</Text>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {/* ─── Vitals trend sparklines ─── */}
        <View style={s.section}>
          <SectionTitle title="VITALS TREND" colors={colors} />
          {hasSparklines ? (
            <Card colors={colors} style={s.sparkCard}>
              <View style={s.sparkRow}>
                {cowsSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={cowsSeries} color={withdrawalTrendColor(cowsSeries)} label="COWS" />
                  </View>
                )}
                {ciwaSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={ciwaSeries} color={withdrawalTrendColor(ciwaSeries)} label="CIWA" />
                  </View>
                )}
                {bpSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={bpSeries} color={colors.blue} label="SBP" unit=" mmHg" />
                  </View>
                )}
                {hrSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={hrSeries} color={colors.teal} label="HR" unit=" bpm" />
                  </View>
                )}
              </View>
              {vitalsAsc.length > 0 && (
                <Text style={[s.sparkHint, { color: colors.mutedForeground }]}>
                  Last recorded: {vitals[0].date} {vitals[0].time} · {vitals[0].recordedBy}
                </Text>
              )}
            </Card>
          ) : (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="pulse-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  {vitals.length === 1
                    ? 'Only one reading — trend requires at least two data points.'
                    : 'No vitals recorded for this patient yet.'}
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* ─── Vitals table ─── */}
        {vitals.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="VITAL SIGNS — RECENT READINGS" colors={colors} />
            <Card colors={colors} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <View style={[s.tableRow, s.tableHeaderRow, { backgroundColor: colors.muted }]}>
                {['Date', 'Time', 'BP', 'HR', 'Temp', 'O₂', 'Pain'].map(h => (
                  <Text key={h} style={[s.tableCell, s.tableHeaderCell, { color: colors.mutedForeground }]}>{h}</Text>
                ))}
              </View>
              {vitals.map((v, i) => (
                <View
                  key={v.id}
                  style={[
                    s.tableRow,
                    i < vitals.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[s.tableCell, { color: colors.navy }]}>{v.date}</Text>
                  <Text style={[s.tableCell, { color: colors.navy }]}>{v.time}</Text>
                  <Text style={[s.tableCell, { color: colors.navy, fontSize: 11 }]}>{v.bp}</Text>
                  <Text style={[s.tableCell, { color: v.hr > 100 ? colors.high : colors.navy }]}>{v.hr}</Text>
                  <Text style={[s.tableCell, { color: v.temp > 99 ? colors.moderate : colors.navy }]}>{v.temp}°</Text>
                  <Text style={[s.tableCell, { color: v.o2 < 96 ? colors.high : colors.success }]}>{v.o2}%</Text>
                  <Text style={[s.tableCell, { color: v.pain >= 7 ? colors.critical : v.pain >= 5 ? colors.moderate : colors.success }]}>{v.pain}/10</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ─── Active medications ─── */}
        <View style={s.section}>
          <SectionTitle title={`ACTIVE MEDICATIONS (${medications.length})`} colors={colors} />
          {medications.length > 0 ? (
            <View style={s.medList}>
              {medications.map((med, i) => {
                const cls = medClassColor(med.class, colors);
                return (
                  <Card key={med.id} colors={colors} style={[s.medCard, i === medications.length - 1 && { marginBottom: 0 }]}>
                    <View style={s.medRow}>
                      <View style={{ flex: 1 }}>
                        <View style={s.medNameRow}>
                          <Text style={[s.medName, { color: colors.navy }]}>{med.name}</Text>
                          <View style={[s.classBadge, { backgroundColor: cls.bg }]}>
                            <Text style={[s.classBadgeText, { color: cls.text }]}>{med.class}</Text>
                          </View>
                        </View>
                        {med.genericName && (
                          <Text style={[s.medGeneric, { color: colors.mutedForeground }]}>{med.genericName}</Text>
                        )}
                        <Text style={[s.medDetail, { color: colors.navyLight }]}>
                          {med.dose} · {med.route} · {med.frequency}
                        </Text>
                        {med.times.length > 0 && (
                          <View style={s.timesRow}>
                            {med.times.map(t => (
                              <View key={t} style={[s.timeBadge, { backgroundColor: colors.muted }]}>
                                <Text style={[s.timeText, { color: colors.navy }]}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="medkit-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No active medications on file.</Text>
              </View>
            </Card>
          )}
        </View>

        {/* ─── Flags ─── */}
        {patient.flags.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="FLAGS" colors={colors} />
            <View style={s.flagsList}>
              {patient.flags.map((f, i) => (
                <View key={i} style={[s.flagRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="flag" size={13} color={colors.high} />
                  <Text style={[s.flagText, { color: colors.navy }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── MD Notification ─── */}
        {isWithdrawalAlert(patient) && (
          <View style={s.section}>
            <SectionTitle title="MD NOTIFICATION" colors={colors} />
            {mdAck ? (
              <Card colors={colors} style={[s.mdAckCard, { borderColor: colors.success }]}>
                <View style={s.mdAckRow}>
                  <View style={[s.mdAckIcon, { backgroundColor: colors.successBg }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.mdAckTitle, { color: colors.success }]}>MD notified</Text>
                    <Text style={[s.mdAckMeta, { color: colors.mutedForeground }]}>
                      Logged at {mdAck.displayTime} · Today
                    </Text>
                  </View>
                </View>
              </Card>
            ) : (
              <Card colors={colors} style={[s.mdPendingCard, { borderColor: colors.critical }]}>
                <View style={s.mdAckRow}>
                  <View style={[s.mdAckIcon, { backgroundColor: colors.criticalBg }]}>
                    <Ionicons name="call-outline" size={20} color={colors.critical} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.mdAckTitle, { color: colors.critical }]}>MD notification required</Text>
                    <Text style={[s.mdAckMeta, { color: colors.mutedForeground }]}>
                      Withdrawal score exceeds threshold — log when MD is notified
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    acknowledge(patient.id);
                  }}
                  style={[s.mdAckButton, { backgroundColor: colors.success }]}
                >
                  <Ionicons name="call-outline" size={14} color="#fff" />
                  <Text style={s.mdAckButtonText}>Log MD Notified</Text>
                </Pressable>
              </Card>
            )}
          </View>
        )}

        {/* ─── Handoff note ─── */}
        <View style={s.section}>
          <View style={s.handoffSectionHeader}>
            {/* Title + count badge */}
            <View style={s.handoffTitleRow}>
              <SectionTitle title="NURSING HANDOFF NOTE" colors={colors} />
              {(() => {
                const totalNotes = getNotesForPatient(patient.id).length + (patient.handoffNote ? 1 : 0);
                if (totalNotes === 0) return null;
                return (
                  <View style={[s.noteCountBadge, { backgroundColor: colors.navy }]}>
                    <Text style={s.noteCountBadgeText}>{totalNotes}</Text>
                  </View>
                );
              })()}
            </View>
            <View style={s.handoffActionRow}>
              {getNotesForPatient(patient.id).length > 0 || patient.handoffNote ? (
                <Pressable
                  onPress={handleShareNotes}
                  style={({ pressed }) => [
                    s.shareNoteBtn,
                    { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="share-outline" size={14} color={colors.navy} />
                  <Text style={[s.shareNoteBtnText, { color: colors.navy }]}>Export</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => openNoteModal()}
                style={({ pressed }) => [
                  s.addNoteBtn,
                  { backgroundColor: colors.navy, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={s.addNoteBtnText}>Add Note</Text>
              </Pressable>
            </View>
          </View>

          {/* Session notes (persisted in context, most recent first) */}
          {getNotesForPatient(patient.id).map((note, index) => {
            const tc = noteTypeColor(note.noteType);
            const nt = NOTE_TYPES.find(x => x.value === note.noteType)!;
            const handleLongPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'Note Options',
                '',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Edit',
                    onPress: () => {
                      openNoteModal({ id: note.id, text: note.text, noteType: note.noteType });
                    },
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteNote(note, index),
                  },
                ],
              );
            };
            // Only the very first note gets the hint, and only once per session
            const shouldPlayHint = index === 0 && !swipeHintShown.current;
            if (shouldPlayHint) swipeHintShown.current = true;

            return (
              <SwipeableNoteRow
                key={note.id}
                onDelete={() => handleDeleteNote(note, index)}
                onLongPress={handleLongPress}
                playHint={shouldPlayHint}
              >
                <View
                  style={[
                    s.sessionNote,
                    { backgroundColor: tc.bg, borderColor: tc.text, marginBottom: 0 },
                  ]}
                >
                  <View style={s.sessionNoteHeader}>
                    <View style={[s.noteTypeBadge, { backgroundColor: tc.bg, borderColor: tc.text }]}>
                      <Ionicons name={nt.icon} size={11} color={tc.text} />
                      <Text style={[s.noteTypeBadgeText, { color: tc.text }]}>{nt.label}</Text>
                    </View>
                    <View style={s.sessionNoteMeta}>
                      <Text style={[s.sessionNoteLabel, { color: colors.mutedForeground }]}>This session · {note.displayTime}</Text>
                      {note.history && note.history.length > 0 && (() => {
                        const isExpanded = expandedEditId === note.id;
                        const lastEdit = note.history[note.history.length - 1];
                        const editTime = new Date(lastEdit.savedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return (
                          <Pressable
                            onPress={() => toggleEditTime(note.id)}
                            onLongPress={() => { if (note.history && note.history.length > 0) openHistoryModal(note.history, note.text); }}
                            hitSlop={8}
                            style={[s.editedTag, { backgroundColor: isExpanded ? colors.routineBg : colors.muted }]}
                          >
                            <Ionicons name="pencil-outline" size={10} color={isExpanded ? colors.blue : colors.mutedForeground} />
                            <Text style={[s.editedTagText, { color: isExpanded ? colors.blue : colors.mutedForeground }]}>
                              {isExpanded
                                ? lastEdit.editedBy
                                  ? `Edited by ${lastEdit.editedBy} at ${editTime}`
                                  : `Edited at ${editTime}`
                                : 'Edited'}
                            </Text>
                          </Pressable>
                        );
                      })()}
                      <Ionicons name="ellipsis-horizontal" size={13} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
                    </View>
                  </View>
                  <Text style={[s.sessionNoteText, { color: colors.navy }]}>{note.text}</Text>
                </View>
              </SwipeableNoteRow>
            );
          })}

          {/* Original handoff note */}
          {patient.handoffNote ? (
            <View style={[s.handoffNote, { backgroundColor: colors.navyMid }]}>
              <Text style={s.handoffText}>{patient.handoffNote}</Text>
            </View>
          ) : getNotesForPatient(patient.id).length === 0 ? (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="document-text-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No handoff note on file. Tap "Add Note" to create one.</Text>
              </View>
            </Card>
          ) : null}
        </View>

        {/* ─── Discharge ─── */}
        <View style={s.section}>
          <Pressable
            style={[s.dischargeBtn, { borderColor: colors.critical }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setDischargeModalVisible(true);
            }}
          >
            <Ionicons name="exit-outline" size={18} color={colors.critical} />
            <Text style={[s.dischargeBtnText, { color: colors.critical }]}>Discharge Patient</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* ─── Undo delete toast ─── */}
      {pendingDelete && (
        <Animated.View
          style={[
            s.undoToast,
            { bottom: Math.max(insets.bottom, 8) + 16, transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Text style={s.undoToastText}>Note deleted</Text>
          <Pressable onPress={handleUndo} hitSlop={12} style={s.undoBtn}>
            <Text style={s.undoBtnText}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ─── Edit History Modal ─── */}
      <Modal
        visible={historyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 0, alignItems: 'stretch' }]}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={[s.historyIconWrap, { backgroundColor: colors.routineBg }]}>
                  <Ionicons name="time-outline" size={15} color={colors.blue} />
                </View>
                <Text style={[s.modalTitle, { color: colors.navy, fontSize: 16 }]}>Edit History</Text>
              </View>
              <Pressable onPress={() => setHistoryModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Prior versions — oldest first */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {[...historyEntries].reverse().map((entry, i) => {
                const tc = (() => {
                  switch (entry.noteType) {
                    case 'observation': return { bg: colors.routineBg,  text: colors.blue };
                    case 'med-update':  return { bg: colors.moderateBg, text: colors.moderate };
                    case 'incident':    return { bg: colors.criticalBg, text: colors.critical };
                  }
                })();
                const isOldest = i === historyEntries.length - 1;
                return (
                  <View
                    key={i}
                    style={[
                      s.historyEntry,
                      { borderColor: colors.border, backgroundColor: colors.muted },
                      i < historyEntries.length - 1 && { marginBottom: 8 },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <View style={[s.noteTypeBadge, { backgroundColor: tc.bg, borderColor: tc.text }]}>
                        <Text style={[s.noteTypeBadgeText, { color: tc.text }]}>{entry.noteType}</Text>
                      </View>
                      <Text style={[s.historyTimestamp, { color: colors.mutedForeground }]}>
                        {isOldest ? 'Original · ' : 'Version · '}{formatHistoryTimestamp(entry.savedAt)}
                      </Text>
                    </View>
                    {entry.editedBy ? (
                      <Text style={[s.historyByLine, { color: colors.mutedForeground }]}>
                        Edited by {entry.editedBy} at {formatHistoryTimestamp(entry.savedAt)}
                      </Text>
                    ) : null}
                    <Text style={[s.historyEntryText, { color: colors.navy }]}>{entry.text}</Text>
                  </View>
                );
              })}

              {/* Current version */}
              <View style={[s.historyEntry, { borderColor: colors.navy, backgroundColor: colors.card, borderWidth: 1.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <View style={[s.historyCurrentBadge, { backgroundColor: colors.navy }]}>
                    <Text style={s.historyCurrentBadgeText}>Current</Text>
                  </View>
                  <Text style={[s.historyTimestamp, { color: colors.mutedForeground }]}>Latest version</Text>
                </View>
                <Text style={[s.historyEntryText, { color: colors.navy }]}>{historyNoteText}</Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setHistoryModalVisible(false)}
              style={[s.modalBtn, { backgroundColor: colors.muted, marginTop: 14 }]}
            >
              <Text style={[s.modalBtnText, { color: colors.navy }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Discharge confirmation modal ─── */}
      <Modal
        visible={dischargeModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDischargeModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.modalIconWrap, { backgroundColor: colors.criticalBg }]}>
              <Ionicons name="exit-outline" size={28} color={colors.critical} />
            </View>
            <Text style={[s.modalTitle, { color: colors.navy }]}>Discharge Patient?</Text>
            <Text style={[s.modalBody, { color: colors.mutedForeground }]}>
              {patient.firstName} {patient.lastName} will be removed from the active census,
              MAR, and morning check lists. Bed {patient.bed ?? '—'} will be marked available.
              This cannot be undone from the app.
            </Text>
            <View style={s.modalActions}>
              <Pressable
                style={[s.modalBtn, s.modalBtnCancel, { backgroundColor: colors.muted }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDischargeModalVisible(false);
                }}
              >
                <Text style={[s.modalBtnText, { color: colors.navy }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtn, s.modalBtnConfirm, { backgroundColor: colors.critical }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setDischargeModalVisible(false);
                  dischargePatient(patient.id);
                  router.back();
                }}
              >
                <Text style={[s.modalBtnText, { color: '#fff' }]}>Confirm Discharge</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_500Medium' },
  acuityBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  acuityText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  patientBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  bedBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 2 },
  bedBadgeText: { fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerName: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  headerDx: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontFamily: 'Inter_400Regular' },
  // Quick stats strip
  quickStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 10, gap: 0 },
  quickStat: { flex: 1, alignItems: 'center', gap: 2 },
  quickStatDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  quickStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter_400Regular' },
  quickStatValue: { fontSize: 11, color: '#fff', fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  // Content
  scroll: { flex: 1 },
  content: { padding: 14, gap: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, fontFamily: 'Inter_700Bold' },
  // Card
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  // Score cards
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  scoreValue: { fontSize: 44, fontWeight: '700', fontFamily: 'Inter_700Bold', lineHeight: 52 },
  scoreSev: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Sparklines
  sparkCard: { paddingBottom: 8 },
  sparkRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 6 },
  sparkItem: { alignItems: 'center' },
  sparkHint: { fontSize: 10, textAlign: 'center', marginTop: 6, fontFamily: 'Inter_400Regular' },
  // Empty state
  emptyVitals: { alignItems: 'center', padding: 20, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  // Vitals table
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10 },
  tableHeaderRow: { borderTopLeftRadius: 11, borderTopRightRadius: 11 },
  tableCell: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Medications
  medList: { gap: 8 },
  medCard: { marginBottom: 0 },
  medRow: { flexDirection: 'row', alignItems: 'flex-start' },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  medName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  medGeneric: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  medDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 5 },
  classBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  classBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  timeBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  timeText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Flags
  flagsList: { gap: 6 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  flagText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  // Handoff
  handoffNote: { borderRadius: 12, padding: 14 },
  handoffText: { fontSize: 14, color: '#fff', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  // Discharge
  dischargeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14,
  },
  dischargeBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Discharge modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 24, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalIconWrap: { borderRadius: 50, padding: 14, marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', textAlign: 'center' },
  modalBody: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalBtnCancel: {},
  modalBtnConfirm: {},
  modalBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // MD notification
  mdAckCard: { borderWidth: 1.5 },
  mdPendingCard: { borderWidth: 1.5 },
  mdAckRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mdAckIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mdAckTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 2 },
  mdAckMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  mdAckButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, borderRadius: 8, paddingVertical: 10 },
  mdAckButtonText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  // Handoff / Add Note
  handoffSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  handoffTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteCountBadge: { borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  noteCountBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  handoffActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  shareNoteBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addNoteBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  // Session notes
  sessionNote: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  sessionNoteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  sessionNoteMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionNoteLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  sessionNoteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  editedTag: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  editedTagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  // Note bottom sheet
  noteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  sheetPatientName: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  noteInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: 'Inter_400Regular', minHeight: 120, marginBottom: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14 },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  // Note type selector
  noteTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  noteTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, paddingVertical: 8 },
  noteTypeBtnText: { fontSize: 12 },
  // Edit-mode history warning banner
  editHistoryBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  editHistoryBannerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  // Note type badge (on submitted notes)
  noteTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  noteTypeBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  // Undo delete toast
  undoToast: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: '#1C2B3A', borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 10,
  },
  undoToastText: { fontSize: 14, color: '#fff', fontFamily: 'Inter_400Regular' },
  undoBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  undoBtnText: { fontSize: 14, fontWeight: '700', color: '#4FC3F7', fontFamily: 'Inter_700Bold' },
  // Edited badge
  editedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: StyleSheet.hairlineWidth },
  editedBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  // History modal
  historyIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  historyEntry: { borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth },
  historyEntryText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  historyTimestamp: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  historyByLine: { fontSize: 10, fontFamily: 'Inter_400Regular', fontStyle: 'italic', marginBottom: 4 },
  historyCurrentBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  historyCurrentBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#fff' },
});
