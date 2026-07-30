/**
 * AiDraftAssist — inline AI draft button + review panel.
 *
 * Drop it between a field label and its textarea. When the clinician clicks
 * "AI Draft", the generator runs locally (simulated 450 ms delay for UX),
 * then the draft appears in an editable review card. Accepting pushes the
 * (possibly edited) text to the parent via onAccept. Human review is always
 * required — no draft is ever applied silently.
 */

import React, { useState, useRef } from 'react';
import { Sparkles, Check, X, RotateCcw } from 'lucide-react';

interface AiDraftAssistProps {
  /** Synchronous generator — return the draft string */
  onGenerate: () => string;
  /** Called when the clinician clicks Accept (with potentially edited draft) */
  onAccept: (text: string) => void;
  disabled?: boolean;
  /** Short label shown in the review card header, e.g. "medical history" */
  fieldName?: string;
}

type Phase = 'idle' | 'generating' | 'review';

export function AiDraftAssist({ onGenerate, onAccept, disabled, fieldName }: AiDraftAssistProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runGenerate = () => {
    if (disabled) return;
    setPhase('generating');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const text = onGenerate();
        setDraft(text);
        setPhase('review');
      } catch {
        setPhase('idle');
      }
    }, 450);
  };

  const handleAccept = () => {
    onAccept(draft);
    setPhase('idle');
    setDraft('');
  };

  const handleDiscard = () => {
    setPhase('idle');
    setDraft('');
  };

  // ── idle: just the trigger button ──────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <button
        type="button"
        onClick={runGenerate}
        disabled={disabled}
        title="Generate an AI draft for clinician review"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 hover:bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-3 h-3" />
        AI Draft
      </button>
    );
  }

  // ── generating: animated dots ────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-500 px-2 py-0.5">
        <span className="flex gap-0.5 items-center">
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
        Drafting…
      </span>
    );
  }

  // ── review: editable draft card ──────────────────────────────────────────
  const lineCount = (draft.match(/\n/g) || []).length + 1;
  const rows = Math.min(12, Math.max(3, lineCount + 1));

  return (
    <div className="mt-2 mb-2 border border-violet-300 bg-violet-50 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 border-b border-violet-200">
        <Sparkles className="w-3 h-3 text-violet-600 shrink-0" />
        <span className="text-[10px] font-bold text-violet-800 flex-1">
          AI Draft{fieldName ? ` — ${fieldName}` : ''}
          <span className="ml-1 font-normal text-violet-600">· Clinician review &amp; edit required before accepting</span>
        </span>
        <button
          type="button"
          onClick={runGenerate}
          className="text-[10px] text-violet-500 hover:text-violet-700 flex items-center gap-0.5 shrink-0"
        >
          <RotateCcw className="w-3 h-3" /> Regenerate
        </button>
      </div>

      {/* Editable draft */}
      <div className="p-3">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={rows}
          className="w-full text-xs border border-violet-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:border-violet-400 leading-relaxed"
        />

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors"
          >
            <Check className="w-3 h-3" /> Accept Draft
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
          >
            <X className="w-3 h-3" /> Discard
          </button>
          <span className="text-[10px] text-violet-400 italic ml-1">Edit draft above before accepting if needed</span>
        </div>
      </div>
    </div>
  );
}
