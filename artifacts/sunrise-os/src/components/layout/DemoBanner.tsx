import React from 'react';
import sunriseLogo from '@assets/0_SunriseOS_Logo_1784397889924.png';

export function DemoBanner() {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div className="h-[var(--banner-height)] w-full bg-gradient-to-r from-violet-800 via-purple to-indigo-600 flex items-center px-4 fixed top-0 left-0 z-50 text-white shadow-md">
      {/* Left third — logo (mix-blend-mode:multiply removes the white PNG background) */}
      <div className="w-1/3 flex items-center">
        <img
          src={sunriseLogo}
          alt="Sunrise OS"
          className="h-9 w-auto object-contain"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      {/* Center — demo mode notice */}
      <div className="flex-1 flex items-center justify-center gap-2 text-xs font-medium">
        <span className="bg-white/25 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          Demo Mode
        </span>
        <span className="text-white/80 hidden sm:inline">Fictitious patient data only · Not for clinical use</span>
      </div>

      {/* Right third — exit */}
      <div className="w-1/3 flex items-center justify-end">
        <button
          onClick={() => setVisible(false)}
          className="text-xs text-white/70 hover:text-white hover:bg-white/15 px-3 py-1 rounded transition-colors"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
