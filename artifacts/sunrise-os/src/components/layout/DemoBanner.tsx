import React from 'react';

export function DemoBanner() {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div className="h-[var(--banner-height)] w-full bg-gradient-to-r from-violet-800 via-purple to-indigo-600 flex items-center justify-between px-4 fixed top-0 left-0 z-50 text-white shadow-sm">
      <div className="text-xs font-medium tracking-wide flex items-center gap-2">
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">DEMO MODE</span>
        Fictitious patient data only · Not for clinical use
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-xs text-white/70 hover:text-white hover:bg-white/15 px-2 py-1 rounded transition-colors"
      >
        Exit Demo
      </button>
    </div>
  );
}
