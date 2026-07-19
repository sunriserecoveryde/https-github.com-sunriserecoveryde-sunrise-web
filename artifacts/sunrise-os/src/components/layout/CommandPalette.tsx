import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, LayoutDashboard, FileText, Activity, DollarSign, Users, Calendar, AlertTriangle } from 'lucide-react';
import { Screen } from '../../App';
import { MOCK_PATIENTS } from '../../data/mockPatients';

interface Props {
  onClose: () => void;
  navigate: (s: Screen, patientId?: string) => void;
}

interface SearchResult {
  type: 'patient' | 'screen' | 'action';
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
}

const SCREEN_SHORTCUTS: { label: string; screen: Screen; icon: React.ReactNode; category: string }[] = [
  { label: 'Dashboard', screen: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Overview' },
  { label: 'Command Center', screen: 'CommandCenter', icon: <Activity className="w-4 h-4" />, category: 'Overview' },
  { label: 'Census & Bed Board', screen: 'CensusBedBoard', icon: <Users className="w-4 h-4" />, category: 'Clinical' },
  { label: 'Patient List', screen: 'PatientList', icon: <User className="w-4 h-4" />, category: 'Clinical' },
  { label: 'Admissions / Intake', screen: 'Admissions', icon: <User className="w-4 h-4" />, category: 'Clinical' },
  { label: 'Discharges', screen: 'Discharges', icon: <User className="w-4 h-4" />, category: 'Clinical' },
  { label: 'Progress Notes', screen: 'ProgressNotes', icon: <FileText className="w-4 h-4" />, category: 'Documentation' },
  { label: 'Treatment Plans', screen: 'TreatmentPlans', icon: <FileText className="w-4 h-4" />, category: 'Documentation' },
  { label: 'Chart Review', screen: 'ChartReview', icon: <FileText className="w-4 h-4" />, category: 'Documentation' },
  { label: 'Co-sign Queue', screen: 'CosignQueue', icon: <FileText className="w-4 h-4" />, category: 'Documentation' },
  { label: 'ASAM Assessments', screen: 'ASAMAssessments', icon: <Activity className="w-4 h-4" />, category: 'Documentation' },
  { label: 'Group Notes', screen: 'GroupNotes', icon: <FileText className="w-4 h-4" />, category: 'Documentation' },
  { label: 'Appointment Calendar', screen: 'AppointmentCalendar', icon: <Calendar className="w-4 h-4" />, category: 'Scheduling' },
  { label: 'Group Schedule', screen: 'GroupSchedule', icon: <Calendar className="w-4 h-4" />, category: 'Scheduling' },
  { label: 'Staff Scheduling', screen: 'StaffScheduling', icon: <Calendar className="w-4 h-4" />, category: 'Scheduling' },
  { label: 'Risk Dashboard', screen: 'RiskDashboard', icon: <AlertTriangle className="w-4 h-4" />, category: 'Risk & Outcomes' },
  { label: 'Recovery Engagement Score', screen: 'RecoveryEngagementScore', icon: <Activity className="w-4 h-4" />, category: 'Risk & Outcomes' },
  { label: 'Outcome Tracking', screen: 'OutcomeTracking', icon: <Activity className="w-4 h-4" />, category: 'Risk & Outcomes' },
  { label: 'UA / Drug Testing', screen: 'UADrugTesting', icon: <Activity className="w-4 h-4" />, category: 'Risk & Outcomes' },
  { label: 'Incident Reports', screen: 'IncidentReporting', icon: <AlertTriangle className="w-4 h-4" />, category: 'Risk & Outcomes' },
  { label: 'Referral Tracker', screen: 'ReferralTracker', icon: <Users className="w-4 h-4" />, category: 'Operations' },
  { label: 'Business Development', screen: 'BusinessDevelopment', icon: <Users className="w-4 h-4" />, category: 'Operations' },
  { label: 'Bed Management', screen: 'BedManagement', icon: <Users className="w-4 h-4" />, category: 'Operations' },
  { label: 'Revenue Cycle', screen: 'RevenueCycle', icon: <DollarSign className="w-4 h-4" />, category: 'Billing' },
  { label: 'Audit Compliance', screen: 'AuditCompliance', icon: <FileText className="w-4 h-4" />, category: 'Compliance' },
  { label: 'Training', screen: 'Training', icon: <Users className="w-4 h-4" />, category: 'Operations' },
  { label: 'Settings', screen: 'Settings', icon: <LayoutDashboard className="w-4 h-4" />, category: 'System' },
  { label: 'Help & Support', screen: 'HelpSupport', icon: <LayoutDashboard className="w-4 h-4" />, category: 'System' },
];

export function CommandPalette({ onClose, navigate }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = (screen: Screen, patientId?: string) => { navigate(screen, patientId); onClose(); };

  const results: SearchResult[] = query.trim() === ''
    ? [
        // Default: recent/quick actions
        ...SCREEN_SHORTCUTS.slice(0, 6).map(s => ({
          type: 'screen' as const,
          label: s.label,
          sublabel: s.category,
          icon: s.icon,
          action: () => go(s.screen),
        })),
      ]
    : [
        // Patient matches
        ...MOCK_PATIENTS.filter(p =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          p.mrn.toLowerCase().includes(query.toLowerCase()) ||
          p.primaryDiagnosis.toLowerCase().includes(query.toLowerCase()) ||
          p.program.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5).map(p => ({
          type: 'patient' as const,
          label: `${p.firstName} ${p.lastName}`,
          sublabel: `${p.mrn} · ${p.program} · ${p.primaryDiagnosis.split(' ').slice(0, 4).join(' ')}`,
          icon: (
            <div className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
              {p.firstName[0]}{p.lastName[0]}
            </div>
          ),
          action: () => go('PatientDetail', p.id),
        })),
        // Screen matches
        ...SCREEN_SHORTCUTS.filter(s =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6).map(s => ({
          type: 'screen' as const,
          label: s.label,
          sublabel: s.category,
          icon: s.icon,
          action: () => go(s.screen),
        })),
      ];

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { results[selected].action(); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-slate shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients, screens, or actions…"
            className="flex-1 text-sm focus:outline-none text-navy placeholder:text-slate"
          />
          <div className="flex items-center gap-2">
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-3.5 h-3.5 text-slate" />
              </button>
            )}
            <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-slate">Esc</kbd>
          </div>
        </div>

        <div ref={listRef} className="overflow-y-auto max-h-80">
          {query.trim() === '' && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-semibold text-slate uppercase tracking-wide">Quick Navigation</span>
            </div>
          )}
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate">No results for "{query}"</div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              onClick={r.action}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${i === selected ? 'bg-orange/10' : 'hover:bg-gray-50'}`}
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-slate">
                {r.type === 'patient' ? r.icon : <span className="text-slate">{r.icon}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-navy text-sm">{r.label}</div>
                {r.sublabel && <div className="text-xs text-slate truncate">{r.sublabel}</div>}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'patient' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-slate'}`}>
                  {r.type === 'patient' ? 'Patient' : 'Screen'}
                </span>
                {i === selected && <kbd className="text-xs bg-orange/20 text-orange border border-orange/30 rounded px-1">↵</kbd>}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-gray-50 flex items-center gap-4 text-xs text-slate">
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">↑↓</kbd> navigate</div>
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">↵</kbd> open</div>
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">Esc</kbd> close</div>
          <div className="ml-auto">20 patients · {SCREEN_SHORTCUTS.length} screens</div>
        </div>
      </div>
    </div>
  );
}
