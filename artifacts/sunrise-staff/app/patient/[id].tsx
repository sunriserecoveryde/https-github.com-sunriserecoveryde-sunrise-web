import React, { useState, useRef, useEffect, useImperativeHandle, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import Svg, { G, Polyline, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useSwipeHint } from '@/hooks/useSwipeHint';
import { useScrollToSection } from '@/hooks/useScrollToSection';
import { usePatients } from '@/context/PatientContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useNursingNotes, NursingNote, NoteHistoryEntry } from '@/context/NursingNotesContext';
import { useRole } from '@/context/RoleContext';
import { SessionRecorderModal } from '@/components/SessionRecorderModal';
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
  timestamps,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  label?: string;
  unit?: string;
  /** Optional ISO or formatted time strings, one per data point (oldest→newest). */
  timestamps?: string[];
}) {
  // #49: track which point the nurse tapped so we can show its reading time.
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

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

  // Callout label for the selected point
  const callout = selectedIdx !== null
    ? `${data[selectedIdx]}${unit}${timestamps?.[selectedIdx] ? ' · ' + timestamps[selectedIdx] : ''}`
    : null;

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
        {/* Tappable hit targets for each data point (#49) */}
        {data.map((v, i) => {
          const cx = toX(i);
          const cy = toY(v);
          const isSel = selectedIdx === i;
          return (
            <G key={i} onPress={() => setSelectedIdx(isSel ? null : i)}>
              {/* Invisible hit area */}
              <Rect x={cx - 10} y={cy - 10} width={20} height={20} fill="transparent" />
              {isSel && <Circle cx={cx} cy={cy} r={5} fill={color} opacity={0.25} />}
              {isSel && <Circle cx={cx} cy={cy} r={3} fill={color} />}
            </G>
          );
        })}
      </Svg>
      {/* Callout strip shown below chart when a point is selected */}
      {callout && (
        <Text style={[sparkStyles.callout, { color }]}>{callout}</Text>
      )}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2, fontFamily: 'Inter_700Bold' },
  callout: { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginTop: 2 },
});

// ─── Withdrawal threshold (must match census board) ───────────────────────────
const WD_THRESHOLD = 13; // COWS > 12 or CIWA > 12 per facility protocol

// ─── Module-level session caches (survive tab-switches, reset on hard reload) ──
// #52: note-type breakdown chip filter per patient — avoids filter losing state
// when the nurse navigates away and returns within the same session.
const _noteTypeFilters: Record<string, 'incident' | 'med-update' | null> = {};

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

// ─── Word-level diff ──────────────────────────────────────────────────────────

type DiffToken = { type: 'equal' | 'remove' | 'add'; text: string };

function wordDiff(oldText: string, newText: string): DiffToken[] {
  const oldWords = oldText.split(/\s+/).filter(Boolean);
  const newWords = newText.split(/\s+/).filter(Boolean);
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS table
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce tokens
  const tokens: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      tokens.unshift({ type: 'equal', text: oldWords[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokens.unshift({ type: 'add', text: newWords[j - 1] });
      j--;
    } else {
      tokens.unshift({ type: 'remove', text: oldWords[i - 1] });
      i--;
    }
  }
  return tokens;
}

function DiffText({
  tokens,
  baseStyle,
}: {
  tokens: DiffToken[];
  baseStyle?: object;
}) {
  return (
    <Text style={baseStyle}>
      {tokens.map((token, idx) => {
        const spacer = idx < tokens.length - 1 ? ' ' : '';
        if (token.type === 'remove') {
          return (
            <Text
              key={idx}
              style={{ color: '#C53030', textDecorationLine: 'line-through' }}
            >
              {token.text}{spacer}
            </Text>
          );
        }
        if (token.type === 'add') {
          return (
            <Text
              key={idx}
              style={{ color: '#276749', textDecorationLine: 'underline' }}
            >
              {token.text}{spacer}
            </Text>
          );
        }
        return <Text key={idx}>{token.text}{spacer}</Text>;
      })}
    </Text>
  );
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
//
// Hint key lives here, adjacent to the component, so any future consumer of
// SwipeableNoteRow can find and wire it without hunting through the file (#168).
export const SWIPEABLE_NOTE_ROW_HINT_KEY = 'swipeHintShown';

const SWIPE_OPEN_THRESHOLD = 40;
const DELETE_BTN_WIDTH = 80;
const HINT_NUDGE = -28; // px to slide left for the discovery hint

interface SwipeableNoteRowHandle {
  close: () => void;
}

const SwipeableNoteRow = React.forwardRef<
  SwipeableNoteRowHandle,
  {
    children: React.ReactNode;
    onDelete: () => void;
    onLongPress: () => void;
    onOpen: () => void;
    /** Unique key passed to useSwipeHint; omit to disable the hint on this row. */
    hintKey?: string;
  }
>(function SwipeableNoteRow({ children, onDelete, onLongPress, onOpen, hintKey }, ref) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // One-time left-nudge hint so nurses discover the swipe gesture.
  // useSwipeHint persists the flag via AsyncStorage so it only plays once
  // across all app launches. Omitting hintKey (undefined) disables the hint
  // entirely and never touches AsyncStorage.
  const { playHint } = useSwipeHint(hintKey);

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

  const snapTo = useCallback((toValue: number, cb?: () => void) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start(cb);
    isOpen.current = toValue !== 0;
  }, [translateX]);

  useImperativeHandle(ref, () => ({ close: () => snapTo(0) }), [snapTo]);

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
          onOpenRef.current();
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
});

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

// Alias for the co-located constant on SwipeableNoteRow (defined above).
const SWIPE_HINT_KEY = SWIPEABLE_NOTE_ROW_HINT_KEY;

export default function PatientDetailScreen() {
  const { id, scrollTo, noteFilter: noteFilterParam } = useLocalSearchParams<{ id: string; scrollTo?: string; noteFilter?: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useRole();
  const nurseDisplayName = role === 'bht' ? 'James T., BHT' : 'Sarah M., RN';
  const { patients, pendingDischarge, startPendingDischarge, undoDischarge, loading: patientsLoading } = usePatients();
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false);

  // ─── Discharge undo toast ──────────────────────────────────────────────────
  const [dischargeToastVisible, setDischargeToastVisible] = useState(false);
  const dischargeToastAnim = useRef(new Animated.Value(100)).current;
  const dischargeCountdownAnim = useRef(new Animated.Value(1)).current;
  const dischargeCountdownAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const dischargeHalfwayHapticRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dischargeToastActiveRef = useRef(false);
  const [dischargeToastWidth, setDischargeToastWidth] = useState(0);

  // ─── Discharge pending hint (shown when disabled button is tapped) ────────
  const [dischargePendingHintVisible, setDischargePendingHintVisible] = useState(false);
  const dischargePendingHintAnim = useRef(new Animated.Value(0)).current;
  const dischargePendingHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDischargePendingHint = useCallback(() => {
    if (dischargePendingHintTimerRef.current) {
      clearTimeout(dischargePendingHintTimerRef.current);
    }
    setDischargePendingHintVisible(true);
    Animated.timing(dischargePendingHintAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
    dischargePendingHintTimerRef.current = setTimeout(() => {
      Animated.timing(dischargePendingHintAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setDischargePendingHintVisible(false));
    }, 2000);
  }, [dischargePendingHintAnim]);

  // Cancel the hint auto-dismiss timer, the countdown animation, and the
  // halfway haptic if the component unmounts while any of them are still
  // running (e.g. the nurse navigates away mid-toast). Without this, the
  // animation keeps ticking in the background and the haptic may still fire
  // after the screen is gone, producing stray callbacks on an unmounted tree.
  useEffect(() => {
    return () => {
      if (dischargePendingHintTimerRef.current) {
        clearTimeout(dischargePendingHintTimerRef.current);
      }
      if (dischargeCountdownAnimRef.current) {
        dischargeCountdownAnimRef.current.stop();
        dischargeCountdownAnimRef.current = null;
      }
      if (dischargeHalfwayHapticRef.current) {
        clearTimeout(dischargeHalfwayHapticRef.current);
        dischargeHalfwayHapticRef.current = null;
      }
    };
  }, []);

  // ─── Session recorder ─────────────────────────────────────────────────────
  const [recorderVisible, setRecorderVisible] = useState(false);

  // ─── Add Note state ────────────────────────────────────────────────────────
  const {
    getNotesForPatient,
    addNote: addNoteToStore,
    updateNote,
    pendingDelete,
    startPendingDelete,
    undoPendingDelete,
    clearPendingDelete,
    isRehydrating: notesIsRehydrating,
  } = useNursingNotes();

  // ─── Auto-navigate back when discharge undo window expires ────────────────
  // startPendingDischarge removes the patient from the roster immediately
  // (optimistic), but the patient detail screen stays open (using the static
  // PATIENTS fallback) so the discharge undo toast is visible. Once the undo
  // window closes (pendingDischarge becomes null) AND the patient is no longer
  // in the live roster, we navigate back to the census board.
  // Also fires for an immediate navigate-back if the patient is simply absent
  // on mount (e.g. discharged from a different screen).
  useEffect(() => {
    if (patientsLoading) return;
    const stillInRoster = patients.some(p => p.id === id);
    const hasOpenWindow = pendingDischarge?.patient.id === id;
    if (!stillInRoster && !hasOpenWindow) {
      router.back();
    }
  }, [patients, pendingDischarge, id, patientsLoading]);

  // ─── Drive discharge toast from context pendingDischarge ──────────────────
  useEffect(() => {
    const isMyDischarge = pendingDischarge?.patient.id === id;

    // Shared helper — start (or restart) the countdown animation + halfway haptic.
    const startDischargeCountdown = () => {
      if (dischargeCountdownAnimRef.current) dischargeCountdownAnimRef.current.stop();
      if (dischargeHalfwayHapticRef.current) {
        clearTimeout(dischargeHalfwayHapticRef.current);
        dischargeHalfwayHapticRef.current = null;
      }
      if (!pendingDischarge) return;
      const remaining = Math.max(0, pendingDischarge.expiresAt - Date.now());
      const fraction = remaining / 4000;
      dischargeCountdownAnim.setValue(fraction);
      if (remaining > 0) {
        dischargeCountdownAnimRef.current = Animated.timing(dischargeCountdownAnim, {
          toValue: 0,
          duration: remaining,
          useNativeDriver: false, // width interpolation cannot use native driver
        });
        dischargeCountdownAnimRef.current.start();
        // Fire a light haptic at the halfway point so nurses feel the urgency
        // even when the screen is off-center. Only schedule if enough time is
        // left that the haptic won't fire immediately or after the window closes.
        if (remaining > 1000) {
          dischargeHalfwayHapticRef.current = setTimeout(() => {
            dischargeHalfwayHapticRef.current = null;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, remaining / 2);
        }
      }
    };

    if (isMyDischarge && !dischargeToastActiveRef.current) {
      // Fresh show
      dischargeToastActiveRef.current = true;
      setDischargeToastVisible(true);
      startDischargeCountdown();
      Animated.spring(dischargeToastAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else if (!isMyDischarge && dischargeToastActiveRef.current) {
      // Hide — undo tapped or timer expired (roster update drives navigation)
      dischargeToastActiveRef.current = false;
      if (dischargeCountdownAnimRef.current) {
        dischargeCountdownAnimRef.current.stop();
        dischargeCountdownAnimRef.current = null;
      }
      if (dischargeHalfwayHapticRef.current) {
        clearTimeout(dischargeHalfwayHapticRef.current);
        dischargeHalfwayHapticRef.current = null;
      }
      Animated.timing(dischargeToastAnim, {
        toValue: 100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setDischargeToastVisible(false));
    }

    return () => {
      if (dischargeHalfwayHapticRef.current) {
        clearTimeout(dischargeHalfwayHapticRef.current);
        dischargeHalfwayHapticRef.current = null;
      }
    };
  }, [pendingDischarge, id]);

  const handleUndoDischarge = () => {
    undoDischarge();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Scroll-to-section support ────────────────────────────────────────────
  // All three targets share one ScrollView ref (primary call owns it; secondary
  // calls receive it via the third argument).  Both already-mounted and
  // fresh-mount paths are handled by the hook.
  // See hooks/useScrollToSection.ts and __tests__/useScrollToSection.test.ts.
  const { scrollViewRef, onSectionLayout: onNotesSectionLayout, scrollNow: scrollToNotes } = useScrollToSection(scrollTo, 'notes');
  const { onSectionLayout: onVitalsSectionLayout } = useScrollToSection(scrollTo, 'vitals', scrollViewRef);
  const { onSectionLayout: onScoresSectionLayout } = useScrollToSection(scrollTo, 'scores', scrollViewRef);

  // ─── Swipe-to-delete: one-row-at-a-time + tap-outside-to-close ───────────
  const openRowRef = useRef<SwipeableNoteRowHandle | null>(null);
  const rowRefsMap = useRef<Map<string, SwipeableNoteRowHandle>>(new Map());

  const handleRowOpen = useCallback((noteId: string) => {
    // Close the previously open row (if different)
    const prev = openRowRef.current;
    const next = rowRefsMap.current.get(noteId) ?? null;
    if (prev && prev !== next) prev.close();
    openRowRef.current = next;
  }, []);

  const closeOpenRow = useCallback(() => {
    openRowRef.current?.close();
    openRowRef.current = null;
  }, []);

  // ─── Undo-delete toast ─────────────────────────────────────────────────────
  // pendingDelete lives in NursingNotesContext so it survives navigation.
  // toastVisible / toastAnim are purely local UI state driven by the context value.
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(100)).current;
  // Tracks which note id is currently animated in, to detect replace-toast transitions.
  const toastNoteIdRef = useRef<string | null>(null);
  // Countdown bar: 1.0 = full width, 0.0 = empty. Captured toast width for interpolation.
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const countdownAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const halfwayHapticRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastContainerWidth, setToastContainerWidth] = useState(0);

  // ─── Clipboard-fallback modal (shown when browser blocks clipboard write) ──
  const [clipboardFallbackVisible, setClipboardFallbackVisible] = useState(false);
  const [clipboardFallbackText, setClipboardFallbackText] = useState('');

  // ─── Copied-to-clipboard toast ─────────────────────────────────────────────
  const [copiedToastVisible, setCopiedToastVisible] = useState(false);
  const copiedToastAnim = useRef(new Animated.Value(100)).current;
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCopiedToast = () => {
    setCopiedToastVisible(true);
    Animated.spring(copiedToastAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      Animated.timing(copiedToastAnim, {
        toValue: 100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setCopiedToastVisible(false);
        copiedTimerRef.current = null;
      });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // ─── Unmount cleanup for note-delete toast ─────────────────────────────────
  // Stop the countdown animation and cancel the halfway-haptic timer if the
  // nurse navigates away while the 4-second undo window is still open.
  // Without this, countdownAnimRef keeps ticking and halfwayHapticRef can fire
  // a haptic callback against a completely unmounted component tree.
  // (The context-level timer that drives setPendingDelete is owned by
  // NursingNotesProvider and is unaffected by screen unmount — it correctly
  // finalises the deletion in the background, which is the intended behavior.)
  useEffect(() => {
    return () => {
      if (countdownAnimRef.current) {
        countdownAnimRef.current.stop();
        countdownAnimRef.current = null;
      }
      if (halfwayHapticRef.current) {
        clearTimeout(halfwayHapticRef.current);
        halfwayHapticRef.current = null;
      }
    };
  }, []);

  // ─── Drive toast animation from context pendingDelete ─────────────────────
  // pendingDelete lives in context so it persists across navigation.  When the
  // nurse leaves the chart and comes back the effect fires on mount, sees a
  // pending delete for this patient, and springs the toast back in with the
  // time already counting down in context.
  useEffect(() => {
    const noteId = pendingDelete?.patientId === id ? pendingDelete.note.id : null;

    // ── Countdown bar helper ────────────────────────────────────────────────
    // Starts (or restarts) the drain animation from the correct remaining
    // fraction so the bar is accurate whether this is a fresh show or a
    // return-from-navigation mount.
    const startCountdown = () => {
      if (countdownAnimRef.current) countdownAnimRef.current.stop();
      // Clear any pending halfway haptic before scheduling a new one
      if (halfwayHapticRef.current) {
        clearTimeout(halfwayHapticRef.current);
        halfwayHapticRef.current = null;
      }
      if (!pendingDelete) return;
      const remaining = Math.max(0, pendingDelete.expiresAt - Date.now());
      const fraction = remaining / 4000;
      countdownAnim.setValue(fraction);
      if (remaining > 0) {
        countdownAnimRef.current = Animated.timing(countdownAnim, {
          toValue: 0,
          duration: remaining,
          useNativeDriver: false, // width interpolation cannot use native driver
        });
        countdownAnimRef.current.start();
        // Fire a light haptic at the halfway point so nurses feel the urgency
        // even when the screen is off-center. Only schedule if there's enough
        // time left that the haptic won't fire immediately or after expiry.
        if (remaining > 1000) {
          halfwayHapticRef.current = setTimeout(() => {
            halfwayHapticRef.current = null;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, remaining / 2);
        }
      }
    };

    if (noteId !== null && toastNoteIdRef.current === null) {
      // Guard: if the undo window is almost over, skip the toast entirely so it
      // doesn't flash in and immediately slide back out (ghost toast).
      const MINIMUM_SHOW_MS = 500;
      if (pendingDelete && pendingDelete.expiresAt - Date.now() < MINIMUM_SHOW_MS) {
        clearPendingDelete();
        return;
      }
      // Fresh show — toast was not visible
      toastNoteIdRef.current = noteId;
      setToastVisible(true);
      startCountdown();
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else if (noteId !== null && toastNoteIdRef.current !== noteId) {
      // Replace — a second deletion happened while toast was up; slide out then in
      toastNoteIdRef.current = noteId;
      startCountdown();
      Animated.timing(toastAnim, {
        toValue: 100,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(toastAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      });
    } else if (noteId === null && toastNoteIdRef.current !== null) {
      // Hide — timer expired, undo tapped, or navigated to a different patient
      toastNoteIdRef.current = null;
      if (countdownAnimRef.current) {
        countdownAnimRef.current.stop();
        countdownAnimRef.current = null;
      }
      if (halfwayHapticRef.current) {
        clearTimeout(halfwayHapticRef.current);
        halfwayHapticRef.current = null;
      }
      Animated.timing(toastAnim, {
        toValue: 100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }
    return () => {
      if (halfwayHapticRef.current) {
        clearTimeout(halfwayHapticRef.current);
        halfwayHapticRef.current = null;
      }
    };
  }, [pendingDelete, id]);

  const handleUndo = () => {
    undoPendingDelete();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteNote = (note: NursingNote, index: number) => {
    // Guard: if this note is already the one pending deletion, do nothing.
    if (pendingDelete?.note.id === note.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clean up the row ref immediately so no stale ref lingers during the undo window.
    rowRefsMap.current.delete(note.id);
    // startPendingDelete removes the note from the store, sets context state, and
    // manages the 4-second timer — all in context so navigation doesn't reset it.
    startPendingDelete(id, note, index);
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

  // ─── Per-type note filter (seeded from route param when tapping a census chip) ─
  const validNoteTypes: NoteType[] = ['observation', 'med-update', 'incident'];
  const initialNoteTypeFilter: NoteType | null =
    noteFilterParam && validNoteTypes.includes(noteFilterParam as NoteType)
      ? (noteFilterParam as NoteType)
      : null;
  const [activeNoteTypeFilter, setActiveNoteTypeFilter] = useState<NoteType | null>(initialNoteTypeFilter);

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('observation');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [originalNoteText, setOriginalNoteText] = useState('');
  const noteIsDirty = !editingNoteId || noteText !== originalNoteText;
  // #52: persist the note-type breakdown-chip filter across navigation using a
  // module-level cache keyed by patient id, so returning to the same patient
  // restores the filter state without needing a context or AsyncStorage round-trip.
  const [noteTypeFilter, _setNoteTypeFilter] = useState<'incident' | 'med-update' | null>(
    _noteTypeFilters[id] ?? null
  );
  const setNoteTypeFilter = React.useCallback((v: 'incident' | 'med-update' | null) => {
    _noteTypeFilters[id] = v;
    _setNoteTypeFilter(v);
  }, [id]);
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
  // Tracks which vitals table row is expanded to show trend sparklines
  const [expandedVitalId, setExpandedVitalId] = useState<string | null>(null);

  const toggleEditTime = (noteId: string) => {
    Haptics.selectionAsync();
    setExpandedEditId(prev => (prev === noteId ? null : noteId));
  };
  const DRAFT_KEY = `@sunrise_note_draft_${id}`;

  // Autosave draft for new notes (not edits) so force-quit can't lose typed text
  useEffect(() => {
    if (noteModalVisible && !editingNoteId) {
      AsyncStorage.setItem(DRAFT_KEY, noteText).catch(() => {});
    }
  }, [noteText, noteModalVisible, editingNoteId]);


  const openNoteModal = async (prefill?: { id: string; text: string; noteType: NoteType }) => {
    if (prefill) {
      setEditingNoteId(prefill.id);
      setNoteText(prefill.text);
      setOriginalNoteText(prefill.text);
      setNoteType(prefill.noteType);
    } else {
      setOriginalNoteText('');
      setEditingNoteId(null);
      setNoteType('observation');
      // Restore unsaved draft if one exists
      try {
        const saved = await AsyncStorage.getItem(DRAFT_KEY);
        setNoteText(saved ?? '');
      } catch {
        setNoteText('');
      }
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
    // Discard draft only if this was a new note (not an edit)
    if (!editingNoteId) {
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    }
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
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
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

    const exportText = lines.join('\n').trim();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // On web, fall back to clipboard when the native share sheet isn't available
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(exportText).then(() => {
          showCopiedToast();
        }).catch(() => {
          // Clipboard write was denied — show a selectable text fallback modal
          setClipboardFallbackText(exportText);
          setClipboardFallbackVisible(true);
        });
      } else {
        // Clipboard API not available — show the fallback modal directly
        setClipboardFallbackText(exportText);
        setClipboardFallbackVisible(true);
      }
      return;
    }

    Share.share({ message: exportText });
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

  const { acknowledgments, acknowledge, isAcknowledged, isRehydrating: mdIsRehydrating } = useMdAcknowledgment();
  const mdAck = acknowledgments[patient.id];

  const vitals: VitalEntry[] = VITALS[patient.id] ?? [];
  const medications: Medication[] = (MEDICATIONS[patient.id] ?? []).filter(m => m.status === 'Active');
  // PRN administration logging — local session state; each tap marks the med as
  // given for this visit and is cleared when the screen unmounts (#mobile-prn).
  const [prnLogged, setPrnLogged] = React.useState<Set<string>>(new Set());
  const logPrn = React.useCallback((medId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPrnLogged(prev => new Set(prev).add(medId));
  }, []);
  const ac = acuityColor(patient.acuity);

  // ─── Note type breakdown (for header chips) ───────────────────────────────
  const sessionNotes = getNotesForPatient(id);
  const incidentCount  = sessionNotes.filter(n => n.noteType === 'incident').length;
  const medUpdateCount = sessionNotes.filter(n => n.noteType === 'med-update').length;
  const showNoteBreakdown = incidentCount > 0 && medUpdateCount > 0;

  const handleBreakdownChipPress = (type: 'incident' | 'med-update') => {
    Haptics.selectionAsync();
    setNoteTypeFilter(noteTypeFilter === type ? null : type);
    setTimeout(() => {
      scrollToNotes();
    }, 50);
  };
  const hasCows = patient.cows != null && patient.cows > 0;
  const hasCiwa = patient.ciwa != null && patient.ciwa > 0;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  // Build sparkline series from vitals (oldest → newest)
  const vitalsAsc = [...vitals].reverse();
  const cowsSeries  = vitalsAsc.map(v => v.cows).filter((v): v is number => v != null);
  const ciwaSeries  = vitalsAsc.map(v => v.ciwa).filter((v): v is number => v != null);
  const bpSeries    = vitalsAsc.map(v => parseSystolic(v.bp));
  const hrSeries    = vitalsAsc.map(v => v.hr);
  const tempSeries  = vitalsAsc.map(v => v.temp);
  const o2Series    = vitalsAsc.map(v => v.o2);
  const painSeries  = vitalsAsc.map(v => v.pain);
  // Timestamps aligned to each reading series (#49). COWS/CIWA are filtered so
  // need their own aligned arrays; the rest share vitalsTs (all readings present).
  const vitalsTs    = vitalsAsc.map(v => v.time ?? v.date ?? '');
  const cowsTs      = vitalsAsc.filter(v => v.cows  != null).map(v => v.time ?? v.date ?? '');
  const ciwaTs      = vitalsAsc.filter(v => v.ciwa  != null).map(v => v.time ?? v.date ?? '');

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
    <View
      style={[s.container, { backgroundColor: colors.background }]}
      onStartShouldSetResponderCapture={() => {
        // Close any open swipe-delete row on every touch, then let the event pass through
        if (openRowRef.current) closeOpenRow();
        return false;
      }}
    >
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

        {/* Note type breakdown — only when >1 non-observation type exists */}
        {showNoteBreakdown && (
          <View style={s.noteBreakdownRow}>
            <Pressable
              onPress={() => handleBreakdownChipPress('incident')}
              style={[
                s.noteBreakdownChip,
                { backgroundColor: colors.criticalBg, borderColor: noteTypeFilter === 'incident' ? colors.critical : 'rgba(255,255,255,0.25)' },
                noteTypeFilter === 'incident' && s.noteBreakdownChipActive,
              ]}
            >
              <Ionicons name="warning-outline" size={11} color={colors.critical} />
              <Text style={[s.noteBreakdownChipText, { color: colors.critical }]}>{incidentCount}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleBreakdownChipPress('med-update')}
              style={[
                s.noteBreakdownChip,
                { backgroundColor: colors.moderateBg, borderColor: noteTypeFilter === 'med-update' ? colors.moderate : 'rgba(255,255,255,0.25)' },
                noteTypeFilter === 'med-update' && s.noteBreakdownChipActive,
              ]}
            >
              <Ionicons name="medkit-outline" size={11} color={colors.moderate} />
              <Text style={[s.noteBreakdownChipText, { color: colors.moderate }]}>{medUpdateCount}</Text>
            </Pressable>
            {noteTypeFilter != null && (
              <Pressable
                onPress={() => { setNoteTypeFilter(null); Haptics.selectionAsync(); }}
                style={[s.noteBreakdownChip, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)' }]}
              >
                <Ionicons name="close" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={[s.noteBreakdownChipText, { color: 'rgba(255,255,255,0.8)' }]}>All</Text>
              </Pressable>
            )}
          </View>
        )}
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
              { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) + 8 },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Sheet handle */}
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: colors.navy }]}>{editingNoteId ? 'Edit Nursing Note' : 'Add Nursing Note'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  onPress={() => setRecorderVisible(true)}
                  hitSlop={12}
                  style={[s.recorderBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Ionicons name="mic-outline" size={17} color={colors.teal} />
                  <Text style={[s.recorderBtnText, { color: colors.teal }]}>Record</Text>
                </Pressable>
                <Pressable onPress={closeNoteModal} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
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
                (!noteText.trim() || !noteIsDirty) && { opacity: 0.4 },
              ]}
              disabled={!noteText.trim() || !noteIsDirty}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={s.submitBtnText}>{editingNoteId ? 'Save Changes' : 'Save Note'}</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Session Recorder Modal ─── */}
      <SessionRecorderModal
        visible={recorderVisible}
        onClose={() => setRecorderVisible(false)}
        patientName={`${patient.firstName} ${patient.lastName}`}
        onUseTranscript={(text) => {
          setNoteText(prev => prev ? `${prev}\n\n${text}` : text);
          setRecorderVisible(false);
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        onScroll={() => { if (expandedEditId !== null) setExpandedEditId(null); }}
        scrollEventThrottle={16}
        onScrollBeginDrag={closeOpenRow}
      >

        {/* ─── Withdrawal scores ─── */}
        {(hasCows || hasCiwa) && (
          <View style={s.section} onLayout={onScoresSectionLayout}>
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
        <View style={s.section} onLayout={onVitalsSectionLayout}>
          <SectionTitle title="VITALS TREND" colors={colors} />
          {hasSparklines ? (
            <Card colors={colors} style={s.sparkCard}>
              <View style={s.sparkRow}>
                {cowsSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={cowsSeries} color={withdrawalTrendColor(cowsSeries)} label="COWS" timestamps={cowsTs} />
                  </View>
                )}
                {ciwaSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={ciwaSeries} color={withdrawalTrendColor(ciwaSeries)} label="CIWA" timestamps={ciwaTs} />
                  </View>
                )}
                {bpSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={bpSeries} color={colors.blue} label="SBP" unit=" mmHg" timestamps={vitalsTs} />
                  </View>
                )}
                {hrSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={hrSeries} color={colors.teal} label="HR" unit=" bpm" timestamps={vitalsTs} />
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
            <SectionTitle title="VITAL SIGNS — TAP ROW FOR TRENDS" colors={colors} />
            <Card colors={colors} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <View style={[s.tableRow, s.tableHeaderRow, { backgroundColor: colors.muted }]}>
                <View style={{ width: 18 }} />
                {['Date', 'BP', 'HR', 'Temp', 'O₂', 'Pain'].map(h => (
                  <Text key={h} style={[s.tableCell, s.tableHeaderCell, { color: colors.mutedForeground }]}>{h}</Text>
                ))}
              </View>
              {vitals.map((v, i) => {
                const isExpanded = expandedVitalId === v.id;
                return (
                  <React.Fragment key={v.id}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setExpandedVitalId(isExpanded ? null : v.id);
                      }}
                      style={[
                        s.tableRow,
                        i < vitals.length - 1 && !isExpanded && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        isExpanded && { backgroundColor: colors.routineBg },
                      ]}
                    >
                      {/* Expand chevron */}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={isExpanded ? colors.blue : colors.mutedForeground}
                        style={{ width: 18 }}
                      />
                      <Text style={[s.tableCell, { color: colors.navy, fontSize: 11 }]}>{v.date}</Text>
                      <Text style={[s.tableCell, { color: colors.navy, fontSize: 11 }]}>{v.bp}</Text>
                      <Text style={[s.tableCell, { color: v.hr > 100 ? colors.high : colors.navy }]}>{v.hr}</Text>
                      <Text style={[s.tableCell, { color: v.temp > 99 ? colors.moderate : colors.navy }]}>{v.temp}°</Text>
                      <Text style={[s.tableCell, { color: v.o2 < 96 ? colors.high : colors.success }]}>{v.o2}%</Text>
                      <Text style={[s.tableCell, { color: v.pain >= 7 ? colors.critical : v.pain >= 5 ? colors.moderate : colors.success }]}>{v.pain}/10</Text>
                    </Pressable>

                    {/* ── Inline sparkline panel ── */}
                    {isExpanded && vitalsAsc.length >= 2 && (
                      <View style={[s.sparkPanel, { backgroundColor: colors.routineBg, borderTopColor: colors.border, borderBottomColor: i < vitals.length - 1 ? colors.border : 'transparent', borderBottomWidth: i < vitals.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
                        <Text style={[s.sparkPanelTitle, { color: colors.blue }]}>
                          Trends — {vitalsAsc.length} readings, oldest → newest
                        </Text>
                        <View style={s.sparkPanelGrid}>
                          {hrSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={hrSeries} color={colors.critical} width={90} height={36} label="HR" unit=" bpm" timestamps={vitalsTs} />
                            </View>
                          )}
                          {bpSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={bpSeries} color={colors.purple} width={90} height={36} label="SBP" unit=" mmHg" timestamps={vitalsTs} />
                            </View>
                          )}
                          {tempSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={tempSeries} color={colors.moderate} width={90} height={36} label="Temp" unit="°" timestamps={vitalsTs} />
                            </View>
                          )}
                          {o2Series.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={o2Series} color={colors.teal} width={90} height={36} label="O₂ Sat" unit="%" timestamps={vitalsTs} />
                            </View>
                          )}
                          {painSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={painSeries} color={colors.high} width={90} height={36} label="Pain" unit="/10" timestamps={vitalsTs} />
                            </View>
                          )}
                          {cowsSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={cowsSeries} color={withdrawalTrendColor(cowsSeries)} width={90} height={36} label="COWS" />
                            </View>
                          )}
                          {ciwaSeries.length >= 2 && (
                            <View style={s.sparkPanelItem}>
                              <Sparkline data={ciwaSeries} color={withdrawalTrendColor(ciwaSeries)} width={90} height={36} label="CIWA" />
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
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
                        {/* PRN: show "Log PRN" tap-to-log button or "Given" badge */}
                        {med.class === 'PRN' && (
                          prnLogged.has(med.id)
                            ? (
                              <View style={[s.prnGivenBadge, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                <Text style={[s.prnGivenText, { color: colors.success }]}>
                                  Given · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() => logPrn(med.id)}
                                style={[s.prnLogBtn, { borderColor: colors.moderate, backgroundColor: colors.moderateBg }]}
                              >
                                <Ionicons name="add-circle-outline" size={12} color={colors.moderate} />
                                <Text style={[s.prnLogBtnText, { color: colors.moderate }]}>Log PRN</Text>
                              </Pressable>
                            )
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
        {/* Guard: hide until MdAcknowledgmentContext finishes reading from storage
            so the badge never briefly shows the wrong acknowledged/unacknowledged
            state on cold start. */}
        {!mdIsRehydrating && isWithdrawalAlert(patient) && (
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
        {/* Guard: hide until NursingNotesContext finishes reading from storage
            so the section never briefly appears empty on cold start. */}
        <View
          style={[s.section, notesIsRehydrating && { opacity: 0 }]}
          onLayout={onNotesSectionLayout}
          pointerEvents={notesIsRehydrating ? 'none' : 'auto'}
        >
          <View style={s.handoffSectionHeader}>
            {/* Title + count badge */}
            <View style={s.handoffTitleRow}>
              <SectionTitle title="NURSING HANDOFF NOTE" colors={colors} />
              {/* #188: when a filter is active show "X of Y" so nurses
                  know they are seeing a subset, not all notes. */}
              {(() => {
                const allNotes = getNotesForPatient(patient.id);
                const totalNotes = allNotes.length + (patient.handoffNote ? 1 : 0);
                if (totalNotes === 0) return null;
                const isFiltered = noteTypeFilter != null || activeNoteTypeFilter != null;
                const filteredCount = isFiltered
                  ? allNotes.filter(n =>
                      (noteTypeFilter == null || n.noteType === noteTypeFilter) &&
                      (activeNoteTypeFilter == null || n.noteType === activeNoteTypeFilter)
                    ).length
                  : totalNotes;
                return (
                  <View style={[s.noteCountBadge, { backgroundColor: isFiltered ? colors.moderate : colors.navy }]}>
                    <Text style={s.noteCountBadgeText}>
                      {isFiltered ? `${filteredCount} of ${totalNotes}` : totalNotes}
                    </Text>
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

          {/* Note type filter pills — shown when there are session notes */}
          {getNotesForPatient(patient.id).length > 0 && (() => {
            const allNotes = getNotesForPatient(patient.id);
            const typesPresent = NOTE_TYPES.filter(nt => allNotes.some(n => n.noteType === nt.value));
            if (typesPresent.length < 2) return null; // only show when multiple types exist
            return (
              <View style={s.noteFilterRow}>
                {activeNoteTypeFilter !== null && (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setActiveNoteTypeFilter(null); }}
                    style={[s.noteFilterChip, { backgroundColor: colors.navy }]}
                  >
                    <Ionicons name="close-circle" size={11} color="#fff" />
                    <Text style={[s.noteFilterChipText, { color: '#fff' }]}>All</Text>
                  </Pressable>
                )}
                {typesPresent.map(nt => {
                  const tc = noteTypeColor(nt.value);
                  const isActive = activeNoteTypeFilter === nt.value;
                  return (
                    <Pressable
                      key={nt.value}
                      onPress={() => { Haptics.selectionAsync(); setActiveNoteTypeFilter(isActive ? null : nt.value); }}
                      style={[
                        s.noteFilterChip,
                        { backgroundColor: isActive ? tc.bg : colors.muted, borderColor: isActive ? tc.text : colors.border, borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth },
                      ]}
                    >
                      <Ionicons name={nt.icon} size={11} color={isActive ? tc.text : colors.mutedForeground} />
                      <Text style={[s.noteFilterChipText, { color: isActive ? tc.text : colors.mutedForeground }]}>{nt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })()}

          {/* Session notes (persisted in context, most recent first) */}
          {(() => {
            const allNotes = getNotesForPatient(patient.id);
            // Apply both filter sources: header breakdown chip (noteTypeFilter) and
            // route-param pre-filter from census chip tap (activeNoteTypeFilter)
            const visibleNotes = allNotes.filter(n =>
              (noteTypeFilter == null || n.noteType === noteTypeFilter) &&
              (activeNoteTypeFilter == null || n.noteType === activeNoteTypeFilter)
            );
            return visibleNotes.map((note, filteredIndex) => {
            // Use the original index so undo-restore lands at the right position
            const index = allNotes.findIndex(n => n.id === note.id);
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
            return (
              <SwipeableNoteRow
                key={note.id}
                ref={(r) => {
                  if (r) rowRefsMap.current.set(note.id, r);
                  else rowRefsMap.current.delete(note.id);
                }}
                onDelete={() => { handleDeleteNote(note, index); closeOpenRow(); }}
                onLongPress={handleLongPress}
                hintKey={index === 0 ? SWIPE_HINT_KEY : undefined}
                onOpen={() => handleRowOpen(note.id)}
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
                        const lastHistory = note.history[note.history.length - 1];
                        const editTime = new Date(lastHistory.savedAt).toLocaleTimeString([], {
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
                                ? lastHistory.editedBy
                                  ? `Edited by ${lastHistory.editedBy} at ${editTime}`
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
          });
          })()}

          {/* Empty state when type filter yields no results */}
          {activeNoteTypeFilter != null && getNotesForPatient(patient.id).every(n => n.noteType !== activeNoteTypeFilter) && (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="filter-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No {NOTE_TYPES.find(nt => nt.value === activeNoteTypeFilter)?.label} notes for this patient.</Text>
              </View>
            </Card>
          )}

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
        {/* Disable the button while this patient's discharge undo window is
            open. Re-entering via deep-link or history must not let the nurse
            trigger a second discharge cycle. The button stays visible but is
            visually dimmed and shows "Discharge pending…" so the state is
            clear. */}
        {(() => {
          const dischargePending = pendingDischarge?.patient.id === patient.id;
          return (
            <View style={s.section}>
              <Pressable
                style={[
                  s.dischargeBtn,
                  { borderColor: dischargePending ? colors.mutedForeground : colors.critical },
                  dischargePending && { opacity: 0.45 },
                ]}
                onPress={() => {
                  if (dischargePending) {
                    showDischargePendingHint();
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDischargeModalVisible(true);
                }}
              >
                <Ionicons
                  name="exit-outline"
                  size={18}
                  color={dischargePending ? colors.mutedForeground : colors.critical}
                />
                <Text
                  style={[
                    s.dischargeBtnText,
                    { color: dischargePending ? colors.mutedForeground : colors.critical },
                  ]}
                >
                  {dischargePending ? 'Discharge pending…' : 'Discharge Patient'}
                </Text>
              </Pressable>
              {dischargePendingHintVisible && (
                <Animated.View
                  style={[
                    s.dischargePendingHint,
                    { opacity: dischargePendingHintAnim },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[s.dischargePendingHintText, { color: colors.mutedForeground }]}>
                    Undo window is open — wait a moment or tap Undo
                  </Text>
                </Animated.View>
              )}
            </View>
          );
        })()}

      </ScrollView>

      {/* ─── Undo delete toast ─── */}
      {toastVisible && (
        <Animated.View
          onLayout={e => setToastContainerWidth(e.nativeEvent.layout.width)}
          style={[
            s.undoToast,
            { bottom: Math.max(insets.bottom, 8) + 16, transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Text style={s.undoToastText}>Note deleted</Text>
          <Pressable onPress={handleUndo} hitSlop={12} style={s.undoBtn}>
            <Text style={s.undoBtnText}>Undo</Text>
          </Pressable>
          {/* Draining countdown bar — drains left as the undo window closes */}
          {toastContainerWidth > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                borderBottomLeftRadius: 12,
                backgroundColor: 'rgba(79, 195, 247, 0.55)',
                width: countdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, toastContainerWidth],
                }),
              }}
            />
          )}
        </Animated.View>
      )}

      {/* ─── Discharge undo toast ─── */}
      {dischargeToastVisible && (
        <Animated.View
          onLayout={e => setDischargeToastWidth(e.nativeEvent.layout.width)}
          style={[
            s.undoToast,
            { bottom: Math.max(insets.bottom, 8) + 64, transform: [{ translateY: dischargeToastAnim }] },
          ]}
        >
          <Ionicons name="exit-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={[s.undoToastText, { flex: 1 }]}>Patient discharged</Text>
          <Pressable onPress={handleUndoDischarge} hitSlop={12} style={s.undoBtn}>
            <Text style={s.undoBtnText}>Undo</Text>
          </Pressable>
          {/* Draining countdown bar */}
          {dischargeToastWidth > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                borderBottomLeftRadius: 12,
                backgroundColor: 'rgba(229, 62, 62, 0.55)',
                width: dischargeCountdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, dischargeToastWidth],
                }),
              }}
            />
          )}
        </Animated.View>
      )}

      {/* ─── Copied-to-clipboard toast (web fallback) ─── */}
      {copiedToastVisible && (
        <Animated.View
          style={[
            s.undoToast,
            { bottom: Math.max(insets.bottom, 8) + 16, transform: [{ translateY: copiedToastAnim }] },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#4FC3F7" style={{ marginRight: 8 }} />
          <Text style={[s.undoToastText, { flex: 1 }]}>Notes copied to clipboard</Text>
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
              {(() => {
                const reversed = [...historyEntries].reverse();
                return reversed.map((entry, i) => {
                  const tc = (() => {
                    switch (entry.noteType) {
                      case 'observation': return { bg: colors.routineBg,  text: colors.blue };
                      case 'med-update':  return { bg: colors.moderateBg, text: colors.moderate };
                      case 'incident':    return { bg: colors.criticalBg, text: colors.critical };
                    }
                  })();
                  // reversed is newest-first: reversed[0]=most-recent-prior, reversed[N-1]=original
                  const isOldest = i === reversed.length - 1;
                  // Diff this version against the version that came after it chronologically.
                  // The next newer version is at a lower index in the reversed array.
                  // For the most-recent prior version (i===0), diff against current text.
                  const nextText = i > 0 ? reversed[i - 1].text : historyNoteText;
                  const diffTokens = wordDiff(entry.text, nextText);
                  const hasDiff = diffTokens.some(t => t.type !== 'equal');
                  return (
                    <View
                      key={i}
                      style={[
                        s.historyEntry,
                        { borderColor: colors.border, backgroundColor: colors.muted },
                        i < reversed.length - 1 && { marginBottom: 8 },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <View style={[s.noteTypeBadge, { backgroundColor: tc.bg, borderColor: tc.text }]}>
                          <Text style={[s.noteTypeBadgeText, { color: tc.text }]}>{entry.noteType}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[s.historyTimestamp, { color: colors.mutedForeground }]}>
                            {isOldest ? 'Original · ' : 'Edited · '}{formatHistoryTimestamp(entry.savedAt)}
                          </Text>
                          {entry.editedBy ? (
                            <Text style={[s.historyTimestamp, { color: colors.blue, fontFamily: 'Inter_600SemiBold', marginTop: 1 }]}>
                              {entry.editedBy}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {hasDiff ? (
                        <DiffText
                          tokens={diffTokens}
                          baseStyle={[s.historyEntryText, { color: colors.navy }]}
                        />
                      ) : (
                        <Text style={[s.historyEntryText, { color: colors.navy }]}>{entry.text}</Text>
                      )}
                      {hasDiff && (
                        <View style={s.diffLegend}>
                          <View style={s.diffLegendItem}>
                            <Text style={s.diffLegendRemoved}>removed</Text>
                          </View>
                          <View style={s.diffLegendItem}>
                            <Text style={s.diffLegendAdded}>added in next</Text>
                          </View>
                        </View>
                      )}
                      {entry.editedBy ? (
                        <Text style={[s.historyByLine, { color: colors.mutedForeground }]}>
                          Edited by {entry.editedBy} at {formatHistoryTimestamp(entry.savedAt)}
                        </Text>
                      ) : null}
                    </View>
                  );
                });
              })()}

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
              You'll have a few seconds to undo if you tap the wrong patient.
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
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  setDischargeModalVisible(false);
                  startPendingDischarge(patient);
                }}
              >
                <Text style={[s.modalBtnText, { color: '#fff' }]}>Confirm Discharge</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Clipboard fallback modal ──────────────────────────────────────── */}
      <Modal
        visible={clipboardFallbackVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setClipboardFallbackVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.clipFallbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.modalIconWrap, { backgroundColor: colors.routineBg }]}>
              <Ionicons name="clipboard-outline" size={28} color={colors.blue} />
            </View>
            <Text style={[s.modalTitle, { color: colors.navy }]}>Copy Handoff Notes</Text>
            <Text style={[s.clipFallbackLabel, { color: colors.mutedForeground }]}>
              Copy the text below to share your handoff notes
            </Text>
            <TextInput
              style={[s.clipFallbackInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
              value={clipboardFallbackText}
              multiline
              editable
              selectTextOnFocus
              scrollEnabled
            />
            <Pressable
              style={[s.modalBtn, s.modalBtnConfirm, { backgroundColor: colors.blue, marginTop: 12 }]}
              onPress={() => {
                Haptics.selectionAsync();
                setClipboardFallbackVisible(false);
              }}
            >
              <Text style={[s.modalBtnText, { color: '#fff' }]}>Done</Text>
            </Pressable>
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
  // Note type breakdown chips in header
  noteBreakdownRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  noteBreakdownChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1 },
  noteBreakdownChipActive: { borderWidth: 2 },
  noteBreakdownChipText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
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
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  tableHeaderRow: { borderTopLeftRadius: 11, borderTopRightRadius: 11 },
  tableCell: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Inline sparkline expansion panel
  sparkPanel: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sparkPanelTitle: {
    fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  sparkPanelGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  sparkPanelItem: {
    alignItems: 'center',
  },
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
  prnGivenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  prnGivenText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  prnLogBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  prnLogBtnText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Flags
  flagsList: { gap: 6 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  flagText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  // Note type filter pills (inside handoff section)
  noteFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  noteFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteFilterChipText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
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
  // Clipboard fallback modal
  clipFallbackCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  clipFallbackLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  clipFallbackInput: {
    width: '100%',
    minHeight: 180,
    maxHeight: 300,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlignVertical: 'top',
  },
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
  // Recorder button (inside note sheet header)
  recorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  recorderBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
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
    overflow: 'hidden', // clips the countdown bar to the rounded corners
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
  // Discharge pending hint
  dischargePendingHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingHorizontal: 4,
  },
  dischargePendingHintText: {
    fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16, flex: 1,
  },
  // Diff legend
  diffLegend: { flexDirection: 'row', gap: 10, marginTop: 6 },
  diffLegendItem: { flexDirection: 'row', alignItems: 'center' },
  diffLegendRemoved: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#C53030', textDecorationLine: 'line-through' },
  diffLegendAdded: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#276749', textDecorationLine: 'underline' },
});
