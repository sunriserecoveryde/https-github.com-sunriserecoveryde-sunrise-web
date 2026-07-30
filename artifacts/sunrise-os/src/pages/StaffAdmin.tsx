import React, { useState, useMemo } from 'react';
import {
  Search, Shield, User, Key, FileText, ClipboardList,
  CheckCircle, XCircle, AlertTriangle, ChevronDown,
  Save, RotateCcw, Clock, Activity, Pill, Receipt,
  BookOpen, BarChart2
} from 'lucide-react';
import { STAFF_MEMBERS, StaffMember, StaffAccessFlags, ReportAccess } from '../data/mockStaff';
import { getRoleById, getPermission, ROLES, Permission } from '../data/mockRoles';
import {
  getScreenOverride, setScreenOverride, clearScreenOverride, getAllScreenOverrides,
  getStaffFlags, setStaffFlag, getFlagOverrides, appendAudit, getAuditLog, AuditEntry
} from '../data/permissionStore';
import type { Screen } from '../App';

// ─── Screen label map ─────────────────────────────────────────────────────────

const SCREEN_LABELS: Partial<Record<Screen, string>> = {
  Dashboard: 'Dashboard', CommandCenter: 'Command Center',
  CensusBedBoard: 'Census & Bed Board', PatientList: 'Patient List',
  Admissions: 'Admissions / Intake', ClinicalForms: 'Admissions Screening', Discharges: 'Discharges',
  MATManagement: 'MAT Management', FamilyEngagement: 'Family Engagement',
  PhysicianOrders: 'Physician Orders', PeerSupport: 'Peer Support Program',
  TelehealthConsults: 'Telehealth Consults', ChartReview: 'Chart Review',
  ProgressNotes: 'Progress Notes', TreatmentPlans: 'Treatment Plans',
  ASAMAssessments: 'ASAM Assessments', BiopsychosocialAssessment: 'Biopsychosocial Intake',
  DischargeSummary: 'Discharge Summary', MedicalRecords: 'Medical Records / ROI',
  GroupNotes: 'Group Notes', CosignQueue: 'Co-sign Queue',
  MyCaseload: 'My Caseload', AppointmentCalendar: 'Appointment Calendar',
  GroupSchedule: 'Group Schedule', GroupTherapyCurriculum: 'Group Curriculum Library',
  StaffScheduling: 'Staff Scheduling', RiskDashboard: 'Risk Dashboard',
  RecoveryEngagementScore: 'Recovery Engagement Score', OutcomeTracking: 'Outcome Tracking',
  PopulationAnalytics: 'Population Analytics', UADrugTesting: 'UA / Drug Testing',
  IncidentReporting: 'Incident Reports', CrisisAssessment: 'Crisis Assessment (C-SSRS)',
  NursingMAR: 'Medication MAR', ShiftHandoff: 'Shift Handoff',
  ReferralTracker: 'Referral Tracker', WaitlistManager: 'Waitlist Manager',
  BusinessDevelopment: 'Business Development', BedManagement: 'Bed Management',
  InsuranceAuthorization: 'Insurance Auth / UR', AftercarePlanning: 'Aftercare Planning',
  AlumniProgram: 'Alumni Program', RevenueCycle: 'Revenue Cycle',
  FinancialCounseling: 'Financial Counseling', AuditCompliance: 'Audit Readiness',
  QualityImprovement: 'Quality Improvement', Training: 'Training',
  FormularyManagement: 'Formulary & Drug Reference', ClinicalSupervision: 'Clinical Supervision',
  CertificationTracker: 'Certification Tracker', SecureMessaging: 'Secure Messaging',
  StaffAdmin: 'Staff Administration', Settings: 'Settings', HelpSupport: 'Help & Support',
};

const SCREEN_SECTIONS: { title: string; screens: Screen[] }[] = [
  { title: 'Overview', screens: ['Dashboard', 'CommandCenter'] },
  { title: 'Scheduling, Intake & Admissions', screens: ['Admissions', 'ClinicalForms', 'WaitlistManager', 'ReferralTracker', 'AppointmentCalendar', 'GroupSchedule', 'StaffScheduling'] },
  { title: 'Clinical', screens: ['CensusBedBoard', 'PatientList', 'Discharges', 'MATManagement', 'FamilyEngagement', 'PhysicianOrders', 'PeerSupport', 'TelehealthConsults'] },
  { title: 'Documentation', screens: ['ChartReview', 'ProgressNotes', 'TreatmentPlans', 'ASAMAssessments', 'BiopsychosocialAssessment', 'DischargeSummary', 'MedicalRecords', 'GroupNotes', 'GroupTherapyCurriculum', 'CosignQueue', 'MyCaseload'] },
  { title: 'Risk & Outcomes', screens: ['RiskDashboard', 'RecoveryEngagementScore', 'OutcomeTracking', 'PopulationAnalytics', 'UADrugTesting', 'IncidentReporting', 'CrisisAssessment'] },
  { title: 'Nursing', screens: ['NursingMAR', 'ShiftHandoff'] },
  { title: 'Operations', screens: ['BusinessDevelopment', 'BedManagement', 'InsuranceAuthorization', 'AftercarePlanning', 'AlumniProgram'] },
  { title: 'Billing & Compliance', screens: ['RevenueCycle', 'FinancialCounseling', 'AuditCompliance', 'QualityImprovement', 'Training', 'FormularyManagement'] },
  { title: 'Supervision', screens: ['ClinicalSupervision', 'CertificationTracker'] },
  { title: 'Communications', screens: ['SecureMessaging'] },
  { title: 'Administration', screens: ['StaffAdmin', 'Settings', 'HelpSupport'] },
];

type PermTab = 'profile' | 'permissions' | 'access' | 'audit';
type OverrideValue = Permission | 'default';

function permChip(p: Permission) {
  if (p === 'full') return <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-green-100 text-green-700">Full</span>;
  if (p === 'read') return <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">Read</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500">None</span>;
}

const STATUS_CERT: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', cls: 'bg-red-100 text-red-700' },
  'pending-renewal': { label: 'Renewal Due', cls: 'bg-amber-100 text-amber-700' },
};

// ─── Expiry helpers ────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const exp = new Date(dateStr);
  const now = new Date('2026-07-22');
  return Math.ceil((exp.getTime() - now.getTime()) / 86400000);
}

function expiryLabel(dateStr: string): React.ReactNode {
  const d = daysUntil(dateStr);
  if (d < 0) return <span className="text-red-600 font-semibold">Expired {Math.abs(d)}d ago</span>;
  if (d <= 90) return <span className="text-amber-600 font-semibold">Expires in {d}d</span>;
  return <span className="text-slate-500">{dateStr}</span>;
}

// ─── Radio component ──────────────────────────────────────────────────────────

function Radio({ name, value, checked, onChange, label, color }: {
  name: string; value: string; checked: boolean;
  onChange: () => void; label: string; color?: string;
}) {
  return (
    <label className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-colors ${checked ? (color ?? 'bg-sunrise-blue/10') : 'hover:bg-slate-50'}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-sunrise-blue" />
      <span className={`text-xs font-medium ${checked ? 'text-navy' : 'text-slate-500'}`}>{label}</span>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { navigate: (s: Screen) => void }

export function StaffAdmin({ navigate: _navigate }: Props) {
  const [selectedId, setSelectedId] = useState<string>(STAFF_MEMBERS[0].id);
  const [activeTab, setActiveTab] = useState<PermTab>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Local override state (wraps permissionStore for reactive updates)
  const [overrideVersion, setOverrideVersion] = useState(0); // increment to force re-render
  const [flagVersion, setFlagVersion] = useState(0);
  const [auditVersion, setAuditVersion] = useState(0);

  const staff = STAFF_MEMBERS;
  const selected = staff.find(s => s.id === selectedId)!;
  const role = getRoleById(selected.roleId);

  const departments = useMemo(() => {
    const depts = Array.from(new Set(staff.map(s => s.department))).sort();
    return ['All', ...depts];
  }, []);

  const filteredStaff = staff.filter(s => {
    const matchSearch = searchQuery === '' ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  // ── Stats bar ────────────────────────────────────────────────────────────
  const totalExpiring = staff.reduce((acc, s) => {
    return acc + s.certifications.filter(c => {
      if (c.status !== 'active') return false;
      const d = daysUntil(c.expiryDate);
      return d >= 0 && d <= 90;
    }).length;
  }, 0);
  const expiredCount = staff.reduce((acc, s) => acc + s.certifications.filter(c => c.status === 'expired').length, 0);

  // ── Per-staff helpers ────────────────────────────────────────────────────
  const getEffectivePerm = (staffId: string, screen: string): Permission => {
    const ov = getScreenOverride(staffId, screen);
    if (ov !== undefined) return ov;
    const s = staff.find(x => x.id === staffId)!;
    return getPermission(s.roleId, screen);
  };

  const getOverrideVal = (staffId: string, screen: string): OverrideValue => {
    const ov = getScreenOverride(staffId, screen);
    return ov ?? 'default';
  };

  const handlePermChange = (screen: string, value: OverrideValue) => {
    if (value === 'default') {
      clearScreenOverride(selected.id, screen);
    } else {
      const old = getEffectivePerm(selected.id, screen);
      setScreenOverride(selected.id, screen, value as Permission);
      if (old !== value) {
        appendAudit({
          timestamp: new Date().toLocaleString('sv-SE').slice(0, 16).replace('T', ' '),
          changedBy: 'Alex Kim',
          targetStaff: `${selected.firstName} ${selected.lastName}`,
          changeType: 'screen_permission',
          screen,
          oldValue: old,
          newValue: value as string,
        });
        setAuditVersion(v => v + 1);
      }
    }
    setOverrideVersion(v => v + 1);
  };

  const effectiveFlags = getStaffFlags(selected.id, selected.accessFlags);
  const flagOvs = getFlagOverrides(selected.id);

  const handleFlagChange = <K extends keyof StaffAccessFlags>(flag: K, value: StaffAccessFlags[K]) => {
    const old = effectiveFlags[flag];
    setStaffFlag(selected.id, flag, value);
    if (old !== value) {
      appendAudit({
        timestamp: new Date().toLocaleString('sv-SE').slice(0, 16).replace('T', ' '),
        changedBy: 'Alex Kim',
        targetStaff: `${selected.firstName} ${selected.lastName}`,
        changeType: 'access_flag',
        flag: flag as string,
        oldValue: typeof old === 'boolean' ? (old ? 'enabled' : 'disabled') : String(old),
        newValue: typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : String(value),
      });
      setAuditVersion(v => v + 1);
    }
    setFlagVersion(v => v + 1);
  };

  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000); }, 700);
  };

  const handleReset = () => {
    const overrides = getAllScreenOverrides(selected.id);
    Object.keys(overrides).forEach(s => clearScreenOverride(selected.id, s));
    Object.keys(getFlagOverrides(selected.id)).forEach(flag => {
      const k = flag as keyof StaffAccessFlags;
      setStaffFlag(selected.id, k, selected.accessFlags[k] as any);
    });
    setOverrideVersion(v => v + 1);
    setFlagVersion(v => v + 1);
  };

  const overrideCount = Object.keys(getAllScreenOverrides(selected.id)).length;
  const auditEntries = getAuditLog();

  // re-render triggers
  void overrideVersion; void flagVersion; void auditVersion;

  // ── Render ───────────────────────────────────────────────────────────────

  const TABS: { id: PermTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'permissions', label: `Permissions${overrideCount > 0 ? ` (${overrideCount})` : ''}`, icon: Key },
    { id: 'access', label: 'System Access', icon: Shield },
    { id: 'audit', label: 'Audit Log', icon: Clock },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 bg-white border border-border rounded-xl px-6 py-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">Total Staff</span>
          <span className="font-bold text-navy">{staff.length}</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-slate-500">Active</span>
          <span className="font-bold text-navy">{staff.filter(s => s.status === 'active').length}</span>
        </div>
        {totalExpiring > 0 && (
          <>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-slate-500">Certs Expiring Soon</span>
              <span className="font-bold text-amber-600">{totalExpiring}</span>
            </div>
          </>
        )}
        {expiredCount > 0 && (
          <>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-slate-500">Expired Certs</span>
              <span className="font-bold text-red-600">{expiredCount}</span>
            </div>
          </>
        )}
        <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          Security Administrator access
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Left: Staff list ─────────────────────────────────────────── */}
        <div className="w-64 shrink-0 bg-white border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sunrise-blue/40"
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${deptFilter === d ? 'bg-navy text-white border-navy' : 'text-slate-500 border-border hover:border-slate-300'}`}
                >
                  {d === 'All' ? 'All Departments' : d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredStaff.map(s => {
              const r = getRoleById(s.roleId);
              const isSelected = s.id === selectedId;
              const oc = Object.keys(getAllScreenOverrides(s.id)).length;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelectedId(s.id); setActiveTab('profile'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-border/50 transition-colors hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-r-2 border-r-sunrise-blue' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full ${s.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {s.photoInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-navy truncate">{s.firstName} {s.lastName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.title}</div>
                    {r && <div className={`text-[10px] font-medium ${r.textColor.replace('/20', '')} truncate`}>{r.shortLabel}</div>}
                  </div>
                  {oc > 0 && (
                    <span className="text-[9px] bg-sunrise-orange/20 text-sunrise-orange font-bold px-1 rounded shrink-0">{oc}</span>
                  )}
                  {s.status !== 'active' && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'on-leave' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Detail panel ─────────────────────────────────────── */}
        <div className="flex-1 bg-white border border-border rounded-xl overflow-hidden flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full ${selected.avatarBg} flex items-center justify-center text-white font-bold text-xl shadow`}>
                {selected.photoInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-navy">
                    {selected.firstName} {selected.lastName}
                    {selected.credentials.length > 0 && <span className="text-sm font-normal text-slate-500">, {selected.credentials.join(', ')}</span>}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selected.status === 'active' ? 'bg-green-100 text-green-700' :
                    selected.status === 'on-leave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selected.status === 'active' ? 'Active' : selected.status === 'on-leave' ? 'On Leave' : 'Inactive'}
                  </span>
                  {overrideCount > 0 && (
                    <span className="text-xs bg-sunrise-orange/15 text-sunrise-orange border border-sunrise-orange/30 px-2 py-0.5 rounded-full font-medium">
                      {overrideCount} override{overrideCount > 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500">{selected.title} &nbsp;·&nbsp; {selected.department}</div>
                {role && (
                  <div className={`mt-1 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${role.color} ${role.textColor} ${role.borderColor}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} />
                    {role.label}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {overrideCount > 0 && (
                  <button onClick={handleReset} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saveState !== 'idle'}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    saveState === 'saved' ? 'bg-green-500 text-white' :
                    saveState === 'saving' ? 'bg-navy/50 text-white' :
                    'bg-navy text-white hover:bg-navy-mid'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id
                      ? 'border-sunrise-blue text-navy'
                      : 'border-transparent text-slate-500 hover:text-navy hover:border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── PROFILE TAB ─────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Contact & identifiers */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Email', value: selected.email },
                        { label: 'Phone', value: selected.phone },
                        { label: 'Department', value: selected.department },
                        { label: 'Hire Date', value: selected.hireDate },
                        { label: 'Last Login', value: selected.lastLogin ?? 'Never' },
                      ].map(r => (
                        <div key={r.label} className="flex gap-3 text-sm">
                          <span className="w-24 text-slate-400 shrink-0">{r.label}</span>
                          <span className="text-navy font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Clinical Identifiers</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'NPI', value: selected.npi ?? '— Not assigned' },
                        { label: 'DEA Number', value: selected.deaNumber ?? '— Not assigned' },
                        { label: 'License #', value: selected.licenseNumber ?? '— Not assigned' },
                        { label: 'License State', value: selected.licenseState ?? '—' },
                        { label: 'License Type', value: selected.licenseType ?? '— Not applicable' },
                        { label: 'License Expiry', value: selected.licenseExpiry ? <>{expiryLabel(selected.licenseExpiry)}</> : '—' },
                      ].map(r => (
                        <div key={r.label} className="flex gap-3 text-sm">
                          <span className="w-28 text-slate-400 shrink-0">{r.label}</span>
                          <span className="text-navy font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                {selected.specializations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.specializations.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Certifications & Credentials</h3>
                  {selected.certifications.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 italic py-2"><span>📋</span> No certifications on file — add credentials via the Certification Tracker</div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-border">
                          <tr>
                            {['Certification', 'Issuing Body', 'Number', 'Issued', 'Expires', 'Status', 'CEU'].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selected.certifications.map((c, i) => {
                            const st = STATUS_CERT[c.status];
                            return (
                              <tr key={c.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                                <td className="px-3 py-2 font-medium text-navy">{c.name}</td>
                                <td className="px-3 py-2 text-slate-500 text-xs">{c.issuingBody}</td>
                                <td className="px-3 py-2 text-slate-400 text-xs font-mono">{c.number ?? '—'}</td>
                                <td className="px-3 py-2 text-slate-500 text-xs">{c.issueDate}</td>
                                <td className="px-3 py-2 text-xs">{expiryLabel(c.expiryDate)}</td>
                                <td className="px-3 py-2">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-500">
                                  {c.ceuRequired ? `${c.ceuCompleted ?? 0}/${c.ceuRequired}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PERMISSIONS TAB ──────────────────────────────────────── */}
            {activeTab === 'permissions' && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
                  <Key className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold mb-0.5">Screen-level access overrides for {selected.firstName} {selected.lastName}</div>
                    <div>Overrides apply only to this staff member and take precedence over their assigned role ({role?.label ?? selected.roleId}).
                    Changes take effect on their next login. &quot;Default&quot; = use the role&apos;s setting.</div>
                  </div>
                </div>

                {SCREEN_SECTIONS.map(section => (
                  <div key={section.title} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-border">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section.title}</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {section.screens.map(screen => {
                        const roleDefault = getPermission(selected.roleId, screen);
                        const currentOverride = getOverrideVal(selected.id, screen);
                        const hasOverride = currentOverride !== 'default';

                        return (
                          <div key={screen} className={`flex items-center px-4 py-2.5 gap-4 ${hasOverride ? 'bg-sunrise-amber/5' : ''}`}>
                            <div className="flex items-center gap-2 w-52 shrink-0">
                              {hasOverride && <div className="w-1.5 h-1.5 rounded-full bg-sunrise-orange shrink-0" />}
                              <span className={`text-sm ${hasOverride ? 'font-semibold text-navy' : 'text-slate-700'}`}>
                                {SCREEN_LABELS[screen] ?? screen}
                              </span>
                            </div>

                            {/* Role default chip */}
                            <div className="flex items-center gap-1 w-28 shrink-0">
                              <span className="text-[10px] text-slate-400">Role:</span>
                              {permChip(roleDefault)}
                            </div>

                            {/* Radio buttons */}
                            <div className="flex items-center gap-0.5">
                              {(['default', 'full', 'read', 'none'] as const).map(opt => (
                                <Radio
                                  key={opt}
                                  name={`${selected.id}-${screen}`}
                                  value={opt}
                                  checked={currentOverride === opt}
                                  onChange={() => handlePermChange(screen, opt)}
                                  label={opt === 'default' ? `Default` : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                  color={opt === 'full' ? 'bg-green-50' : opt === 'read' ? 'bg-blue-50' : opt === 'none' ? 'bg-red-50' : 'bg-slate-50'}
                                />
                              ))}
                            </div>

                            {/* Effective permission */}
                            {hasOverride && (
                              <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                                Effective: {permChip(getEffectivePerm(selected.id, screen))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SYSTEM ACCESS TAB ────────────────────────────────────── */}
            {activeTab === 'access' && (
              <div className="space-y-6 max-w-xl">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>System access flags control integration-level permissions — diagnostic code databases, the e-prescribing module,
                  the medication administration record, and billing code lookup.
                  These are enforced independently of screen-level access.</div>
                </div>

                {/* Access flags */}
                {([
                  { flag: 'diagnosticCodes' as const, label: 'ICD-10 / DSM-5 Diagnostic Codes', desc: 'Allows staff to search and assign diagnostic codes in notes and treatment plans.', icon: BookOpen, reqNote: null },
                  { flag: 'ePrescribe' as const, label: 'E-Prescribing Module', desc: 'Access to the electronic prescribing workflow. Requires valid DEA number.', icon: Pill, reqNote: !selected.deaNumber ? 'DEA number required — not on file' : null },
                  { flag: 'marAccess' as const, label: 'Medication Administration Record (MAR)', desc: 'Allows staff to view and document medication administration events.', icon: ClipboardList, reqNote: null },
                  { flag: 'billingCodes' as const, label: 'Billing / CPT Code Lookup', desc: 'Access to CPT, HCPCS, and procedure code reference and assignment.', icon: Receipt, reqNote: null },
                ] as const).map(({ flag, label, desc, icon: Icon, reqNote }) => {
                  const currentVal = getStaffFlags(selected.id, selected.accessFlags)[flag];
                  const isOverridden = flag in flagOvs;
                  return (
                    <div key={flag} className={`border rounded-lg p-4 ${isOverridden ? 'border-sunrise-orange/40 bg-sunrise-amber/5' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${currentVal ? 'bg-green-100' : 'bg-slate-100'}`}>
                            <Icon className={`w-4 h-4 ${currentVal ? 'text-green-600' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-navy flex items-center gap-2">
                              {label}
                              {isOverridden && <span className="text-[10px] font-normal text-sunrise-orange border border-sunrise-orange/30 px-1.5 py-0.5 rounded">Overridden</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                            {reqNote && <div className="text-xs text-red-600 mt-1 font-medium">{reqNote}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name={flag} checked={currentVal === true} onChange={() => handleFlagChange(flag, true)} className="accent-green-500" />
                            <span className={`text-sm font-medium ${currentVal ? 'text-green-700' : 'text-slate-400'}`}>Enabled</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name={flag} checked={currentVal === false} onChange={() => handleFlagChange(flag, false)} className="accent-red-500" />
                            <span className={`text-sm font-medium ${!currentVal ? 'text-red-700' : 'text-slate-400'}`}>Disabled</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Report Access */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-100`}>
                      <BarChart2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-navy">Report Access Level</div>
                      <div className="text-xs text-slate-500 mt-0.5">Controls which analytics, outcomes reports, and data exports this staff member can access.</div>
                    </div>
                  </div>
                  <div className="space-y-2 ml-11">
                    {([
                      { value: 'full', label: 'Full System', desc: 'All facility-wide reports, analytics, and data exports' },
                      { value: 'department', label: 'Department Only', desc: 'Reports scoped to their assigned department' },
                      { value: 'own', label: 'Own Records Only', desc: 'Only their own notes, activity logs, and outcomes' },
                      { value: 'none', label: 'No Report Access', desc: 'Cannot view or export any reports' },
                    ] as { value: ReportAccess; label: string; desc: string }[]).map(opt => {
                      const current = getStaffFlags(selected.id, selected.accessFlags).reportAccess;
                      const isSelected = current === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'border-border hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportAccess"
                            value={opt.value}
                            checked={isSelected}
                            onChange={() => handleFlagChange('reportAccess', opt.value)}
                            className="mt-0.5 accent-sunrise-blue"
                          />
                          <div>
                            <div className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-navy'}`}>{opt.label}</div>
                            <div className="text-xs text-slate-500">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── AUDIT LOG TAB ────────────────────────────────────────── */}
            {activeTab === 'audit' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-navy text-sm">Permission Change History</h3>
                  <span className="text-xs text-slate-400">{auditEntries.length} entries</span>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-border">
                      <tr>
                        {['Timestamp', 'Changed By', 'Staff Member', 'Type', 'Detail', 'Old → New'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry, i) => (
                        <tr key={entry.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                          <td className="px-3 py-2 text-xs text-slate-500 font-mono">{entry.timestamp}</td>
                          <td className="px-3 py-2 text-xs font-medium text-navy">{entry.changedBy}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{entry.targetStaff}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${entry.changeType === 'screen_permission' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {entry.changeType === 'screen_permission' ? 'Screen' : 'Access Flag'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {entry.screen ? (SCREEN_LABELS[entry.screen as Screen] ?? entry.screen) : entry.flag}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <span className="text-slate-500">{entry.oldValue}</span>
                            <span className="text-slate-300 mx-1">→</span>
                            <span className="font-semibold text-navy">{entry.newValue}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
