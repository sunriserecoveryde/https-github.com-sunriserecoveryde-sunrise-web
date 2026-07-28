import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function InactivityModal({ secondsRemaining, onExtend, onLogout }: Props) {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const label = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`;

  const pct = Math.min(100, (secondsRemaining / 120) * 100);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactivity-title"
      >
        {/* Countdown bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-sunrise-orange transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>

          <h2 id="inactivity-title" className="text-lg font-bold text-navy mb-1">
            Session Expiring
          </h2>
          <p className="text-sm text-slate mb-4">
            Your demo session will end due to inactivity in
          </p>

          <div className="text-4xl font-mono font-extrabold text-sunrise-orange mb-5 tabular-nums">
            {label}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button
              onClick={onExtend}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sunrise-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow"
            >
              <RefreshCw className="w-4 h-4" />
              Stay Logged In
            </button>
          </div>

          <p className="text-[10px] text-slate mt-4">
            Demo mode — Fictitious data only · Not for clinical use
          </p>
        </div>
      </div>
    </div>
  );
}
