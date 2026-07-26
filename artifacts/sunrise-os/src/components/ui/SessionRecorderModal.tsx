/**
 * SessionRecorderModal.tsx
 *
 * Full-screen modal for recording a clinical session and generating
 * a structured progress note via the existing AI Note Engine.
 *
 * Tabs:
 *  1. Record  — live waveform + real-time transcript stream
 *  2. Transcript — editable text before generating the note
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Square, Pause, Play, X, Sparkles,
  FileText, AlertTriangle, Radio, ClipboardEdit, ShieldAlert,
} from 'lucide-react';
import { useSessionRecorder } from '../../hooks/useSessionRecorder';
import { parseQuickCapture } from '../../lib/quickCaptureParser';
import { generateProgressNote, type NoteFormat, type ProgressNoteInput } from '../../lib/aiNoteEngine';

// ─── Waveform visualiser ─────────────────────────────────────────────────────

function Waveform({ analyser, isActive }: { analyser: AnalyserNode | null; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!analyser || !isActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // draw flat line when idle
      ctx.beginPath();
      ctx.strokeStyle = '#64748b40';
      ctx.lineWidth = 2;
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyser!.getByteTimeDomainData(dataArr);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.beginPath();
      ctx!.strokeStyle = '#0d9488';
      ctx!.lineWidth = 2;
      const sliceWidth = canvas!.width / dataArr.length;
      let x = 0;
      for (let i = 0; i < dataArr.length; i++) {
        const v = dataArr[i] / 128.0;
        const y = (v * canvas!.height) / 2;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
        x += sliceWidth;
      }
      ctx!.lineTo(canvas!.width, canvas!.height / 2);
      ctx!.stroke();
    }
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full h-20 rounded-lg bg-slate-50 border border-slate-200"
    />
  );
}

// ─── Timer display ────────────────────────────────────────────────────────────

function Timer({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <span className="font-mono text-3xl font-bold text-navy tabular-nums">
      {mm}:{ss}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  format: NoteFormat;
  patientName: string;
  noteType: string;
  fields: string[];
  onGenerate: (values: Record<string, string>) => void;
  /** Current note field values — used to detect overwrite conflicts */
  currentValues?: Record<string, string>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionRecorderModal({
  isOpen, onClose, format, patientName, noteType, fields, onGenerate, currentValues = {},
}: Props) {
  const {
    isSupported, isRecording, isPaused,
    transcript, interimText, elapsedSeconds, analyserNode,
    start, pause, resume, stop, resetTranscript,
  } = useSessionRecorder();

  const [activeTab, setActiveTab] = useState<'record' | 'transcript'>('record');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [generated, setGenerated] = useState(false);
  /** Values waiting for overwrite confirmation */
  const [pendingValues, setPendingValues] = useState<Record<string, string> | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Keep editable transcript in sync when recording
  useEffect(() => {
    setEditableTranscript(transcript);
  }, [transcript]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      setEditableTranscript('');
      setActiveTab('record');
      setMicDenied(false);
      setGenerated(false);
      setPendingValues(null);
    }
  }, [isOpen, resetTranscript]);

  const handleStart = useCallback(async () => {
    try {
      await start();
    } catch {
      setMicDenied(true);
    }
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    setActiveTab('transcript');
  }, [stop]);

  const handleGenerate = useCallback(() => {
    const text = editableTranscript.trim();
    if (!text) return;
    const { input } = parseQuickCapture(text);
    const fullInput: ProgressNoteInput = {
      clientName: patientName,
      noteType,
      ...input,
    };
    const sections = generateProgressNote(format, fullInput);
    const sectionValues = Object.values(sections);
    const newValues: Record<string, string> = {};
    fields.forEach((f, i) => { if (sectionValues[i]) newValues[f] = sectionValues[i]; });

    // Check whether any generated field would overwrite existing typed content
    const wouldOverwrite = fields.some(f => newValues[f] && currentValues[f]?.trim());
    if (wouldOverwrite) {
      setPendingValues(newValues);
      return;
    }

    onGenerate(newValues);
    setGenerated(true);
  }, [editableTranscript, patientName, noteType, format, fields, onGenerate, currentValues]);

  const confirmOverwrite = useCallback(() => {
    if (!pendingValues) return;
    onGenerate(pendingValues);
    setPendingValues(null);
    setGenerated(true);
  }, [pendingValues, onGenerate]);

  const cancelOverwrite = useCallback(() => {
    setPendingValues(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isRecording) stop();
    onClose();
  }, [isRecording, stop, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 flex-none">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Session Recording</div>
            <div className="text-xs text-teal-100">{patientName} · {noteType} · {format}</div>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border flex-none">
          {[
            { id: 'record' as const, label: 'Record', icon: <Radio className="w-3.5 h-3.5" /> },
            { id: 'transcript' as const, label: 'Transcript', icon: <ClipboardEdit className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600 bg-teal-50/50'
                  : 'border-transparent text-slate hover:text-navy hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Overwrite confirmation ── */}
          {pendingValues && (
            <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-900">
              <ShieldAlert className="w-5 h-5 flex-none mt-0.5 text-amber-600" />
              <div className="flex-1">
                <div className="font-semibold mb-1">This will replace your current draft</div>
                <div className="text-xs text-amber-700 mb-3">
                  You have already typed content in one or more note fields. Generating a new note from the recording will overwrite that text. This action cannot be undone.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmOverwrite}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Replace draft
                  </button>
                  <button
                    onClick={cancelOverwrite}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    Keep my draft
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ── Unsupported fallback ── */}
          {!isSupported && (
            <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-none mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Live transcription not available in this browser</div>
                <div className="text-xs">Paste your session transcript below and click Generate Note — it works exactly the same.</div>
              </div>
            </div>
          )}

          {/* ── Mic denied ── */}
          {micDenied && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <MicOff className="w-4 h-4 flex-none mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Microphone access denied</div>
                <div className="text-xs">Allow microphone access in your browser settings, or paste the transcript manually on the Transcript tab.</div>
              </div>
            </div>
          )}

          {/* ── Record tab ── */}
          {activeTab === 'record' && (
            <div className="space-y-5">
              {/* Timer + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isRecording && !isPaused && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> REC
                    </span>
                  )}
                  {isPaused && (
                    <span className="text-xs font-bold text-amber-500">PAUSED</span>
                  )}
                  {!isRecording && !isPaused && elapsedSeconds === 0 && (
                    <span className="text-xs text-slate-400">Ready to record</span>
                  )}
                </div>
                <Timer seconds={elapsedSeconds} />
              </div>

              {/* Waveform */}
              <Waveform analyser={analyserNode} isActive={isRecording && !isPaused} />

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={handleStart}
                    disabled={micDenied}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Mic className="w-5 h-5" /> Start Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? resume : pause}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-2 bg-navy hover:bg-navy/90 text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
                    >
                      <Square className="w-4 h-4" /> Stop & Review
                    </button>
                  </>
                )}
              </div>

              {/* Live transcript preview */}
              {isSupported && (transcript || interimText) && (
                <div>
                  <div className="text-[10px] font-bold text-slate uppercase tracking-wider mb-1.5">Live Transcript</div>
                  <div
                    ref={transcriptScrollRef}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-navy leading-relaxed max-h-36 overflow-y-auto"
                  >
                    <span>{transcript}</span>
                    <span className="text-slate-400 italic">{interimText}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Transcript tab ── */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">
                  {isSupported ? 'Edit Transcript' : 'Paste Transcript'}
                </label>
                <textarea
                  value={editableTranscript}
                  onChange={e => { setEditableTranscript(e.target.value); setGenerated(false); }}
                  rows={12}
                  placeholder={
                    isSupported
                      ? 'Your transcript will appear here after recording. You can edit it before generating the note.'
                      : 'Paste your session transcript or notes here. The AI will structure them into a clinical note in your selected format.'
                  }
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-teal-400 leading-relaxed"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  {editableTranscript.trim().split(/\s+/).filter(Boolean).length} words · Edit freely before generating
                </div>
              </div>

              {generated && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 font-semibold">
                  <Sparkles className="w-4 h-4" /> Note generated — check the editor fields below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-slate-50/50 flex-none">
          <button
            onClick={handleGenerate}
            disabled={!editableTranscript.trim()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Generate {format} Note
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className="flex items-center gap-1.5 text-sm text-slate hover:text-navy transition-colors"
          >
            <FileText className="w-4 h-4" /> Review Transcript
          </button>
          <button
            onClick={handleClose}
            className="ml-auto text-sm text-slate hover:text-navy transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
