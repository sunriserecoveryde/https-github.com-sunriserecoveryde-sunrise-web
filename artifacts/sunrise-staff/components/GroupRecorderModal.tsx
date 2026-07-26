/**
 * GroupRecorderModal.tsx
 *
 * Lets a counselor record one group-therapy session and attach the
 * transcript to multiple patients in a single flow.
 *
 * Flow
 * ────
 * Phase 1 – Record
 *   Identical recorder UI to SessionRecorderModal (waveform, timer, tabs).
 *   When the counselor taps "Stop & Review" the modal advances to Phase 2.
 *
 * Phase 2 – Attach
 *   A checklist of today's census patients is shown.  Each row can be
 *   expanded to reveal a per-patient copy of the transcript that the
 *   counselor can trim before attaching.  "Attach to Selected" calls
 *   addNote() for every checked patient and closes the modal.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionRecorder } from '@/hooks/useSessionRecorder';
import { useNursingNotes } from '@/context/NursingNotesContext';
import type { Patient } from '@/data/mockData';

// ── Draft persistence key ─────────────────────────────────────────────
const DRAFT_KEY = 'group_recorder_draft_v1';

// ── Colour tokens ────────────────────────────────────────────────────
const TEAL       = '#0d9488';
const TEAL_DARK  = '#0f766e';
const RED        = '#ef4444';
const AMBER      = '#f59e0b';
const AMBER_BG   = '#fffbeb';
const AMBER_BORDER = '#fcd34d';
const NAVY       = '#1C2B3A';
const SLATE      = '#64748b';
const SLATE_LIGHT = '#f1f5f9';
const WHITE      = '#ffffff';
const BORDER     = '#e2e8f0';
const GREEN      = '#16a34a';
const GREEN_BG   = '#f0fdf4';
const GREEN_BORDER = '#86efac';

// ── Animated waveform ────────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  const anims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.2)),
  ).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      loopRef.current = Animated.loop(
        Animated.stagger(
          100,
          anims.map(a =>
            Animated.sequence([
              Animated.timing(a, { toValue: 1,   duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
              Animated.timing(a, { toValue: 0.2, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            ]),
          ),
        ),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      anims.forEach(a => a.setValue(0.2));
    }
    return () => { loopRef.current?.stop(); };
  }, [active, anims]);

  return (
    <View style={styles.waveContainer}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: a.interpolate({ inputRange: [0, 1], outputRange: [8, 40] }),
              backgroundColor: active ? TEAL : BORDER,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Timer ─────────────────────────────────────────────────────────────

function Timer({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return <Text style={styles.timer}>{mm}:{ss}</Text>;
}

// ── Per-patient row in the attach phase ──────────────────────────────

interface PatientRowProps {
  patient: Patient;
  selected: boolean;
  transcript: string;
  existingNoteCount: number;
  onToggle: () => void;
  onTranscriptChange: (t: string) => void;
}

function PatientRow({ patient, selected, transcript, existingNoteCount, onToggle, onTranscriptChange }: PatientRowProps) {
  const [expanded, setExpanded] = useState(false);
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const hasExistingNote = existingNoteCount > 0;
  const badgeLabel = existingNoteCount >= 2 ? `${existingNoteCount} notes today` : 'Note today';
  const warningLabel =
    existingNoteCount >= 2
      ? `This patient already has ${existingNoteCount} group notes this shift. Attaching again will add another entry.`
      : 'This patient already received a group note this shift. Attaching again will add a second entry.';

  return (
    <View style={[
      styles.patientRow,
      selected && styles.patientRowSelected,
      selected && hasExistingNote && styles.patientRowDuplicate,
    ]}>
      {/* Checkbox + name */}
      <Pressable
        style={styles.patientRowHeader}
        onPress={() => { Haptics.selectionAsync(); onToggle(); }}
        hitSlop={4}
      >
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={13} color={WHITE} />}
        </View>
        <View style={styles.patientRowInfo}>
          <View style={styles.patientNameRow}>
            <Text style={[styles.patientRowName, !selected && { color: SLATE }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            {hasExistingNote && (
              <View style={styles.duplicateBadge}>
                <Ionicons name="warning-outline" size={11} color={AMBER} />
                <Text style={styles.duplicateBadgeText}>{badgeLabel}</Text>
              </View>
            )}
          </View>
          <Text style={styles.patientRowMeta}>
            Bed {patient.bed} · {patient.program}
          </Text>
        </View>
        {selected && (
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setExpanded(e => !e); }}
            hitSlop={8}
            style={styles.expandBtn}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={TEAL}
            />
            <Text style={styles.expandBtnText}>Edit</Text>
          </Pressable>
        )}
      </Pressable>

      {/* Duplicate warning — shown when this patient is selected and already has a note */}
      {selected && hasExistingNote && (
        <View style={styles.duplicateWarningRow}>
          <Ionicons name="information-circle-outline" size={14} color={AMBER} />
          <Text style={styles.duplicateWarningText}>{warningLabel}</Text>
        </View>
      )}

      {/* Per-patient transcript editor */}
      {selected && expanded && (
        <View style={styles.transcriptEditor}>
          <Text style={styles.editorLabel}>TRANSCRIPT FOR THIS PATIENT</Text>
          <TextInput
            style={styles.editorInput}
            value={transcript}
            onChangeText={onTranscriptChange}
            multiline
            textAlignVertical="top"
            placeholder="Paste or type the session transcript for this patient..."
            placeholderTextColor={SLATE}
          />
          <Text style={styles.wordCount}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'} · edit freely
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Group session types ───────────────────────────────────────────────

interface GroupSessionTypeOption {
  value: string;
  label: string;
  icon: string; // Ionicons name
}

const GROUP_SESSION_TYPES: GroupSessionTypeOption[] = [
  { value: 'Psychoeducation',    label: 'Psychoeducation',   icon: 'book-outline' },
  { value: 'Process Group',      label: 'Process Group',     icon: 'chatbubbles-outline' },
  { value: 'DBT Skills',         label: 'DBT Skills',        icon: 'layers-outline' },
  { value: 'Relapse Prevention', label: 'Relapse Prevention',icon: 'shield-checkmark-outline' },
];

// ── Props ─────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  patients: Patient[];
}

type Phase = 'record' | 'attach';

// ── Main component ────────────────────────────────────────────────────

export function GroupRecorderModal({ visible, onClose, patients }: Props) {
  const {
    isRecordingSupported,
    isTranscriptionSupported,
    isRecording,
    isPaused,
    transcript,
    interimText,
    elapsedSeconds,
    start,
    pause,
    resume,
    stop,
    resetTranscript,
  } = useSessionRecorder();

  const { addNote, getNotesForPatient } = useNursingNotes();

  const [phase, setPhase]       = useState<Phase>('record');
  const [activeTab, setActiveTab] = useState<'record' | 'transcript'>('record');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [micDenied, setMicDenied]   = useState(false);
  const [sessionType, setSessionType] = useState<string>(GROUP_SESSION_TYPES[0].value);

  // Per-patient state for the attach phase
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Per-patient overrides: patientId → custom transcript text
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [attached, setAttached] = useState(false);

  // Draft-restore banner: null = hidden, 'pending' = showing offer, 'dismissed' = user declined
  const [draftBanner, setDraftBanner] = useState<'hidden' | 'pending' | 'dismissed'>('hidden');
  const [pendingDraftText, setPendingDraftText] = useState('');

  const transcriptScrollRef = useRef<ScrollView>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true once attach/discard clears the draft so no queued save can revive it
  const draftClearedRef = useRef(false);

  /** Cancel any pending debounced save. Call before every removeItem. */
  const cancelPendingSave = useCallback(() => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
  }, []);

  // ── Auto-save draft on every edit (debounced 800 ms) ─────────────
  useEffect(() => {
    cancelPendingSave();
    saveDebounceRef.current = setTimeout(() => {
      if (!draftClearedRef.current && editableTranscript.trim()) {
        AsyncStorage.setItem(DRAFT_KEY, editableTranscript).catch(() => {});
      }
    }, 800);
    return cancelPendingSave;
  }, [editableTranscript, cancelPendingSave]);

  // Sync editable transcript from live transcription (web only)
  useEffect(() => {
    if (isTranscriptionSupported) {
      setEditableTranscript(transcript);
    }
  }, [transcript, isTranscriptionSupported]);

  // Auto-scroll live transcript
  useEffect(() => {
    if (transcript || interimText) {
      transcriptScrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript, interimText]);

  // Reset state each time the modal opens; check for saved draft
  useEffect(() => {
    if (visible) {
      resetTranscript();
      setEditableTranscript('');
      setActiveTab('record');
      setMicDenied(false);
      setPhase('record');
      setSelectedIds(new Set());
      setOverrides({});
      setAttached(false);
      setSessionType(GROUP_SESSION_TYPES[0].value);
      setDraftBanner('hidden');
      setPendingDraftText('');
      draftClearedRef.current = false;

      // Check for a previously saved draft and offer to restore it
      AsyncStorage.getItem(DRAFT_KEY)
        .then(saved => {
          if (saved && saved.trim()) {
            setPendingDraftText(saved);
            setDraftBanner('pending');
          }
        })
        .catch(() => {});
    }
  }, [visible, resetTranscript]);

  const handleRestoreDraft = useCallback(() => {
    setEditableTranscript(pendingDraftText);
    setActiveTab('transcript');
    setDraftBanner('dismissed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [pendingDraftText]);

  const handleDiscardDraft = useCallback(() => {
    setDraftBanner('dismissed');
    cancelPendingSave();
    draftClearedRef.current = true;
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
  }, [cancelPendingSave]);

  // When entering attach phase, pre-populate per-patient overrides with the shared transcript
  useEffect(() => {
    if (phase === 'attach') {
      const init: Record<string, string> = {};
      patients.forEach(p => { init[p.id] = editableTranscript; });
      setOverrides(init);
    }
  }, [phase]);

  const handleStart = useCallback(async () => {
    try {
      await start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setMicDenied(true);
    }
  }, [start]);

  const handleStop = useCallback(async () => {
    await stop();
    setActiveTab('transcript');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [stop]);

  const handlePause   = useCallback(() => pause(),   [pause]);
  const handleResume  = useCallback(() => resume(),  [resume]);

  const handleProceedToAttach = useCallback(() => {
    if (!editableTranscript.trim()) return;
    setPhase('attach');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [editableTranscript]);

  const togglePatient = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const setPatientTranscript = useCallback((id: string, text: string) => {
    setOverrides(prev => ({ ...prev, [id]: text }));
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(patients.map(p => p.id)));
    Haptics.selectionAsync();
  }, [patients]);

  const handleClearAll = useCallback(() => {
    setSelectedIds(new Set());
    Haptics.selectionAsync();
  }, []);

  const handleAttach = useCallback(() => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => {
      const text = (overrides[id] ?? editableTranscript).trim();
      if (text) addNote(id, text, 'group-session', sessionType);
    });
    // Clear the saved draft — cancel any pending debounced write first to avoid a race
    cancelPendingSave();
    draftClearedRef.current = true;
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setAttached(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Close after a brief success moment
    setTimeout(() => { onClose(); }, 1200);
  }, [selectedIds, overrides, editableTranscript, addNote, onClose, sessionType, cancelPendingSave]);

  const handleClose = useCallback(async () => {
    if (isRecording) await stop();
    onClose();
  }, [isRecording, stop, onClose]);

  const wordCount = editableTranscript.trim().split(/\s+/).filter(Boolean).length;

  const allSelected = patients.length > 0 && selectedIds.size === patients.length;

  // Compute how many group-session notes each patient already has this shift (patientId → count).
  // Only 'group-session' notes are counted so that manual observation notes don't
  // trigger the duplicate warning and the badge remains accurate after a cold-start.
  const noteCountByPatient = useMemo<Map<string, number>>(() => {
    const result = new Map<string, number>();
    patients.forEach(p => {
      const count = getNotesForPatient(p.id).filter(n => n.noteType === 'group-session').length;
      if (count > 0) result.set(p.id, count);
    });
    return result;
  }, [patients, getNotesForPatient]);

  // Count selected patients who already have at least one note today
  const duplicateCount = useMemo(
    () => [...selectedIds].filter(id => noteCountByPatient.has(id)).length,
    [selectedIds, noteCountByPatient],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="people" size={18} color={WHITE} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Group Recording</Text>
            <Text style={styles.headerSub}>
              {phase === 'record'
                ? 'Record session · attach to multiple patients'
                : `${selectedIds.size} of ${patients.length} selected`}
            </Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        {/* ── Phase indicator ── */}
        <View style={styles.phaseBar}>
          <View style={[styles.phaseStep, phase === 'record' && styles.phaseStepActive]}>
            <Text style={[styles.phaseStepText, phase === 'record' && styles.phaseStepTextActive]}>
              1 · Record
            </Text>
          </View>
          <View style={styles.phaseArrow}>
            <Ionicons name="chevron-forward" size={12} color={SLATE} />
          </View>
          <View style={[styles.phaseStep, phase === 'attach' && styles.phaseStepActive]}>
            <Text style={[styles.phaseStepText, phase === 'attach' && styles.phaseStepTextActive]}>
              2 · Attach to Patients
            </Text>
          </View>
        </View>

        {/* ════════════════ PHASE 1: RECORD ════════════════ */}
        {phase === 'record' && (
          <>
            {/* ── Session-type picker ── */}
            <View style={styles.sessionTypePicker}>
              <Text style={styles.sessionTypeLabel}>SESSION TYPE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sessionTypeChips}
                keyboardShouldPersistTaps="handled"
              >
                {GROUP_SESSION_TYPES.map(opt => {
                  const active = sessionType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => { setSessionType(opt.value); Haptics.selectionAsync(); }}
                      style={({ pressed }) => [
                        styles.sessionTypeChip,
                        active && styles.sessionTypeChipActive,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={13}
                        color={active ? WHITE : SLATE}
                      />
                      <Text style={[styles.sessionTypeChipText, active && styles.sessionTypeChipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
              {([
                { id: 'record' as const,     label: 'Record',     icon: 'radio' },
                { id: 'transcript' as const, label: 'Transcript', icon: 'document-text-outline' },
              ] as const).map(tab => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={activeTab === tab.id ? TEAL : SLATE}
                  />
                  <Text style={[styles.tabLabel, { color: activeTab === tab.id ? TEAL : SLATE }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {/* Draft restore offer */}
              {draftBanner === 'pending' && (
                <View style={[styles.alertBanner, styles.alertAmber]}>
                  <Ionicons name="document-text-outline" size={16} color={AMBER} />
                  <View style={styles.flex}>
                    <Text style={[styles.alertTitle, { color: '#92400e' }]}>Unsaved draft found</Text>
                    <Text style={[styles.alertBody, { color: '#78350f' }]}>
                      A previous group session draft was saved before the app closed. Would you like to restore it?
                    </Text>
                    <View style={styles.draftActions}>
                      <Pressable onPress={handleRestoreDraft} style={styles.draftBtn}>
                        <Text style={styles.draftBtnRestore}>Restore draft</Text>
                      </Pressable>
                      <Pressable onPress={handleDiscardDraft} hitSlop={8}>
                        <Text style={styles.draftBtnDiscard}>Discard</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Mic denied */}
              {micDenied && (
                <View style={[styles.alertBanner, styles.alertRed]}>
                  <Ionicons name="mic-off-outline" size={16} color={RED} />
                  <View style={styles.flex}>
                    <Text style={[styles.alertTitle, { color: RED }]}>Microphone access denied</Text>
                    <Text style={[styles.alertBody, { color: RED }]}>
                      Allow microphone access in Settings, or type the transcript manually.
                    </Text>
                  </View>
                </View>
              )}

              {/* Record tab */}
              {activeTab === 'record' && (
                <View style={styles.section}>
                  {!isTranscriptionSupported && !isRecording && !micDenied && (
                    <View style={[styles.alertBanner, styles.alertBlue]}>
                      <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
                      <View style={styles.flex}>
                        <Text style={[styles.alertTitle, { color: '#1d4ed8' }]}>
                          Audio recording — manual transcript required
                        </Text>
                        <Text style={[styles.alertBody, { color: '#1e3a8a' }]}>
                          Live speech-to-text isn't available here. Record the session then add your notes in the Transcript tab.
                        </Text>
                      </View>
                    </View>
                  )}

                  {!isTranscriptionSupported && isRecording && (
                    <View style={[styles.alertBanner, styles.alertTeal]}>
                      <Ionicons name="mic" size={16} color={TEAL_DARK} />
                      <View style={styles.flex}>
                        <Text style={[styles.alertTitle, { color: TEAL_DARK }]}>Audio is being recorded</Text>
                        <Text style={[styles.alertBody, { color: TEAL_DARK }]}>
                          Switch to the Transcript tab to type notes while recording.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Status row */}
                  <View style={styles.statusRow}>
                    {isRecording && !isPaused && (
                      <View style={styles.recIndicator}>
                        <View style={styles.recDot} />
                        <Text style={styles.recLabel}>REC</Text>
                      </View>
                    )}
                    {isPaused && <Text style={[styles.recLabel, { color: AMBER }]}>PAUSED</Text>}
                    {!isRecording && !isPaused && <Text style={styles.readyLabel}>Ready to record</Text>}
                    <Timer seconds={elapsedSeconds} />
                  </View>

                  <WaveformBars active={isRecording && !isPaused} />

                  {/* Controls */}
                  <View style={styles.controls}>
                    {!isRecording ? (
                      <Pressable
                        onPress={handleStart}
                        disabled={micDenied}
                        style={({ pressed }) => [styles.btn, styles.btnRed, { opacity: micDenied ? 0.4 : pressed ? 0.8 : 1 }]}
                      >
                        <Ionicons name="mic" size={18} color={WHITE} />
                        <Text style={styles.btnText}>Start Recording</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.controlRow}>
                        <Pressable
                          onPress={isPaused ? handleResume : handlePause}
                          style={({ pressed }) => [styles.btn, styles.btnAmber, { opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color={WHITE} />
                          <Text style={styles.btnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleStop}
                          style={({ pressed }) => [styles.btn, styles.btnNavy, { opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Ionicons name="stop" size={16} color={WHITE} />
                          <Text style={styles.btnText}>Stop & Review</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Live transcript preview — web only */}
                  {isTranscriptionSupported && (transcript || interimText) ? (
                    <View style={styles.livePreviewWrap}>
                      <Text style={styles.livePreviewLabel}>LIVE TRANSCRIPT</Text>
                      <ScrollView ref={transcriptScrollRef} style={styles.livePreview} nestedScrollEnabled>
                        <Text style={styles.livePreviewText}>
                          {transcript}
                          <Text style={styles.livePreviewInterim}>{interimText}</Text>
                        </Text>
                      </ScrollView>
                    </View>
                  ) : null}

                  {!isTranscriptionSupported && isRecording && (
                    <Pressable
                      onPress={() => setActiveTab('transcript')}
                      style={styles.transcriptShortcut}
                    >
                      <Ionicons name="document-text-outline" size={15} color={TEAL} />
                      <Text style={styles.transcriptShortcutText}>Add notes in Transcript tab →</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Transcript tab */}
              {activeTab === 'transcript' && (
                <View style={styles.section}>
                  <Text style={styles.inputLabel}>
                    {isTranscriptionSupported ? 'Edit Transcript' : 'Add Session Notes'}
                  </Text>
                  <TextInput
                    style={styles.transcriptInput}
                    value={editableTranscript}
                    onChangeText={setEditableTranscript}
                    multiline
                    textAlignVertical="top"
                    placeholder={
                      isTranscriptionSupported
                        ? 'Your transcript will appear here after recording. Edit before attaching.'
                        : "Type your group session notes here. You'll attach them to patients in the next step."
                    }
                    placeholderTextColor={SLATE}
                  />
                  <Text style={styles.wordCount}>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'} · edit freely before attaching
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer — proceed to attach */}
            <View style={styles.footer}>
              <Pressable
                onPress={handleProceedToAttach}
                disabled={!editableTranscript.trim()}
                style={({ pressed }) => [
                  styles.btn, styles.btnTeal, styles.btnFull,
                  { opacity: !editableTranscript.trim() ? 0.4 : pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="people-outline" size={18} color={WHITE} />
                <Text style={styles.btnText}>Select Patients →</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab(activeTab === 'record' ? 'transcript' : 'record')}
                style={styles.footerSecondary}
              >
                <Text style={styles.footerSecondaryText}>
                  {activeTab === 'record' ? 'Transcript Tab →' : '← Back to Record'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ════════════════ PHASE 2: ATTACH ════════════════ */}
        {phase === 'attach' && (
          <>
            {/* Select all / clear all */}
            <View style={styles.attachToolbar}>
              <Text style={styles.attachToolbarLabel}>
                {patients.length} patient{patients.length !== 1 ? 's' : ''} in today's census
              </Text>
              <Pressable
                onPress={allSelected ? handleClearAll : handleSelectAll}
                hitSlop={8}
              >
                <Text style={styles.attachToolbarAction}>
                  {allSelected ? 'Clear all' : 'Select all'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.body, { gap: 8 }]}
              keyboardShouldPersistTaps="handled"
            >
              {patients.length === 0 ? (
                <View style={styles.emptyAttach}>
                  <Ionicons name="people-outline" size={36} color={SLATE} />
                  <Text style={styles.emptyAttachText}>No patients on the census today</Text>
                </View>
              ) : (
                patients.map(p => (
                  <PatientRow
                    key={p.id}
                    patient={p}
                    selected={selectedIds.has(p.id)}
                    transcript={overrides[p.id] ?? editableTranscript}
                    existingNoteCount={noteCountByPatient.get(p.id) ?? 0}
                    onToggle={() => togglePatient(p.id)}
                    onTranscriptChange={t => setPatientTranscript(p.id, t)}
                  />
                ))
              )}

              {/* Success banner */}
              {attached && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                  <Text style={styles.successText}>
                    Transcript attached to {selectedIds.size} patient{selectedIds.size !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {/* Duplicate summary warning — shown when ≥1 selected patient already has a note today */}
              {duplicateCount > 0 && !attached && (
                <View style={styles.duplicateSummaryBanner}>
                  <Ionicons name="warning-outline" size={16} color={AMBER} />
                  <View style={styles.flex}>
                    <Text style={styles.duplicateSummaryTitle}>
                      {duplicateCount} patient{duplicateCount !== 1 ? 's' : ''} already {duplicateCount !== 1 ? 'have' : 'has'} a group note today
                    </Text>
                    <Text style={styles.duplicateSummaryBody}>
                      You can still attach — a second note will be added. Deselect them to skip.
                    </Text>
                  </View>
                </View>
              )}
              <Pressable
                onPress={handleAttach}
                disabled={selectedIds.size === 0 || attached}
                style={({ pressed }) => [
                  styles.btn, styles.btnTeal, styles.btnFull,
                  { opacity: (selectedIds.size === 0 || attached) ? 0.4 : pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="arrow-down-circle-outline" size={18} color={WHITE} />
                <Text style={styles.btnText}>
                  {selectedIds.size === 0
                    ? 'Select patients above'
                    : `Attach to ${selectedIds.size} Patient${selectedIds.size !== 1 ? 's' : ''}`}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPhase('record')}
                style={styles.footerSecondary}
              >
                <Text style={styles.footerSecondaryText}>← Back to Recording</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: TEAL_DARK,
  },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: WHITE },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  closeBtn: { padding: 4 },

  // Phase indicator
  phaseBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER,
    backgroundColor: WHITE, gap: 8,
  },
  phaseStep: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: SLATE_LIGHT,
  },
  phaseStepActive: { backgroundColor: TEAL },
  phaseStepText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: SLATE },
  phaseStepTextActive: { color: WHITE },
  phaseArrow: {},

  // Tabs
  tabBar: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER, backgroundColor: WHITE,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: TEAL },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Body
  body: { padding: 16, gap: 16, paddingBottom: 8 },
  section: { gap: 14 },

  // Alert banners
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1,
  },
  alertRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  alertBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  alertTeal: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  alertAmber: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  draftActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  draftBtn: {},
  draftBtnRestore: { fontSize: 13, fontFamily: 'Inter_700Bold', color: TEAL },
  draftBtnDiscard: { fontSize: 13, fontFamily: 'Inter_400Regular', color: SLATE },
  alertTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  alertBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  // Status row
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  recLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: RED },
  readyLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: SLATE },
  timer: { fontSize: 28, fontFamily: 'Inter_700Bold', color: NAVY, letterSpacing: 1 },

  // Waveform
  waveContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 56, backgroundColor: SLATE_LIGHT,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
  },
  waveBar: { width: 5, borderRadius: 3 },

  // Controls
  controls: { alignItems: 'center' },
  controlRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },

  // Buttons
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
  },
  btnFull: { width: '100%', justifyContent: 'center', borderRadius: 12 },
  btnText: { color: WHITE, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  btnRed: { backgroundColor: RED },
  btnAmber: { backgroundColor: AMBER },
  btnNavy: { backgroundColor: NAVY },
  btnTeal: { backgroundColor: TEAL },

  // Live preview
  livePreviewWrap: { gap: 6 },
  livePreviewLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: SLATE,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  livePreview: {
    maxHeight: 120, backgroundColor: SLATE_LIGHT,
    borderRadius: 10, padding: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
  },
  livePreviewText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, color: NAVY },
  livePreviewInterim: { color: SLATE, fontStyle: 'italic' },

  // Transcript shortcut
  transcriptShortcut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#99f6e4',
  },
  transcriptShortcutText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEAL },

  // Transcript tab
  inputLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: SLATE,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2,
  },
  transcriptInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14,
    fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, color: NAVY,
    minHeight: 180, backgroundColor: SLATE_LIGHT,
  },
  wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: SLATE, marginTop: 2 },

  // Footer
  footer: {
    padding: 16, gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER,
    backgroundColor: WHITE,
  },
  footerSecondary: { alignItems: 'center', paddingVertical: 4 },
  footerSecondaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: SLATE },

  // Session-type picker
  sessionTypePicker: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER,
    backgroundColor: WHITE, gap: 8,
  },
  sessionTypeLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: SLATE,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  sessionTypeChips: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  sessionTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: SLATE_LIGHT,
    borderWidth: 1, borderColor: BORDER,
  },
  sessionTypeChipActive: {
    backgroundColor: TEAL, borderColor: TEAL_DARK,
  },
  sessionTypeChipText: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: SLATE,
  },
  sessionTypeChipTextActive: { color: WHITE },

  // Attach phase toolbar
  attachToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER,
    backgroundColor: SLATE_LIGHT,
  },
  attachToolbarLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: SLATE },
  attachToolbarAction: { fontSize: 13, fontFamily: 'Inter_700Bold', color: TEAL },

  // Patient rows
  patientRow: {
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    backgroundColor: WHITE, overflow: 'hidden',
  },
  patientRowSelected: { borderColor: TEAL, backgroundColor: '#f0fdfa' },
  patientRowDuplicate: { borderColor: AMBER_BORDER, backgroundColor: AMBER_BG },
  patientRowHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE,
  },
  checkboxSelected: { backgroundColor: TEAL, borderColor: TEAL },
  patientRowInfo: { flex: 1 },
  patientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  patientRowName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: NAVY },
  patientRowMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: SLATE, marginTop: 1 },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expandBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEAL },

  // Duplicate / existing-note indicators
  duplicateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: AMBER_BG, borderWidth: 1, borderColor: AMBER_BORDER,
    borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2,
  },
  duplicateBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: AMBER },
  duplicateWarningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  duplicateWarningText: {
    flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: AMBER, lineHeight: 17,
  },

  // Duplicate summary banner in footer
  duplicateSummaryBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: AMBER_BG, borderWidth: 1, borderColor: AMBER_BORDER,
    borderRadius: 12, padding: 12,
  },
  duplicateSummaryTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: AMBER, marginBottom: 2 },
  duplicateSummaryBody: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 17 },

  // Per-patient transcript editor
  transcriptEditor: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER,
    padding: 14, gap: 8, backgroundColor: WHITE,
  },
  editorLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: SLATE,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  editorInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    padding: 12, fontSize: 13, fontFamily: 'Inter_400Regular',
    lineHeight: 20, color: NAVY, minHeight: 120, backgroundColor: SLATE_LIGHT,
    textAlignVertical: 'top',
  },

  // Empty state
  emptyAttach: { alignItems: 'center', gap: 10, paddingTop: 40 },
  emptyAttachText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: SLATE, textAlign: 'center' },

  // Success
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN_BG, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: GREEN_BORDER,
  },
  successText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: GREEN },
});
