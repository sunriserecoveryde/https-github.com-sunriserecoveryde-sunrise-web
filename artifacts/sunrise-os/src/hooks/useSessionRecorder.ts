/**
 * useSessionRecorder.ts
 *
 * Manages browser MediaRecorder + Web Speech API SpeechRecognition lifecycle
 * for the Session Recording & Transcription feature.
 *
 * Exposes: start, pause, resume, stop, transcript, interimText,
 *          isRecording, isPaused, isSupported, elapsedSeconds,
 *          audioBlobUrl, recordingKey, clearRecording
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecordingStore } from './useRecordingStore';

// Web Speech API type declarations (not in all TS DOM libs)
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

// Extend window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface SessionRecorderState {
  isSupported: boolean;
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  interimText: string;
  elapsedSeconds: number;
  analyserNode: AnalyserNode | null;
  /** Object URL pointing at the captured WebM blob (null until recording stops). */
  audioBlobUrl: string | null;
  /** IndexedDB key for the current recording (null before first start). */
  recordingKey: string | null;
}

export interface SessionRecorderControls {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  resetTranscript: () => void;
  /**
   * Immediately mark the current recording as discarded, revoke its object URL,
   * and delete the IndexedDB entry. Safe to call before or after stop() — the
   * discard flag prevents any pending MediaRecorder.onstop from saving the blob.
   */
  clearRecording: () => Promise<void>;
}

export function useSessionRecorder(): SessionRecorderState & SessionRecorderControls {
  const SpeechRec = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null;

  const [isSupported] = useState(() => !!SpeechRec);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobUrlRef = useRef<string | null>(null);

  // sessionKeyRef mirrors recordingKey state so clearRecording can read it synchronously.
  const sessionKeyRef = useRef<string | null>(null);

  // discardedRef is set synchronously by clearRecording() BEFORE stop() is called.
  // MediaRecorder.onstop checks this flag before creating the blob or writing to IndexedDB,
  // preventing the async save from racing with a user-initiated discard.
  const discardedRef = useRef(false);

  const { saveRecording, deleteRecording } = useRecordingStore();

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  /**
   * Discard the current recording.
   * Sets the discard flag synchronously so any pending onstop callback cannot
   * save the blob after this call returns — even if onstop fires later.
   */
  const clearRecording = useCallback(async () => {
    // Set flag first (synchronous) so onstop bails out even if it fires after this returns.
    discardedRef.current = true;

    // Revoke any existing object URL immediately.
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setAudioBlobUrl(null);

    // Delete from IndexedDB using the ref (synchronous read, no state-updater side effects).
    const key = sessionKeyRef.current;
    if (key) {
      sessionKeyRef.current = null;
      setRecordingKey(null);
      try { await deleteRecording(key); } catch { /* best-effort */ }
    } else {
      setRecordingKey(null);
    }
  }, [deleteRecording]);

  const start = useCallback(async () => {
    if (isRecording) return;

    // Reset discard flag and clear any previous recording before starting.
    discardedRef.current = false;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setAudioBlobUrl(null);
    chunksRef.current = [];

    // Request mic
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return; // mic denied — caller shows fallback
    }
    streamRef.current = stream;

    // Generate a stable key for this recording session.
    const sessionKey = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    sessionKeyRef.current = sessionKey;
    setRecordingKey(sessionKey);

    // Web Audio analyser for waveform visualisation
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    setAnalyserNode(analyser);

    // MediaRecorder — capture WebM chunks for playback.
    let mr: MediaRecorder | null = null;
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      mr = new MediaRecorder(stream);
    }

    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      // If clearRecording() was called before onstop fired, abort — do not
      // create a blob URL or write to IndexedDB after a user-initiated discard.
      if (discardedRef.current) {
        chunksRef.current = [];
        return;
      }
      const chunks = chunksRef.current;
      if (chunks.length === 0) return;
      const mimeType = mr?.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setAudioBlobUrl(url);
      // Persist to IndexedDB (best-effort).
      try {
        await saveRecording(sessionKey, blob);
      } catch { /* non-fatal */ }
    };

    mr.start(1000); // collect chunks every second
    mediaRecorderRef.current = mr;

    // Speech recognition
    if (SpeechRec) {
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

      rec.onerror = () => { /* silently ignore network/no-speech errors */ };

      // Auto-restart on end (browser stops after ~60s silence)
      rec.onend = () => {
        if (isRecording && !isPaused) {
          try { rec.start(); } catch { /* ignore */ }
        }
      };

      rec.start();
      recognitionRef.current = rec;
    }

    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
  }, [isRecording, isPaused, SpeechRec, saveRecording]);

  const pause = useCallback(() => {
    if (!isRecording || isPaused) return;
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    clearTimer();
    setIsPaused(true);
    audioCtxRef.current?.suspend();
  }, [isRecording, isPaused]);

  const resume = useCallback(() => {
    if (!isRecording || !isPaused) return;
    try { recognitionRef.current?.start(); } catch { /* already started */ }
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    audioCtxRef.current?.resume();
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    setIsPaused(false);
  }, [isRecording, isPaused]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    // Stop MediaRecorder — onstop fires asynchronously and finalises the blob
    // (unless discardedRef is set, in which case onstop skips saving).
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
    setInterimText('');
    setAnalyserNode(null);
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
  }, []);

  // Clean up on unmount — treat as a discard so onstop doesn't write after unmount.
  useEffect(() => {
    return () => {
      discardedRef.current = true;
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
      clearTimer();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    isRecording,
    isPaused,
    transcript,
    interimText,
    elapsedSeconds,
    analyserNode,
    audioBlobUrl,
    recordingKey,
    start,
    pause,
    resume,
    stop,
    resetTranscript,
    clearRecording,
  };
}
