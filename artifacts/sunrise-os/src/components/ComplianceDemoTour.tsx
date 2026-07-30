import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  /** Which WF tab must be active for this step */
  tab: string;
}

/**
 * Ordered steps for the Compliance module demo tour.
 * Step index 2 ("Open a Gap Row") targets the first open gap row in the
 * requirements list — the host page adds id="tour-first-gap-row" to that
 * element only while the tour is active.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-compliance-score-card',
    title: 'Live Compliance Audit Score',
    description: 'This card shows your real-time audit readiness score — how many regulatory requirements across all six frameworks are met, remediated, or still open. The sparkline tracks improvement over time.',
    tab: 'Dashboard',
  },
  {
    targetId: 'tour-standards-rings',
    title: 'Per-Standard Readiness Rings',
    description: 'Each ring shows readiness for one regulatory framework — CARF, HIPAA, 42 CFR Part 2, MD OHCQ, Medicaid, and Internal Policy. Click any ring to filter the requirements list to just that framework.',
    tab: 'Compliance Standards',
  },
  {
    targetId: 'tour-first-gap-row',
    title: 'Open a Gap Row',
    description: 'This row is an open compliance gap. Click it to expand the detail panel, then link evidence and save a corrective action plan. Filing both instantly counts the item toward your audit score.',
    tab: 'Compliance Standards',
  },
  {
    targetId: 'tour-gap-export',
    title: 'Export & Print Gap List',
    description: 'Export your open gaps as a CSV or print a formatted PDF. Use this to share your remediation plan with auditors, distribute action items to department heads, or track progress in a spreadsheet.',
    tab: 'Compliance Standards',
  },
];
interface Props {
  steps: TourStep[];
  step: number;
  visitedSteps: Set<number>;
  onNext: () => void;
  onPrev: () => void;
  onEnd: () => void;
  onGoTo: (index: number) => void;
}

const PAD = 10;

export function ComplianceDemoTour({ steps, step, visitedSteps, onNext, onPrev, onEnd, onGoTo }: Props) {
  const current = steps[step];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 200, left: 200 });

  // Keyboard navigation: → / Space = next, ← = prev, Esc = end
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (step < steps.length - 1) onNext(); else onEnd();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) onPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEnd();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, steps.length, onNext, onPrev, onEnd]);

  useEffect(() => {
    setRect(null); // clear stale highlight while switching

    // Give React time to render the newly-switched tab before measuring.
    // Retry up to 3 times (at 400 ms intervals) in case filters/expansion
    // haven't settled yet when the step first mounts.
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    const tryMeasure = () => {
      const el = document.getElementById(current.targetId);
      if (!el) {
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryMeasure, 400);
        }
        // After max attempts, leave rect null — card will render centred.
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for scrollIntoView to settle, then measure
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect(r);

        // Prefer placing the card below; fall back above if it would clip the viewport
        const cardH = 220;
        const cardW = 340;
        const spaceBelow = window.innerHeight - r.bottom - 20;
        const top = spaceBelow >= cardH
          ? r.bottom + 14
          : Math.max(12, r.top - cardH - 14);

        const left = Math.max(12, Math.min(r.left, window.innerWidth - cardW - 12));
        setCardPos({ top, left });
      }, 300);
    };

    // Small initial delay so React's tab-switch render + filter reset settle
    const initialTimer = setTimeout(tryMeasure, 350);

    const onResize = () => { setRect(null); setTimeout(tryMeasure, 100); };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [current.targetId, step]);

  return (
    <>
      {/* ── Full-screen dim layer ── */}
      <div
        className="fixed inset-0 z-[900] pointer-events-none"
        style={{ backgroundColor: 'rgba(15, 30, 60, 0.62)' }}
      />

      {/* ── Spotlight ring around the target element ── */}
      {rect && (
        <div
          className="fixed z-[901] rounded-2xl pointer-events-none"
          style={{
            top:    rect.top    - PAD,
            left:   rect.left   - PAD,
            width:  rect.width  + PAD * 2,
            height: rect.height + PAD * 2,
            /* The large box-shadow creates the "rest of screen is dimmed" cutout */
            boxShadow: '0 0 0 9999px rgba(15, 30, 60, 0.62)',
            border: '2.5px solid #f97316',
            transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
          }}
        />
      )}

      {/* ── Floating callout card ── */}
      <div
        className="fixed z-[902] bg-white rounded-2xl shadow-2xl border border-orange/30 p-5 w-[340px]"
        style={{
          top:  cardPos.top,
          left: cardPos.left,
          transition: 'top 0.3s ease, left 0.3s ease',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-orange uppercase tracking-widest">
            Demo Tour &nbsp;·&nbsp; Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={onEnd}
            className="text-slate hover:text-navy transition-colors"
            title="End tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots — click to jump to any step */}
        <div className="flex items-center gap-2 mb-3">
          {steps.map((s, i) => {
            const isCurrent = i === step;
            const isVisited = visitedSteps.has(i) && !isCurrent;
            if (isCurrent) {
              return (
                <button
                  key={i}
                  onClick={() => onGoTo(i)}
                  title={s.title}
                  aria-label={`Go to step ${i + 1}: ${s.title} (current)`}
                  className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
                  style={{ width: 20, height: 8, background: '#f97316', flexShrink: 0 }}
                />
              );
            }
            if (isVisited) {
              return (
                <button
                  key={i}
                  onClick={() => onGoTo(i)}
                  title={s.title}
                  aria-label={`Go to step ${i + 1}: ${s.title} (visited)`}
                  className="rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 hover:scale-125"
                  style={{ width: 16, height: 16, background: '#f97316', flexShrink: 0 }}
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                title={s.title}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 hover:scale-125"
                style={{ width: 8, height: 8, background: '#e5e7eb', flexShrink: 0 }}
              />
            );
          })}
        </div>

        <h3 className="text-[15px] font-bold text-navy mb-1.5 leading-tight">
          {current.title}
        </h3>
        <p className="text-sm text-slate leading-relaxed mb-5">
          {current.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onEnd}
            className="text-xs text-slate hover:text-navy transition-colors"
          >
            End Tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg text-slate hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />Prev
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors font-medium"
              >
                Next<ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onEnd}
                className="px-4 py-1.5 text-sm bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
              >
                ✓ Finish Tour
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hint row */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-center">
          <span className="text-[10px] text-gray-400 tracking-wide select-none">
            ← Prev &nbsp;·&nbsp; → Next &nbsp;·&nbsp; Esc End
          </span>
        </div>
      </div>
    </>
  );
}
