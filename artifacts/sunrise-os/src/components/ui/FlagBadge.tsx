import React from 'react';
import { FlagType } from '../../data/mockPatients';

interface FlagBadgeProps {
  type: FlagType;
  note?: string;
  size?: 'sm' | 'md';
}

export function FlagBadge({ type, note, size = 'sm' }: FlagBadgeProps) {
  const config: Record<FlagType, { color: string; label: string }> = {
    Medical: { color: 'bg-critical', label: 'Medical Alert' },
    Behavioral: { color: 'bg-sunrise-orange', label: 'Behavioral Concern' },
    Legal: { color: 'bg-sunrise-amber', label: 'Legal/Court' },
    Insurance: { color: 'bg-sunrise-blue', label: 'Insurance/Financial' },
    Success: { color: 'bg-success', label: 'Success/Milestone' },
    Psychiatric: { color: 'bg-purple', label: 'Psychiatric' },
    AMA: { color: 'bg-navy-mid', label: 'AMA Risk' },
    Medication: { color: 'bg-teal', label: 'Medication' },
  };

  const c = config[type];
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="group relative inline-flex items-center">
      <div className={`${dim} ${c.color} rounded-sm shadow-sm border border-black/10`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max max-w-[200px] p-2 bg-navy text-white text-xs rounded shadow-lg">
        <div className="font-semibold">{c.label}</div>
        {note && <div className="text-white/80 mt-1">{note}</div>}
      </div>
    </div>
  );
}
