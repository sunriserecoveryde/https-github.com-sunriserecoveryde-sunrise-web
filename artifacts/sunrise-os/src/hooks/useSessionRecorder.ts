/**
 * useSessionRecorder.ts
 *
 * Manages browser MediaRecorder + Web Speech API SpeechRecognition lifecycle
 * for the Session Recording & Transcription feature.
 *
 * Exposes: start, pause, resume, stop, transcript, interimText,
 *          isRecording, isPaused, isSupported, elapsedSeconds
 */

import { useState, useEffect, useRef, useCallback } from 'react';

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
}

export interface SessionRecorderControls {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  resetTranscript: () => void;
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

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef('');

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const start = useCallback(async () => {
    if (isRecording) return;

    // Request mic
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return; // mic denied — caller shows fallback
    }
    streamRef.current = stream;

    // Web Audio analyser for waveform visualisation
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    setAnalyserNode(analyser);

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
  }, [isRecording, isPaused, SpeechRec]);

  const pause = useCallback(() => {
    if (!isRecording || isPaused) return;
    recognitionRef.current?.stop();
    clearTimer();
    setIsPaused(true);
    audioCtxRef.current?.suspend();
  }, [isRecording, isPaused]);

  const resume = useCallback(() => {
    if (!isRecording || !isPaused) return;
    try { recognitionRef.current?.start(); } catch { /* already started */ }
    audioCtxRef.current?.resume();
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    setIsPaused(false);
  }, [isRecording, isPaused]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
      clearTimer();
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
    start,
    pause,
    resume,
    stop,
    resetTranscript,
  };
}
