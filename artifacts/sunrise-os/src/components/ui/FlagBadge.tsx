import React from 'react';
import { FlagType } from '../../data/mockPatients';

export const FLAG_CONFIG: Record<FlagType, { dotColor: string; label: string; textColor: string }> = {
  Medical:    { dotColor: 'bg-critical',       label: 'Medical Alert',          textColor: 'text-red-700'    },
  Risk:       { dotColor: 'bg-red-700',         label: 'Risk Alert',             textColor: 'text-red-800'    },
  AMA:        { dotColor: 'bg-navy-mid',        label: 'AMA Risk',               textColor: 'text-slate-700'  },
  Behavioral: { dotColor: 'bg-sunrise-orange',  label: 'Behavioral Concern',     textColor: 'text-orange-700' },
  Psychiatric:{ dotColor: 'bg-purple',          label: 'Psychiatric',            textColor: 'text-purple-700' },
  Medication: { dotColor: 'bg-teal',            label: 'Medication',             textColor: 'text-teal-700'   },
  Legal:      { dotColor: 'bg-sunrise-amber',   label: 'Legal / Court',          textColor: 'text-amber-700'  },
  Insurance:  { dotColor: 'bg-sunrise-blue',    label: 'Insurance / Financial',  textColor: 'text-blue-700'   },
  Success:    { dotColor: 'bg-success',         label: 'Success / Milestone',    textColor: 'text-green-700'  },
};

interface FlagBadgeProps {
  type: FlagType;
  note?: string;
  /** sm / md = colored square dot (tooltip on hover)
   *  pill = labeled pill — used in chart header */
  variant?: 'sm' | 'md' | 'pill';
  /** @deprecated use variant */
  size?: 'sm' | 'md';
}

export function FlagBadge({ type, note, variant, size = 'sm' }: FlagBadgeProps) {
  const c = FLAG_CONFIG[type];
  const mode = variant ?? size;

  if (mode === 'pill') {
    return (
      <div className="group relative inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-2.5 py-0.5 cursor-default">
        <div className={`w-2 h-2 rounded-sm shrink-0 ${c.dotColor}`} />
        <span className="text-white text-xs font-semibold whitespace-nowrap">{c.label}</span>
        {note && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max max-w-[220px] p-2.5 bg-navy text-white text-xs rounded-lg shadow-xl">
            {note}
          </div>
        )}
      </div>
    );
  }

  const dim = mode === 'md' ? 'w-3 h-3' : 'w-2 h-2';
  return (
    <div className="group relative inline-flex items-center">
      <div className={`${dim} ${c.dotColor} rounded-sm shadow-sm border border-black/10`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max max-w-[200px] p-2 bg-navy text-white text-xs rounded shadow-lg">
        <div className="font-semibold">{c.label}</div>
        {note && <div className="text-white/80 mt-1">{note}</div>}
      </div>
    </div>
  );
}
