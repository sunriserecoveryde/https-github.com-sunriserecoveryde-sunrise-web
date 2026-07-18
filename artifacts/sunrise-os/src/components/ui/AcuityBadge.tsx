import React from 'react';
import { Acuity } from '../../data/mockPatients';

export function AcuityBadge({ acuity }: { acuity: Acuity | string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-critical-bg text-critical border-critical/20',
    High: 'bg-high-bg text-high border-high/20',
    Moderate: 'bg-moderate-bg text-moderate border-moderate/20',
    Routine: 'bg-routine-bg text-routine border-routine/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[acuity] || styles.Routine}`}>
      {acuity}
    </span>
  );
}
