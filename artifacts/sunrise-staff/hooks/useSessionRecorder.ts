/**
 * useSessionRecorder.ts  (Expo / React Native)
 *
 * Two-path implementation:
 *
 *   Web  — Web Speech API gives real-time transcription while recording.
 *           isRecordingSupported = true, isTranscriptionSupported = true.
 *
 *   Native — expo-av records real audio to a temp file.
 *             isRecordingSupported = true, isTranscriptionSupported = false.
 *             The UI is honest: it records audio but tells the clinician
 *             to type/paste the transcript manually.
 *
 * The modal reads `isTranscriptionSupported` and never shows a progress
 * banner it can't actually fill.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Persistence key for background flush ──────────────────────────
const TRANSCRIPT_BACKUP_KEY = 'sunrise_staff_session_recorder_transcript_backup';

// ── Web Speech API type shims (web-only) ──────────────────────────

interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function getWebSpeechCtor(): SpeechRecognitionCtor | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// ── Public surface ────────────────────────────────────────────────

export interface SessionRecorderState {
  /** True on web when Web Speech API is present; true on native (expo-av). */
  isRecordingSupported: boolean;
  /** True only on web where speech-to-text runs live. False on native. */
  isTranscriptionSupported: boolean;
  isRecording: boolean;
  isPaused: boolean;
  /** Accumulated confirmed transcript (web) or empty string (native). */
  transcript: string;
  /** Interim/partial result text shown while the user is still speaking. */
  interimText: string;
  elapsedSeconds: number;
  /**
   * True after the app returns from background while a recording was active.
   * The modal uses this to show a "Paused — app was in background" banner.
   */
  wasBackgrounded: boolean;
}

export interface SessionRecorderControls {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  resetTranscript: () => void;
  /** Dismiss the wasBackgrounded flag once the user has seen the banner. */
  clearBackgroundedFlag: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useSessionRecorder(): SessionRecorderState & SessionRecorderControls {
  // ── Capability detection ──────────────────────────────────────
  const SpeechRec = getWebSpeechCtor();
  const isWeb = Platform.OS === 'web';

  // On native, expo-av is always available; on web we use Web Speech API.
  const [isRecordingSupported] = useState(true);
  const [isTranscriptionSupported] = useState(() => !!SpeechRec);

  // ── Shared state ──────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wasBackgrounded, setWasBackgrounded] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  // Web path
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Native path
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Shared
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  // ── Timer helpers ─────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
  }, [clearTimer]);

  // ── Web Speech API helpers ────────────────────────────────────

  const startWebRecognition = useCallback(() => {
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalChunk) {
        transcriptRef.current += finalChunk;
        setTranscript(transcriptRef.current);
      }
      setInterimText(interim);
    };

    rec.onerror = () => { /* network / no-speech — ignore silently */ };

    // Browser halts recognition after ~60 s of silence — restart automatically
    rec.onend = () => {
      if (isRecordingRef.current && !isPausedRef.current) {
        try { rec.start(); } catch { /* already restarting */ }
      }
    };

    rec.start();
    recognitionRef.current = rec;
  }, [SpeechRec]);

  const stopWebRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // ── Native (expo-av) helpers ──────────────────────────────────

  const startNativeRecording = useCallback(async () => {
    // Request mic permission
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('mic-denied');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
  }, []);

  const stopNativeRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
    } catch {
      // Already unloaded — ignore
    }
    recordingRef.current = null;

    // Restore audio mode so playback works normally afterwards
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }, []);

  // ── start ─────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (isRecordingRef.current) return;

    if (isWeb) {
      // Probe mic permission early for a reliable denied signal
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
        } catch {
          throw new Error('mic-denied');
        }
      }
      startWebRecognition();
    } else {
      await startNativeRecording();
    }

    isRecordingRef.current = true;
    isPausedRef.current = false;
    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    startTimer();
  }, [isWeb, startWebRecognition, startNativeRecording, startTimer]);

  // ── pause ─────────────────────────────────────────────────────

  const pause = useCallback(async () => {
    if (!isRecordingRef.current || isPausedRef.current) return;

    if (isWeb) {
      stopWebRecognition();
    } else {
      // expo-av Recording doesn't support pause on all platforms;
      // stop+restart on resume is the safe cross-platform pattern.
      try {
        await recordingRef.current?.pauseAsync();
      } catch {
        // pauseAsync not supported — silently fall through; timer is paused
      }
    }

    clearTimer();
    isPausedRef.current = true;
    setIsPaused(true);
    setInterimText('');
  }, [isWeb, stopWebRecognition, clearTimer]);

  // ── resume ────────────────────────────────────────────────────

  const resume = useCallback(async () => {
    if (!isRecordingRef.current || !isPausedRef.current) return;

    if (isWeb) {
      startWebRecognition();
    } else {
      try {
        await recordingRef.current?.startAsync();
      } catch {
        // Resume not supported — start a fresh segment
        await startNativeRecording();
      }
    }

    isPausedRef.current = false;
    setIsPaused(false);
    startTimer();
  }, [isWeb, startWebRecognition, startNativeRecording, startTimer]);

  // ── stop ──────────────────────────────────────────────────────

  const stop = useCallback(async () => {
    if (isWeb) {
      stopWebRecognition();
    } else {
      await stopNativeRecording();
    }

    clearTimer();
    isRecordingRef.current = false;
    isPausedRef.current = false;
    setIsRecording(false);
    setIsPaused(false);
    setInterimText('');
  }, [isWeb, stopWebRecognition, stopNativeRecording, clearTimer]);

  // ── AppState — flush transcript to AsyncStorage on background ──

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Flush whatever transcript we have so far, even if recording is not
        // active (clinician may have stopped but not yet copied the text).
        const current = transcriptRef.current;
        if (current) {
          try {
            await AsyncStorage.setItem(TRANSCRIPT_BACKUP_KEY, current);
          } catch {
            // Storage failure — silently continue; transcript already in RAM.
          }
        }

        // Pause live recognition/recording so the OS doesn't kill the process
        // while we still have a partial transcript.
        if (isRecordingRef.current && !isPausedRef.current) {
          if (isWeb) {
            recognitionRef.current?.stop();
            // Don't null it out — we'll restart on foreground.
          } else {
            try {
              await recordingRef.current?.pauseAsync();
            } catch {
              // Pause unsupported — ignore; audio will be clipped by OS anyway.
            }
          }
          clearTimer();
          isPausedRef.current = true;
          setIsPaused(true);
          setInterimText('');
        }
      } else if (nextState === 'active') {
        // Restore transcript from AsyncStorage (covers the case where JS
        // context was reloaded by the OS and the ref was wiped).
        try {
          const saved = await AsyncStorage.getItem(TRANSCRIPT_BACKUP_KEY);
          if (saved && !transcriptRef.current) {
            transcriptRef.current = saved;
            setTranscript(saved);
          }
        } catch {
          // Storage read failure — silently continue.
        }

        // Flag the banner if we were recording when backgrounded.
        if (isRecordingRef.current) {
          setWasBackgrounded(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
  }, [isWeb, clearTimer]);

  // ── clearBackgroundedFlag ─────────────────────────────────────

  const clearBackgroundedFlag = useCallback(() => {
    setWasBackgrounded(false);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      // Fire-and-forget native cleanup; hook is unmounting
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      clearTimer();
    };
  }, [clearTimer]);

  // ── Clear backup when transcript is fully reset ───────────────

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
    setElapsedSeconds(0);
    setWasBackgrounded(false);
    AsyncStorage.removeItem(TRANSCRIPT_BACKUP_KEY).catch(() => {});
  }, []);

  return {
    isRecordingSupported,
    isTranscriptionSupported,
    isRecording,
    isPaused,
    transcript,
    interimText,
    elapsedSeconds,
    wasBackgrounded,
    start,
    pause,
    resume,
    stop,
    resetTranscript,
    clearBackgroundedFlag,
  };
}
