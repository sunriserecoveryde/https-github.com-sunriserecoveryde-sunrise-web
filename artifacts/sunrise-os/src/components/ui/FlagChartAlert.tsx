import React from 'react';
import { Flag } from '../../data/mockPatients';
import { FLAG_CONFIG } from './FlagBadge';
import { X, Flag as FlagIcon, ShieldAlert, Edit3 } from 'lucide-react';

interface Props {
  patientName: string;
  flags: Flag[];
  amaRisk: 'High' | 'Med' | 'Low';
  onClose: () => void;
  onEdit: () => void;
}

export function FlagChartAlert({ patientName, flags, amaRisk, onClose, onEdit }: Props) {
  const amaStyle = {
    High: { bg: 'bg-red-50',    border: 'border-red-300',  text: 'text-red-700',    icon: 'text-red-600',    label: 'HIGH',   detail: 'Client has expressed intent to leave. Coordinate with treatment team immediately.' },
    Med:  { bg: 'bg-amber-50',  border: 'border-amber-200',text: 'text-amber-700',  icon: 'text-amber-600',  label: 'MODERATE', detail: 'Monitor for signs of premature departure. Engage therapeutically.' },
    Low:  { bg: 'bg-slate-50',  border: 'border-slate-200',text: 'text-slate-600',  icon: 'text-slate-400',  label: 'LOW',    detail: 'No current AMA concerns documented.' },
  }[amaRisk];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-mid px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-critical/20 border border-critical/30 flex items-center justify-center shrink-0">
            <FlagIcon className="w-4 h-4 text-critical" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm">Chart Alert — Active Flags</div>
            <div className="text-slate-300 text-xs truncate">{patientName}</div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {/* AMA Risk row — always shown */}
          <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${amaStyle.bg} ${amaStyle.border}`}>
            <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${amaStyle.icon}`} />
            <div>
              <div className={`text-xs font-bold uppercase tracking-wide ${amaStyle.text}`}>
                AMA Risk — {amaStyle.label}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{amaStyle.detail}</div>
            </div>
          </div>

          {/* Clinical flags */}
          {flags.map((flag, i) => {
            const cfg = FLAG_CONFIG[flag.type];
            return (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className={`w-3 h-3 rounded-sm mt-0.5 shrink-0 ${cfg.dotColor}`} />
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${cfg.textColor}`}>{cfg.label}</div>
                  {flag.note
                    ? <div
                        className="text-xs text-slate-700 mt-0.5 rich-note"
                        dangerouslySetInnerHTML={{ __html: flag.note }}
                      />
                    : <div className="text-xs text-slate-400 mt-0.5 italic">No note added</div>}
                </div>
              </div>
            );
          })}

          {flags.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-2">No clinical flags — AMA risk displayed above only.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-border flex items-center justify-between">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-semibold text-sunrise-orange hover:text-sunrise-orange/80 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Flags
          </button>
          <button
            onClick={onClose}
            data-testid="chart-alert-acknowledge"
            className="bg-navy text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-navy-mid transition-colors"
          >
            Acknowledge &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
