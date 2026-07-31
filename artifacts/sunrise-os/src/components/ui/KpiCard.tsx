/**
 * KpiCard — enriched KPI tile for the clinical Dashboard.
 *
 * Designed to satisfy:
 *  • Trend indicator: icon + text (never color alone)
 *  • Comparison period label (visible or via accessible tooltip)
 *  • Operational interpretation label (symbol + text)
 *  • Info tooltip: what the metric is, how it is calculated, comparison period
 *  • Specific action button (absent when user lacks permission)
 *  • Consistent height across all cards (flex-col + flex-1 spacer)
 *  • No nested interactive element inside a clickable wrapper — the card
 *    is not itself clickable; only the explicit action button is.
 */

import React, { useState, useId } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'flat' | 'unavailable';
export type KpiInterpretation =
  | 'favorable'
  | 'needs-attention'
  | 'neutral'
  | 'within-range'
  | 'insufficient-context';

export interface KpiTrend {
  /** Direction of change vs the comparison period. */
  direction: TrendDirection;
  /** Human-readable trend sentence, e.g. "Up 2 from previous 7 days". */
  text: string;
  /** Comparison window label, e.g. "Previous 7 days". */
  period: string;
  /** Operational meaning of this trend for this specific metric. */
  interpretation: KpiInterpretation;
}

export interface KpiCardProps {
  /** Short metric label shown at the top (uppercased internally). */
  label: string;
  /** Full tooltip text explaining the metric, calculation, and comparison. */
  tooltipText: string;
  /** Primary value to display (e.g. "18/22", "4", "18.4"). */
  value: string | number;
  /** Optional small unit suffix shown inline after the value (e.g. "days"). */
  valueUnit?: string;
  /** Trend data. Omitting shows "Comparison unavailable". */
  trend?: KpiTrend;
  /** Colour theme. Defaults to 'blue'. */
  color?: 'orange' | 'red' | 'amber' | 'blue' | 'green' | 'purple';
  /**
   * Specific action the card exposes. When absent the card is non-interactive
   * (no cursor, no hover state) — this satisfies the permission-restricted
   * non-clickable requirement.
   */
  action?: { label: string; onClick: () => void };
}

// ── Config maps ───────────────────────────────────────────────────────────────

const COLOR_CFG = {
  orange: { border: 'border-orange-200', label: 'text-orange-600', value: 'text-orange-700', bar: 'bg-orange-400' },
  red:    { border: 'border-red-200',    label: 'text-red-500',    value: 'text-red-700',    bar: 'bg-red-500'    },
  amber:  { border: 'border-amber-200',  label: 'text-amber-600',  value: 'text-amber-700',  bar: 'bg-amber-400'  },
  blue:   { border: 'border-blue-200',   label: 'text-blue-600',   value: 'text-blue-700',   bar: 'bg-blue-500'   },
  green:  { border: 'border-green-200',  label: 'text-green-600',  value: 'text-green-700',  bar: 'bg-green-500'  },
  purple: { border: 'border-purple-200', label: 'text-purple-600', value: 'text-purple-700', bar: 'bg-purple-500' },
} as const;

/** Icon component per direction. Unavailable has no icon. */
const TREND_ICON: Partial<Record<TrendDirection, React.ElementType>> = {
  up:   TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/** Screen-reader prefix for the trend aria-label. */
const TREND_ARIA: Record<TrendDirection, string> = {
  up:          'Increasing —',
  down:        'Decreasing —',
  flat:        'No meaningful change —',
  unavailable: 'Comparison unavailable',
};

const INTERP_CFG: Record<KpiInterpretation, { symbol: string; label: string; text: string; bg: string }> = {
  'favorable':            { symbol: '✓', label: 'Favorable',             text: 'text-green-700', bg: 'bg-green-50 border-green-200'  },
  'needs-attention':      { symbol: '⚠', label: 'Needs attention',       text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200'  },
  'neutral':              { symbol: '●', label: 'Neutral',               text: 'text-slate-500', bg: 'bg-slate-50 border-slate-200'  },
  'within-range':         { symbol: '◎', label: 'Within expected range',  text: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200'    },
  'insufficient-context': { symbol: '?', label: 'Insufficient context',   text: 'text-slate-400', bg: 'bg-slate-50 border-slate-100'  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function KpiCard({
  label,
  tooltipText,
  value,
  valueUnit,
  trend,
  color = 'blue',
  action,
}: KpiCardProps) {
  const [showTip, setShowTip] = useState(false);
  const tipId = useId();
  const c = COLOR_CFG[color];

  const TrendIcon = trend ? TREND_ICON[trend.direction] : undefined;
  const interpCfg = trend?.interpretation ? INTERP_CFG[trend.interpretation] : undefined;
  const isUnavailable = !trend || trend.direction === 'unavailable';

  return (
    <div
      className={`relative flex flex-col h-full bg-white border ${c.border} rounded-xl p-4`}
      /* Card itself is NOT interactive — avoids nested-button antipattern */
    >
      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bar} opacity-40`} aria-hidden="true" />

      {/* ① KPI label + info button ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest leading-tight ${c.label}`}>
          {label}
        </span>

        {/* Info tooltip trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={`About ${label}`}
            aria-expanded={showTip}
            aria-controls={tipId}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 transition-colors"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
          >
            <Info className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Tooltip popover */}
          {showTip && (
            <div
              id={tipId}
              role="tooltip"
              className="absolute right-0 bottom-full mb-2 w-60 bg-navy text-white text-[11px] leading-relaxed rounded-lg p-3 shadow-xl z-50 pointer-events-none"
            >
              {tooltipText}
              {/* Caret */}
              <div
                className="absolute right-2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-navy"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </div>

      {/* ③ Current value ─────────────────────────────────────────────────────── */}
      <div className={`text-3xl font-extrabold ${c.value} leading-none mb-2 flex items-baseline gap-1`}>
        {value}
        {valueUnit && (
          <span className="text-sm font-semibold opacity-70">{valueUnit}</span>
        )}
      </div>

      {/* ④ Trend indicator (icon + text — not color alone) ───────────────────── */}
      {isUnavailable ? (
        <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5">
          <span aria-hidden="true">—</span>
          <span>Comparison unavailable</span>
        </p>
      ) : (
        <>
          <p
            className="text-[11px] text-slate-600 flex items-center gap-1 leading-snug mb-0.5"
            aria-label={`${TREND_ARIA[trend!.direction]} ${trend!.text}`}
          >
            {TrendIcon && <TrendIcon className="w-3 h-3 shrink-0" aria-hidden="true" />}
            <span>{trend!.text}</span>
          </p>

          {/* ⑤ Comparison period label ─────────────────────────────────────── */}
          <p className="text-[10px] text-slate-400 mb-1.5">{trend!.period}</p>
        </>
      )}

      {/* ⑥ Operational interpretation ────────────────────────────────────────── */}
      {interpCfg && !isUnavailable && (
        <div
          className={`inline-flex items-center gap-1 self-start text-[10px] font-semibold px-1.5 py-0.5 rounded border mb-2 ${interpCfg.text} ${interpCfg.bg}`}
          aria-label={`Trend interpretation: ${interpCfg.label}`}
        >
          <span aria-hidden="true">{interpCfg.symbol}</span>
          <span>{interpCfg.label}</span>
        </div>
      )}

      {/* Spacer — pushes action to the bottom for consistent card height */}
      <div className="flex-1" aria-hidden="true" />

      {/* ⑦ Action button (absent = non-clickable, permission-restricted) ──────── */}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 w-full text-left text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy flex items-center justify-between"
        >
          <span>{action.label}</span>
          <span aria-hidden="true" className="text-slate-400 font-bold">›</span>
        </button>
      ) : (
        /* Fixed-height placeholder maintains card alignment when no action */
        <div className="mt-2 h-[30px]" aria-hidden="true" />
      )}
    </div>
  );
}
