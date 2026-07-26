/**
 * SessionRecorderModal.tsx  (Expo / React Native)
 *
 * Full-screen modal for recording a clinical session and producing a
 * transcript that can be inserted into the nursing-note text field.
 *
 * UX mirrors the web SessionRecorderModal:
 *   Record tab  → live waveform animation + real-time transcript (web)
 *                 or real audio recording with manual-entry prompt (native)
 *   Transcript tab → editable text before inserting into the note
 *
 * Capability model (from useSessionRecorder):
 *   isRecordingSupported      — always true (expo-av on native, getUserMedia on web)
 *   isTranscriptionSupported  — true only on web (Web Speech API)
 *
 * The modal never shows a transcript-generating UI on native; instead it
 * shows a clear banner explaining that audio is being captured but the
 * clinician should add notes manually in the Transcript tab.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Alert,
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
import { useSessionRecorder } from '@/hooks/useSessionRecorder';

// ── Colour tokens (match the app palette) ────────────────────────

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const RED = '#ef4444';
const AMBER = '#f59e0b';
const NAVY = '#1C2B3A';
const SLATE = '#64748b';
const SLATE_LIGHT = '#f1f5f9';
const WHITE = '#ffffff';
const BORDER = '#e2e8f0';

// ── Animated waveform (5 bars pulsing) ───────────────────────────

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
              Animated.timing(a, {
                toValue: 1,
                duration: 350,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: false,
              }),
              Animated.timing(a, {
                toValue: 0.2,
                duration: 350,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: false,
              }),
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
              height: a.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 40],
              }),
              backgroundColor: active ? TEAL : BORDER,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Timer ─────────────────────────────────────────────────────────

function Timer({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <Text style={styles.timer}>
      {mm}:{ss}
    </Text>
  );
}

// ── Props ─────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  patientName: string;
  /** Called with the finished transcript so the parent can insert it */
  onUseTranscript: (transcript: string) => void;
}

// ── Main component ────────────────────────────────────────────────

export function SessionRecorderModal({
  visible,
  onClose,
  patientName,
  onUseTranscript,
}: Props) {
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

  const [activeTab, setActiveTab] = useState<'record' | 'transcript'>('record');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const transcriptScrollRef = useRef<ScrollView>(null);

  // Sync editable transcript while web transcription runs
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

  // Reset state each time the modal opens
  useEffect(() => {
    if (visible) {
      resetTranscript();
      setEditableTranscript('');
      setActiveTab('record');
      setMicDenied(false);
      setInserted(false);
    }
  }, [visible, resetTranscript]);

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

  const handlePause = useCallback(async () => {
    await pause();
  }, [pause]);

  const handleResume = useCallback(async () => {
    await resume();
  }, [resume]);

  const handleUse = useCallback(() => {
    const text = editableTranscript.trim();
    if (!text) return;
    onUseTranscript(text);
    setInserted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [editableTranscript, onUseTranscript]);

  const handleClose = useCallback(async () => {
    const hasUnusedTranscript = editableTranscript.trim().length > 0 && !inserted;
    if (hasUnusedTranscript) {
      Alert.alert(
        'Discard transcript?',
        'You have a transcript that hasn\'t been inserted into the note yet. Closing will discard it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              if (isRecording) await stop();
              onClose();
            },
          },
        ],
      );
      return;
    }
    if (isRecording) await stop();
    onClose();
  }, [editableTranscript, inserted, isRecording, stop, onClose]);

  const wordCount = editableTranscript.trim().split(/\s+/).filter(Boolean).length;

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
            <Ionicons name="mic" size={18} color={WHITE} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Session Recording</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {patientName}
            </Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          {([
            { id: 'record' as const, label: 'Record', icon: 'radio' },
            { id: 'transcript' as const, label: 'Transcript', icon: 'document-text-outline' },
          ] as const).map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.id ? TEAL : SLATE}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? TEAL : SLATE },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Body ── */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mic denied banner */}
          {micDenied && (
            <View style={[styles.alertBanner, styles.alertRed]}>
              <Ionicons name="mic-off-outline" size={16} color={RED} />
              <View style={styles.flex}>
                <Text style={[styles.alertTitle, { color: RED }]}>
                  Microphone access denied
                </Text>
                <Text style={[styles.alertBody, { color: RED }]}>
                  Allow microphone access in Settings, or paste the transcript manually in the Transcript tab.
                </Text>
              </View>
            </View>
          )}

          {/* ── Record tab ── */}
          {activeTab === 'record' && (
            <View style={styles.section}>

              {/* Native info banner — shown before recording starts */}
              {!isTranscriptionSupported && !isRecording && !micDenied && (
                <View style={[styles.alertBanner, styles.alertBlue]}>
                  <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
                  <View style={styles.flex}>
                    <Text style={[styles.alertTitle, { color: '#1d4ed8' }]}>
                      Audio recording — manual transcript required
                    </Text>
                    <Text style={[styles.alertBody, { color: '#1e3a8a' }]}>
                      Live speech-to-text isn't available on this device. Tap Record to capture the session audio, then switch to the Transcript tab to type your notes.
                    </Text>
                  </View>
                </View>
              )}

              {/* Recording-active reminder for native */}
              {!isTranscriptionSupported && isRecording && (
                <View style={[styles.alertBanner, styles.alertTeal]}>
                  <Ionicons name="mic" size={16} color={TEAL_DARK} />
                  <View style={styles.flex}>
                    <Text style={[styles.alertTitle, { color: TEAL_DARK }]}>
                      Audio is being recorded
                    </Text>
                    <Text style={[styles.alertBody, { color: TEAL_DARK }]}>
                      Auto-transcription isn't available here. Tap the Transcript tab to add your notes while recording.
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
                {isPaused && (
                  <Text style={[styles.recLabel, { color: AMBER }]}>PAUSED</Text>
                )}
                {!isRecording && !isPaused && (
                  <Text style={styles.readyLabel}>Ready to record</Text>
                )}
                <Timer seconds={elapsedSeconds} />
              </View>

              {/* Waveform */}
              <WaveformBars active={isRecording && !isPaused} />

              {/* Controls */}
              <View style={styles.controls}>
                {!isRecording ? (
                  <Pressable
                    onPress={handleStart}
                    disabled={micDenied}
                    style={({ pressed }) => [
                      styles.btn,
                      styles.btnRed,
                      { opacity: micDenied ? 0.4 : pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Ionicons name="mic" size={18} color={WHITE} />
                    <Text style={styles.btnText}>Start Recording</Text>
                  </Pressable>
                ) : (
                  <View style={styles.controlRow}>
                    <Pressable
                      onPress={isPaused ? handleResume : handlePause}
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnAmber,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <Ionicons
                        name={isPaused ? 'play' : 'pause'}
                        size={16}
                        color={WHITE}
                      />
                      <Text style={styles.btnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleStop}
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnNavy,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
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
                  <ScrollView
                    ref={transcriptScrollRef}
                    style={styles.livePreview}
                    nestedScrollEnabled
                  >
                    <Text style={styles.livePreviewText}>
                      {transcript}
                      <Text style={styles.livePreviewInterim}>{interimText}</Text>
                    </Text>
                  </ScrollView>
                </View>
              ) : null}

              {/* Native shortcut: go to transcript tab while recording */}
              {!isTranscriptionSupported && isRecording && (
                <Pressable
                  onPress={() => setActiveTab('transcript')}
                  style={styles.transcriptShortcut}
                >
                  <Ionicons name="document-text-outline" size={15} color={TEAL} />
                  <Text style={styles.transcriptShortcutText}>
                    Add notes in Transcript tab →
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Transcript tab ── */}
          {activeTab === 'transcript' && (
            <View style={styles.section}>
              <Text style={styles.inputLabel}>
                {isTranscriptionSupported ? 'Edit Transcript' : 'Add Session Notes'}
              </Text>
              <TextInput
                style={styles.transcriptInput}
                value={editableTranscript}
                onChangeText={t => { setEditableTranscript(t); setInserted(false); }}
                multiline
                textAlignVertical="top"
                placeholder={
                  isTranscriptionSupported
                    ? 'Your transcript will appear here after recording. Edit freely before inserting.'
                    : 'Type your session notes here. They will be inserted into the note field when you tap Use.'
                }
                placeholderTextColor={SLATE}
              />
              <Text style={styles.wordCount}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · edit freely before inserting
              </Text>

              {inserted && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                  <Text style={styles.successText}>
                    {isTranscriptionSupported
                      ? 'Transcript inserted — review and save your note.'
                      : 'Notes inserted — review and save your note.'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleUse}
            disabled={!editableTranscript.trim()}
            style={({ pressed }) => [
              styles.btn,
              styles.btnTeal,
              styles.btnFull,
              { opacity: !editableTranscript.trim() ? 0.4 : pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color={WHITE} />
            <Text style={styles.btnText}>
              {isTranscriptionSupported ? 'Use Transcript' : 'Insert Notes'}
            </Text>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: TEAL_DARK,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: WHITE },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  closeBtn: { padding: 4 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: TEAL },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Body
  body: { padding: 20, gap: 16, paddingBottom: 8 },
  section: { gap: 14 },

  // Alert banners
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  alertRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  alertBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  alertTeal: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  alertTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  alertBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  recLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: RED },
  readyLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: SLATE },
  timer: { fontSize: 28, fontFamily: 'Inter_700Bold', color: NAVY, letterSpacing: 1 },

  // Waveform
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 56,
    backgroundColor: SLATE_LIGHT,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  waveBar: { width: 5, borderRadius: 3 },

  // Controls
  controls: { alignItems: 'center' },
  controlRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },

  // Buttons
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnFull: { width: '100%', justifyContent: 'center', borderRadius: 12 },
  btnText: { color: WHITE, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  btnRed: { backgroundColor: RED },
  btnAmber: { backgroundColor: AMBER },
  btnNavy: { backgroundColor: NAVY },
  btnTeal: { backgroundColor: TEAL },

  // Live preview (web only)
  livePreviewWrap: { gap: 6 },
  livePreviewLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: SLATE,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  livePreview: {
    maxHeight: 120,
    backgroundColor: SLATE_LIGHT,
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  livePreviewText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, color: NAVY },
  livePreviewInterim: { color: SLATE, fontStyle: 'italic' },

  // Native transcript shortcut
  transcriptShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  transcriptShortcutText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEAL },

  // Transcript tab
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: SLATE,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  transcriptInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: NAVY,
    minHeight: 200,
    backgroundColor: SLATE_LIGHT,
  },
  wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: SLATE, marginTop: 2 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#15803d' },

  // Footer
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
  },
  footerSecondary: { alignItems: 'center', paddingVertical: 4 },
  footerSecondaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: SLATE },
});
