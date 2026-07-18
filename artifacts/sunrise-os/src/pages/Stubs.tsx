import React from 'react';
import { Screen } from '../App';

export function BedManagement({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border border-border">
      <h2 className="text-2xl font-bold text-navy">Bed Management</h2>
      <p className="text-slate mt-2">Operations view for housekeeping, maintenance, and detailed room tracking.</p>
    </div>
  );
}

export function AuditCompliance({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border border-border">
      <h2 className="text-2xl font-bold text-navy">Audit Readiness</h2>
      <p className="text-slate mt-2">CARF / Joint Commission compliance dashboard coming soon.</p>
    </div>
  );
}

export function OutcomeTracking({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border border-border">
      <h2 className="text-2xl font-bold text-navy">Outcome Tracking</h2>
      <p className="text-slate mt-2">Post-discharge outcomes, readmission rates, and ASAM improvement charts.</p>
    </div>
  );
}
