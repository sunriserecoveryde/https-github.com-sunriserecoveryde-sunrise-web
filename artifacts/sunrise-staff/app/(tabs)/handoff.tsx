import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  AppState,
  Clipboard,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadHandoffState, saveJsonToStorage, pruneStaleStorageKeys, makeHandoffNotesKey, makeHandoffShiftKey, makeHandoffDraftNotesKey, makeHandoffCompletedKey, makeHandoffCompletedDraftKey, formatDateKey, isPersistSafe, type Shift as ShiftType } from '@/lib/coldStartLoadHelpers';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { useNursingNotes, type NoteType } from '@/context/NursingNotesContext';
import { useMdAcknowledgment } from '@/context/MdAcknowledgmentContext';
import { useWithdrawalFilters } from '@/context/WithdrawalFiltersContext';
import { RESIDENTIAL_PATIENTS, Patient, acuityColor, acuitySortOrder } from '@/data/mockData';

// Shift type is re-exported from @/lib/coldStartLoadHelpers; alias here for local use
type Shift = ShiftType;

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

// ─────────────────────────────────────────────────────────────────────────────
// Persisted keys and their cold-start flash guards
// ─────────────────────────────────────────────────────────────────────────────
// Guard styles mirror the pattern in WithdrawalFiltersContext.tsx / vitals.tsx:
//
//   A) useRehydratedValue(isRehydrating, value, loadingValue)
//   B) Opacity animation — start at 0, fade to 1 once loaded.
//   C) Raw !loaded guard in JSX.
//
// ┌──────────────────────────────────────────────────┬─────────────────────┬───────┐
// │ AsyncStorage key                                 │ Local state         │ Guard │
// ├──────────────────────────────────────────────────┼─────────────────────┼───────┤
// │ @sunrise_handoff_notes_YYYY-MM-DD (date-scoped)  │ notes               │ B     │
// │ @sunrise_handoff_shift_YYYY-MM-DD (date-scoped)  │ shift               │ B     │
// └──────────────────────────────────────────────────┴─────────────────────┴───────┘
//
// Date-scoping matches the MAR/Checks pattern: each calendar day gets its own
// storage bucket so a new shift always starts with a blank note slate.
// Stale keys from previous days are pruned on mount via pruneStaleStorageKeys.
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
  const [noteTypeFilter, setNoteTypeFilter] = useState<'all' | NoteType>('all');
  const { clearAcknowledgments } = useMdAcknowledgment();
  const { clearFilters } = useWithdrawalFilters();
  const [shift, setShift] = useState<Shift>('day');
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(RESIDENTIAL_PATIENTS.map(p => [p.id, p.handoffNote ?? '']))
  );
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Tracks the current calendar date so storage keys and the header subtitle
  // stay accurate when the app is left open overnight.
  //
  // Three complementary mechanisms keep `today` current — each covers a
  // scenario the others miss:
  //
  //   1. setTimeout to next midnight — fires for a screen left on and awake.
  //      Re-arms itself after each rollover so successive nights are covered.
  //
  //   2. AppState 'active' listener — fires when the app foregrounds after the
  //      phone was locked at midnight (Task #310).  The OS pauses JS timers
  //      while the screen is locked, so the setTimeout alone misses this case.
  //      iOS:     active→inactive→background … unlock … background→inactive→active ✓
  //      Android: active→background            … unlock … background→active         ✓
  //
  //   3. 60-second polling interval — catches always-on-display devices where
  //      AppState never transitions and setTimeout has drifted.
  //
  // All three paths call the same `checkRollover` helper which compares the
  // stored dateStr against `new Date()` and calls setToday only when the day
  // has actually advanced, making repeated calls idempotent.
  const [today, setToday] = useState(() => new Date());
  // #175: show a preview modal so nurses can copy the text before sharing —
  // prevents accidental data loss if the native share sheet is dismissed early.
  const [exportText, setExportText] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const todayKeyRef = useRef(formatDateKey(new Date())); // tracks last-seen date string

  function checkRollover() {
    const nowKey = formatDateKey(new Date());
    if (nowKey !== todayKeyRef.current) {
      todayKeyRef.current = nowKey;
      setToday(new Date());
    }
  }

  // Mechanism 1: setTimeout to next midnight.
  const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    function armMidnightTimer() {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();
      midnightTimerRef.current = setTimeout(() => {
        checkRollover();
        armMidnightTimer();
      }, msUntilMidnight);
    }
    armMidnightTimer();
    return () => {
      if (midnightTimerRef.current != null) clearTimeout(midnightTimerRef.current);
    };
  }, []);

  // Mechanism 2: AppState 'active' listener (Task #310 — phone locked at midnight).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRollover();
    });
    return () => sub.remove();
  }, []);

  // Mechanism 3: 60-second polling interval.
  useEffect(() => {
    const id = setInterval(checkRollover, 60_000);
    return () => clearInterval(id);
  }, []);

  // Storage keys are derived from `today` so they update automatically after
  // midnight without requiring an app restart.  The load effect depends on both
  // keys, so it re-runs whenever the day rolls over.
  const storageKeyNotes      = makeHandoffNotesKey(today);
  const storageKeyShift      = makeHandoffShiftKey(today);
  const storageKeyCompleted  = makeHandoffCompletedKey(today);
  // Crash-safe draft key: notes typed while isPersistSafe is false are written
  // here immediately so they survive a force-quit before the load resolves.
  // The .then() callback reads, merges, and clears this key on startup.
  const storageKeyDraftNotes = makeHandoffDraftNotesKey(today);
  // Crash-safe draft-completed key: undo tapped while isPersistSafe is false
  // is written here immediately.  The .then() callback reads this key after the
  // main completed key and applies it (draft wins), then clears the key.
  const storageKeyCompletedDraft = makeHandoffCompletedDraftKey(today);

  // Ref keeps the latest shift key available in write-through callbacks without
  // stale-closure issues (storageKeyShift changes on midnight rollover).
  const storageKeyShiftRef = useRef(storageKeyShift);
  useEffect(() => { storageKeyShiftRef.current = storageKeyShift; }, [storageKeyShift]);

  // Track the previous day's notes and draft-notes keys so the load effect can
  // flush any in-flight pending buffer to the correct (old) storage bucket when
  // the day rolls over.  Initialised to the current keys so the on-mount run of
  // the effect (which always has an empty pendingNotesRef) is a no-op.
  const prevStorageKeyNotesRef      = useRef(storageKeyNotes);
  const prevStorageKeyDraftNotesRef = useRef(storageKeyDraftNotes);

  // Tracks which notes key the current in-memory state was loaded from.
  // Used by persist effects via isPersistSafe() to prevent writing yesterday's
  // data into today's bucket during the rollover transition window (mirrors the
  // MARContext loadedForKey pattern).
  const loadedForKeyRef = useRef<string | null>(null);

  // Tracks the draft-notes key of the MOST RECENTLY STARTED load cycle.
  // Updated at the very top of the load effect so that any previously-started
  // effect's Promise.all .then() callback can detect it is now stale before
  // running the deferred draft-notes prune.  Without this guard, an old-day
  // .then() resolving late after midnight would prune with currentKey = OLD key,
  // classifying the new day's draft key as stale and silently deleting it.
  const activeDraftNotesKeyRef = useRef(storageKeyDraftNotes);

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

  // mountedRef prevents stale promise callbacks from calling setState on an
  // unmounted component after a force-quit + relaunch (Task #313 / #315).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load persisted notes + shift whenever the calendar-day storage keys change
  // (on mount and after each midnight rollover).  Both keys resolve together
  // before `loaded` is set, so neither the shift selector nor the handoff notes
  // can flash with stale defaults.  Stale entries from previous calendar days
  // are pruned after each rollover (mirrors MARContext).
  //
  // Task #315: the .catch() ensures `loaded` always becomes true even if the
  // .then() callback itself throws unexpectedly, preventing a permanent freeze.
  // loadHandoffState internally catches storage errors and always resolves, so
  // the outer .catch() is a belt-and-suspenders guard for the state setters.
  //
  // Task #324: a 4-second timeout guard forces `loaded=true` with safe defaults
  // if AsyncStorage hangs indefinitely (corrupt storage, device full, OS block).
  // Whichever path settles first — the promise or the timeout — wins; the other
  // is cancelled immediately so only one state update fires.
  React.useEffect(() => {
    // Reset the guard so persist effects cannot fire with yesterday's state
    // while the fresh load for the new key is in flight.
    setLoaded(false);

    // Advance the active-draft-key sentinel immediately so any previously
    // started Promise.all .then() callback can detect it is now stale and
    // skip the deferred draft-notes prune.  Must happen before the async work
    // below so the ref is always up-to-date by the time an old callback resolves.
    activeDraftNotesKeyRef.current = storageKeyDraftNotes;

    // ── Midnight-rollover flush ──────────────────────────────────────────────
    // If the nurse was actively typing in the final seconds before midnight,
    // those edits are in pendingNotesRef and are about to be cleared.  Before
    // discarding the buffer, flush it to the OLD day's storage so the text is
    // not silently lost.
    //
    // Two paths mirror the write-handler logic (lines 805–819):
    //
    //   • isPersistSafe was true (old day's load had resolved): write the full
    //     merged snapshot directly to the old notes key.  notesRef.current
    //     already holds all patient notes for the old day; the pending delta is
    //     layered on top so no untouched patient is overwritten.
    //
    //   • isPersistSafe was false (old day's load was still in-flight): write
    //     the touched-only payload to the old draft-notes key.  The draft key
    //     is the same crash-safe path the write handler uses during the load
    //     window, so when the old Promise.all eventually resolves it will merge
    //     the draft into savedNotes — preserving the note in storage.
    //
    // On the initial mount run pendingNotesRef is always empty, so the guard
    // below is a no-op.  The prevStorage*Refs are initialised to the current
    // (first-day) keys, so they always point to the correct old-day bucket.
    const flushPending = pendingNotesRef.current;
    if (Object.keys(flushPending).length > 0) {
      const oldNotesKey = prevStorageKeyNotesRef.current;
      const oldDraftKey = prevStorageKeyDraftNotesRef.current;
      if (isPersistSafe(loaded, loadedForKeyRef.current, oldNotesKey)) {
        // Old day's load had resolved: merge pending delta into the full snapshot.
        saveJsonToStorage(AsyncStorage, oldNotesKey, { ...notesRef.current, ...flushPending });
      } else {
        // Old day's load was still in-flight: write touched-only payload to the
        // crash-safe draft key so the old Promise.all .then() can merge it.
        saveJsonToStorage(AsyncStorage, oldDraftKey, flushPending);
      }
    }

    loadedForKeyRef.current = null;

    // Advance prev-key refs so the next midnight rollover targets the correct
    // old-day bucket (must happen AFTER the flush above reads them).
    prevStorageKeyNotesRef.current      = storageKeyNotes;
    prevStorageKeyDraftNotesRef.current = storageKeyDraftNotes;

    // Clear any pending buffers accumulated during the old day's load window.
    // Without this reset, a shift tap or note edit buffered during yesterday's
    // load window would survive the midnight rollover and be merged on top of
    // today's stored values when the new-day Promise.all resolves — silently
    // applying yesterday's in-flight intent to the wrong calendar day.
    // The buffers are re-populated by any nurse interaction that occurs while
    // this new-day load is itself in-flight, so no input is lost.
    pendingShiftRef.current = null;
    pendingNotesRef.current = {};

    const defaultNotes = Object.fromEntries(RESIDENTIAL_PATIENTS.map(p => [p.id, p.handoffNote ?? '']));

    // Flag shared between the promise path and the timeout path so only the
    // first one to settle actually calls setState (prevents a double-update if
    // storage resolves just as the timer fires).
    let settled = false;

    // 4-second hang guard: if AsyncStorage doesn't respond in time, unblock the
    // screen with the static default notes and 'day' shift.  loadedForKeyRef is
    // intentionally left null so the persist-write effects stay blocked — the
    // timed-out defaults should never be written back to storage.
    // Any note or shift selection made during the hang window is merged so the
    // nurse's input is preserved even if storage never resolved.
    //
    // completed is set to false (not read from storageKeyCompletedDraft) because
    // AsyncStorage is not responding — a second read would also hang.  false is
    // the safe direction: it can never produce a ghost "Handoff Complete" banner.
    // It also agrees with any undo intent the nurse may have written to the draft
    // key during the load window (that write is 'false' too), so no undo intent
    // is ever silently overridden by this path.
    const timeoutId = setTimeout(() => {
      if (!mountedRef.current || settled) return;
      settled = true;
      const pending = pendingNotesRef.current;
      pendingNotesRef.current = {};
      const mergedNotes = Object.keys(pending).length > 0
        ? { ...defaultNotes, ...pending }
        : defaultNotes;
      const pendingShift = pendingShiftRef.current;
      pendingShiftRef.current = null;
      // Read the pending-completed buffer: if the nurse tapped Complete (or Undo)
      // during the load window, honour that tap.  Otherwise default to false — the
      // safe direction: no ghost banner, and compatible with any undo intent
      // written to storageKeyCompletedDraft during the load window (Task #340 / #338).
      const pendingCompleted = pendingCompletedRef.current;
      pendingCompletedRef.current = null;
      setNotes(mergedNotes);
      setShift(pendingShift ?? 'day');
      setCompleted(pendingCompleted ?? false);
      // loadedForKeyRef.current stays null — persist effects remain blocked.
      setLoaded(true);
    }, 4000);

    // NOTE: '@sunrise_handoff_draft_notes_' is intentionally NOT included here.
    // If the midnight flush wrote a note to the OLD day's draft-notes key (the
    // isPersistSafe=false path above), including the draft-notes prefix with
    // currentKey=storageKeyDraftNotes (the NEW day's key) would immediately
    // prune the old key before the Promise.all .then() callback below can read
    // and consume it — silently discarding a note typed in the final second of
    // the previous calendar day.  The draft-notes prefix is pruned later, inside
    // the .then() callback, after the old draft has been consumed.
    pruneStaleStorageKeys(AsyncStorage, [
      { prefix: '@sunrise_handoff_notes_',             currentKey: storageKeyNotes },
      { prefix: '@sunrise_handoff_shift_',             currentKey: storageKeyShift },
      { prefix: '@sunrise_handoff_undo_draft_',         currentKey: storageKeyCompletedDraft },
      { prefix: '@sunrise_handoff_completed_',         currentKey: storageKeyCompleted },
    ]).catch(() => {});
    Promise.all([
      loadHandoffState(
        AsyncStorage,
        { notes: storageKeyNotes, shift: storageKeyShift },
        { notes: defaultNotes, shift: 'day' },
      ),
      AsyncStorage.getItem(storageKeyCompleted),
    ]).then(async ([{ notes: savedNotes, shift: savedShift }, completedRaw]) => {
      clearTimeout(timeoutId);
      if (!mountedRef.current || settled) return;
      settled = true;

      // Read the crash-safe draft-notes key — contains notes written during the
      // load window of a previous session that was force-quit before the load resolved.
      // It may also contain notes written by the midnight-rollover flush (the
      // isPersistSafe=false path in the effect above) if the nurse was typing in
      // the final seconds of the previous calendar day.  The draft-notes prefix
      // was deliberately excluded from the immediate pruneStaleStorageKeys call
      // so that old-day draft keys survive until they are consumed here.
      let draftNotes: Record<string, string> = {};
      try {
        const draftRaw = await AsyncStorage.getItem(storageKeyDraftNotes);
        if (draftRaw) {
          draftNotes = JSON.parse(draftRaw) as Record<string, string>;
          // Clear the draft key now that it has been consumed.
          AsyncStorage.removeItem(storageKeyDraftNotes).catch(() => {});
        }
      } catch {}
      // Prune stale draft-notes keys now that the current day's draft has been
      // consumed (or confirmed absent).  Doing this here — not before the
      // Promise.all — prevents a midnight-rollover race where the old day's draft
      // key would be classified as stale and deleted before this callback reads it.
      //
      // Staleness guard: only the most recently started load cycle may run this
      // prune.  If a midnight rollover has occurred since this effect started,
      // activeDraftNotesKeyRef.current will have been advanced to the new day's
      // draft key.  Running the prune with the old day's key as currentKey would
      // classify the new day's draft key as stale and delete it — inverting the
      // race we just fixed.  Skip the prune entirely for stale callbacks; the
      // current load cycle's .then() will prune when it resolves.
      if (storageKeyDraftNotes === activeDraftNotesKeyRef.current) {
        pruneStaleStorageKeys(AsyncStorage, [
          { prefix: '@sunrise_handoff_draft_notes_', currentKey: storageKeyDraftNotes },
        ]).catch(() => {});
      }

      // Read the crash-safe draft-completed key — written by the Undo handler
      // when isPersistSafe was false (storage still loading at the time of tap).
      // Draft wins over the main completed key so the undo intent survives a
      // force-quit that occurs during the storage-load window.
      let resolvedCompleted = completedRaw === 'true';
      try {
        const completedDraftRaw = await AsyncStorage.getItem(storageKeyCompletedDraft);
        if (completedDraftRaw !== null) {
          resolvedCompleted = completedDraftRaw === 'true';
          // Consume: promote draft → main key first, then delete the draft.
          // Sequenced (await) so that if a force-quit hits between the two ops
          // the intent is already in the main key and won't be lost.
          try { await AsyncStorage.setItem(storageKeyCompleted, completedDraftRaw); } catch {}
          AsyncStorage.removeItem(storageKeyCompletedDraft).catch(() => {});
        }
      } catch {}

      // Re-check after the async draft reads — component may have unmounted.
      if (!mountedRef.current) return;

      // Merge: crash-safe draft (prior session) wins over storage, same-session
      // pending (pendingNotesRef) wins over the draft (most recently typed).
      const pending = pendingNotesRef.current;
      pendingNotesRef.current = {};
      const hasDraft   = Object.keys(draftNotes).length > 0;
      const hasPending = Object.keys(pending).length > 0;
      const mergedNotes =
        hasDraft || hasPending
          ? { ...savedNotes, ...draftNotes, ...pending }
          : savedNotes;

      // Merge pending shift: if the nurse tapped a shift while the load was
      // in-flight, honour that tap instead of overwriting it with savedShift.
      const pendingShift = pendingShiftRef.current;
      pendingShiftRef.current = null;
      const resolvedShift = pendingShift ?? savedShift;

      // Merge pending completed: if the nurse tapped Complete (or Undo) while
      // the load was in-flight, honour that tap over the resolved storage value.
      // This prevents a setCompleted(resolvedCompleted) call here from silently
      // discarding a Complete tap that occurred during the load window (Task #340).
      const pendingCompleted = pendingCompletedRef.current;
      pendingCompletedRef.current = null;
      const finalCompleted = pendingCompleted !== null ? pendingCompleted : resolvedCompleted;

      setNotes(mergedNotes);
      setShift(resolvedShift);
      setCompleted(finalCompleted);
      loadedForKeyRef.current = storageKeyNotes;
      setLoaded(true);
    }).catch(() => {
      // Fallback: even if the .then() callback throws, clear the guard so the
      // screen doesn't stay permanently invisible (Task #313 / #315).
      clearTimeout(timeoutId);
      if (mountedRef.current && !settled) {
        settled = true;
        setLoaded(true);
      }
    });

    return () => { clearTimeout(timeoutId); };
  }, [storageKeyNotes, storageKeyShift]);

  // Write-through ref: kept in sync with `notes` state so the write-through
  // handler can compute the next value without a stale closure (Task #311).
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Pending-notes buffer: collects edits typed while `loaded === false` (i.e.
  // during the startup load window).  When the AsyncStorage read resolves, these
  // pending edits are merged on top of the freshly-loaded notes so a force-quit
  // during the load window cannot silently discard a nurse's in-progress text.
  // The ref is cleared immediately after each merge to avoid stale accumulation.
  const pendingNotesRef = useRef<Record<string, string>>({});

  // Pending-completed buffer: mirrors pendingShiftRef for the Mark Complete /
  // Undo button.  If the nurse taps "Mark Handoff Complete" (or Undo) while the
  // AsyncStorage load is still in flight, isPersistSafe blocks the write-through
  // and setCompleted(resolvedCompleted) in the .then() callback would otherwise
  // silently overwrite the tap.  Storing the intent here lets both the .then()
  // callback and the 4-second timeout honour the tap instead of discarding it
  // (Task #340).  null means no tap occurred during the load window.
  const pendingCompletedRef = useRef<boolean | null>(null);

  // Pending-shift buffer: mirrors pendingNotesRef for the shift selector.
  // If the nurse taps a shift (Day/Eve/Night) before the AsyncStorage load
  // resolves, isPersistSafe blocks the write and setShift(savedShift) in the
  // .then() callback would otherwise silently overwrite the tap.  Storing the
  // selection here lets the .then() callback honour it by preferring the
  // pending value over the stored one (Task #330).
  const pendingShiftRef = useRef<Shift | null>(null);

  // Persist notes when they change (after initial load).
  // isPersistSafe guards against writing yesterday's in-memory state into today's
  // bucket during the rollover window before the fresh load completes.
  React.useEffect(() => {
    if (!isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) return;
    saveJsonToStorage(AsyncStorage, storageKeyNotes, notes);
  }, [notes, loaded, storageKeyNotes]);

  // Persist shift selection (effect-level backup; write-through in handleShiftChange covers
  // the force-quit window between state update and this effect firing).
  React.useEffect(() => {
    if (!isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) return;
    AsyncStorage.setItem(storageKeyShift, shift).catch(() => {});
  }, [shift, loaded, storageKeyShift, storageKeyNotes]);

  // Persist completed flag so both handleComplete (true) and the Undo button
  // (false) survive a force-quit + relaunch (#331).
  // Write-through in handleComplete() covers the narrow render/effect gap for
  // the true→false direction; this effect covers the false direction (Undo).
  React.useEffect(() => {
    if (!isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) return;
    AsyncStorage.setItem(storageKeyCompleted, completed ? 'true' : 'false').catch(() => {});
  }, [completed, loaded, storageKeyCompleted, storageKeyNotes]);

  /** Write-through shift setter — persists immediately so a force-quit in the
   *  React render/effect gap can't silently revert the selection (#330).
   *  When the load is still in-flight (isPersistSafe returns false), the
   *  selection is buffered in pendingShiftRef so the .then() callback can
   *  honour it instead of overwriting it with the stored value. */
  function handleShiftChange(s: Shift) {
    setShift(s);
    if (isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) {
      AsyncStorage.setItem(storageKeyShiftRef.current, s).catch(() => {});
    } else {
      // Load is still in-flight — buffer the tap so the .then() callback can
      // merge it on top of the stored shift rather than silently overwriting it.
      pendingShiftRef.current = s;
    }
  }

  // ── Note-type filter (#51) ─────────────────────────────────────────────────
  const NOTE_TYPE_CHIPS: { key: 'all' | NoteType; label: string }[] = [
    { key: 'all',           label: 'All' },
    { key: 'observation',   label: 'Observation' },
    { key: 'med-update',    label: 'Med Update' },
    { key: 'incident',      label: 'Incident' },
    { key: 'group-session', label: 'Group Session' },
  ];

  const sortedPatients = [...RESIDENTIAL_PATIENTS].sort(
    (a, b) => acuitySortOrder(a.acuity) - acuitySortOrder(b.acuity)
  );

  // Patients shown in the FlatList — filtered by noteTypeFilter (#51).
  const filteredPatients = noteTypeFilter === 'all'
    ? sortedPatients
    : sortedPatients.filter(p =>
        getNotesForPatient(p.id).some(n => n.noteType === noteTypeFilter)
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
    const date = today.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const shiftLabel = SHIFTS.find(s => s.id === shift)!;
    const lines: string[] = [];

    // ── Census summary header (#151) ─────────────────────────────────────────
    const acuityCounts = { Critical: 0, High: 0, Moderate: 0, Stable: 0 };
    sortedPatients.forEach(p => {
      if (p.acuity in acuityCounts) acuityCounts[p.acuity as keyof typeof acuityCounts]++;
    });
    lines.push(`SHIFT HANDOFF — ${shiftLabel.label} Shift (${shiftLabel.time})`);
    lines.push(date);
    lines.push(`Census: ${sortedPatients.length} patients  ·  Critical: ${acuityCounts.Critical}  ·  High: ${acuityCounts.High}  ·  Moderate: ${acuityCounts.Moderate}  ·  Stable: ${acuityCounts.Stable}`);
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
            note.noteType === 'observation'   ? 'Observation'
            : note.noteType === 'med-update'  ? 'Med Update'
            : note.noteType === 'group-session'
              ? (note.groupSessionType ? `Group · ${note.groupSessionType}` : 'Group Session')
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
    // #175: show preview modal first so nurses can copy before sharing
    setExportText(message);
    setExportCopied(false);
    setExportModalVisible(true);
  }

  function handleExportCopy() {
    Clipboard.setString(exportText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExportCopied(true);
  }

  function handleExportShare() {
    Share.share({ message: exportText });
  }

  function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearNotes();
    clearAcknowledgments();
    clearFilters();
    setCompleted(true);
    if (isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) {
      // Write-through: persist completed flag immediately so a force-quit while
      // the Share sheet is open can't reset the screen to the pre-complete state
      // on relaunch (#331).
      AsyncStorage.setItem(storageKeyCompleted, 'true').catch(() => {});
    } else {
      // Load is still in-flight — the write-through is blocked by isPersistSafe
      // and the .then() callback would otherwise overwrite this tap with the
      // stored completed value.  Buffer the intent so the .then() callback and
      // the 4-second timeout both honour it (Task #340).
      pendingCompletedRef.current = true;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Shift Handoff</Text>
            <Text style={styles.headerSubtitle}>{today.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · {RESIDENTIAL_PATIENTS.length} patients</Text>
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
          <ShiftSelector current={shift} onChange={handleShiftChange} />
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
                onPress={() => {
                  setCompleted(false);
                  // Write-through: persist the undo immediately so a force-quit
                  // in the render/effect gap can't re-show the banner on relaunch (#331).
                  if (isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) {
                    AsyncStorage.setItem(storageKeyCompleted, 'false').catch(() => {});
                  } else {
                    // Storage is still loading — the normal write-through is
                    // blocked by isPersistSafe.  Write the undo intent to the
                    // crash-safe draft-completed key so it survives a force-quit
                    // during the load window.  The cold-start .then() callback
                    // reads this key, applies it (draft wins over main), then
                    // deletes it (#335).
                    AsyncStorage.setItem(storageKeyCompletedDraft, 'false').catch(() => {});
                    // Also buffer in pendingCompletedRef so the .then() callback
                    // and the 4-second timeout honour this tap without needing to
                    // re-read the draft key (Task #340).
                    pendingCompletedRef.current = false;
                  }
                }}
              >
                <Text style={[styles.undoText, { color: colors.success }]}>Undo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Filter chips bar (#51) */}
            <View style={[styles.noteFilterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              {NOTE_TYPE_CHIPS.map(chip => {
                const active = noteTypeFilter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => { Haptics.selectionAsync(); setNoteTypeFilter(chip.key); }}
                    style={[
                      styles.noteFilterChip,
                      { borderColor: active ? colors.orange : colors.border },
                      active && { backgroundColor: colors.orange },
                    ]}
                  >
                    <Text style={[styles.noteFilterChipText, { color: active ? '#fff' : colors.mutedForeground }]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* Filtered-count notice */}
            {noteTypeFilter !== 'all' && (
              <View style={[styles.filterCountRow, { backgroundColor: colors.muted }]}>
                <Text style={[styles.filterCountText, { color: colors.mutedForeground }]}>
                  {filteredPatients.length} of {sortedPatients.length} patient{sortedPatients.length !== 1 ? 's' : ''} · {NOTE_TYPE_CHIPS.find(c => c.key === noteTypeFilter)?.label} notes
                </Text>
              </View>
            )}
            <FlatList
              data={filteredPatients}
              keyExtractor={p => p.id}
              renderItem={({ item }) => (
                <HandoffCard
                  patient={item}
                  note={notes[item.id] ?? ''}
                  onNoteChange={n => {
                    // Task #312: write-through — persist immediately so a force-quit
                    // between the state update and the async persist effect can't
                    // drop the nurse's in-progress note.
                    const next = { ...notesRef.current, [item.id]: n };
                    notesRef.current = next;
                    setNotes(next);
                    if (isPersistSafe(loaded, loadedForKeyRef.current, storageKeyNotes)) {
                      saveJsonToStorage(AsyncStorage, storageKeyNotes, next);
                    } else {
                      // Accumulate only the touched keys (not the full snapshot) so
                      // that the draft payload never contains default-empty values
                      // for untouched patients — which would overwrite their valid
                      // persisted notes on restart (Task #326).
                      const updatedPending = { ...pendingNotesRef.current, [item.id]: n };
                      pendingNotesRef.current = updatedPending;
                      // Write the accumulated touched-only payload to the crash-safe
                      // draft key immediately so it survives a force-quit before the
                      // load resolves. The .then() callback reads, merges, and clears
                      // this key on restart.
                      saveJsonToStorage(AsyncStorage, storageKeyDraftNotes, updatedPending);
                    }
                  }}
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
          </>
        )}
      </Animated.View>

      {/* #175: Export preview modal — nurses can copy before sharing; cannot be
          dismissed by tapping outside so text is never lost before copying. */}
      <Modal
        visible={exportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (exportCopied) setExportModalVisible(false);
        }}
      >
        <View style={styles.exportOverlay}>
          <View style={[styles.exportModal, { backgroundColor: colors.card }]}>
            <View style={styles.exportModalHeader}>
              <Text style={[styles.exportModalTitle, { color: colors.navy }]}>Handoff Preview</Text>
              {exportCopied ? (
                <Pressable onPress={() => setExportModalVisible(false)} style={styles.exportModalClose}>
                  <Ionicons name="close" size={22} color={colors.slate} />
                </Pressable>
              ) : (
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Copy text before closing</Text>
              )}
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              <Text style={[styles.exportPreviewText, { color: colors.navy }]}>{exportText}</Text>
            </ScrollView>
            <View style={styles.exportModalActions}>
              <Pressable
                style={[styles.exportCopyBtn, { backgroundColor: exportCopied ? colors.successBg : colors.navy }]}
                onPress={handleExportCopy}
              >
                <Text style={[styles.exportBtnLabel, { color: '#fff' }]}>
                  {exportCopied ? '✓ Copied!' : 'Copy All'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.exportShareBtn, { borderColor: colors.border }]}
                onPress={handleExportShare}
              >
                <Text style={[styles.exportBtnLabel, { color: colors.navy }]}>Share…</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  /* #175 export preview modal */
  exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  exportModal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  exportModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exportModalTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  exportModalClose: { padding: 4 },
  exportPreviewText: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', flex: 1 },
  exportModalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  exportCopyBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  exportShareBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  exportBtnLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
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
  noteFilterBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  noteFilterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  noteFilterChipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  filterCountRow: { paddingHorizontal: 14, paddingVertical: 6 },
  filterCountText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  completedBanner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  completedCard: { alignItems: 'center', gap: 12, padding: 32, borderRadius: 20, borderWidth: 2, width: '100%' },
  completedTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  completedSub: { fontSize: 15, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  undoBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 8, marginTop: 8 },
  undoText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
