/**
 * DemoBanner — always-visible, non-dismissible safety notice.
 *
 * Spec requirement: "An always-visible orange 'Fictitious Data Only —
 * Not for Clinical Use' banner appears across every screen."
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  return (
    <div
      className="h-[var(--banner-height)] w-full fixed top-0 left-0 z-50 flex items-center justify-center gap-2 px-4 shrink-0"
      style={{
        background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 50%, #c2410c 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.18)',
      }}
      role="banner"
      aria-label="Demo environment notice — fictitious data only"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-white/90 shrink-0" aria-hidden />
      <span className="text-white text-[11px] font-semibold tracking-wide uppercase select-none">
        Demo Mode &nbsp;·&nbsp; Fictitious Data Only &nbsp;—&nbsp; Not for Clinical Use
      </span>
    </div>
  );
}
