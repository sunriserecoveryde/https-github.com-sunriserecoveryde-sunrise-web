import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, User, LayoutDashboard, FileText, Activity, DollarSign,
  Users, Calendar, AlertTriangle, Pill, Heart, Stethoscope, Clipboard,
  TrendingUp, BarChart3, Network, Briefcase, Receipt, ShieldCheck,
  GraduationCap, MessageSquare, Video, UserCheck, Award, ListOrdered,
  Droplets, Siren, UserCog, CreditCard, MapPin, BookUser, Download,
  FolderOpen, BookOpen, ClipboardCheck, LineChart, ArrowLeftRight,
  Star, CheckSquare, ListTodo, ClipboardList, Bed, Grid3X3
} from 'lucide-react';
import { Screen } from '../../App';
import { MOCK_PATIENTS } from '../../data/mockPatients';
import { useRole } from '../../context/RoleContext';
import { getPermission, getRoleById } from '../../data/mockRoles';

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

const ALL_SCREEN_SHORTCUTS: { label: string; screen: Screen; icon: React.ReactNode; category: string }[] = [
  { label: 'Dashboard',                  screen: 'Dashboard',               icon: <LayoutDashboard className="w-4 h-4" />,  category: 'Overview' },
  { label: 'Command Center',             screen: 'CommandCenter',           icon: <Activity className="w-4 h-4" />,         category: 'Overview' },
  { label: 'Role Explorer',              screen: 'RoleExplorer',            icon: <Grid3X3 className="w-4 h-4" />,          category: 'Overview' },
  { label: 'Census & Bed Board',         screen: 'CensusBedBoard',          icon: <Bed className="w-4 h-4" />,              category: 'Clinical' },
  { label: 'Patient List',              screen: 'PatientList',             icon: <Users className="w-4 h-4" />,            category: 'Clinical' },
  { label: 'Admissions / Intake',        screen: 'Admissions',              icon: <User className="w-4 h-4" />,             category: 'Clinical' },
  { label: 'Discharges',                screen: 'Discharges',              icon: <User className="w-4 h-4" />,             category: 'Clinical' },
  { label: 'Bed Management',            screen: 'BedManagement',           icon: <Bed className="w-4 h-4" />,              category: 'Clinical' },
  { label: 'MAT Management',            screen: 'MATManagement',           icon: <Pill className="w-4 h-4" />,             category: 'Clinical' },
  { label: 'Family Engagement',         screen: 'FamilyEngagement',        icon: <Heart className="w-4 h-4" />,            category: 'Clinical' },
  { label: 'Physician Orders',          screen: 'PhysicianOrders',         icon: <Stethoscope className="w-4 h-4" />,      category: 'Clinical' },
  { label: 'Peer Support Program',      screen: 'PeerSupport',             icon: <Users className="w-4 h-4" />,            category: 'Clinical' },
  { label: 'Telehealth Consults',       screen: 'TelehealthConsults',      icon: <Video className="w-4 h-4" />,            category: 'Clinical' },
  { label: 'Chart Review',              screen: 'ChartReview',             icon: <FileText className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'Progress Notes',            screen: 'ProgressNotes',           icon: <ClipboardList className="w-4 h-4" />,    category: 'Documentation' },
  { label: 'Treatment Plans',           screen: 'TreatmentPlans',          icon: <CheckSquare className="w-4 h-4" />,      category: 'Documentation' },
  { label: 'ASAM Assessments',          screen: 'ASAMAssessments',         icon: <ListTodo className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'Biopsychosocial Intake',    screen: 'BiopsychosocialAssessment', icon: <ClipboardList className="w-4 h-4" />,  category: 'Documentation' },
  { label: 'Discharge Summary',         screen: 'DischargeSummary',        icon: <Download className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'Medical Records / ROI',     screen: 'MedicalRecords',          icon: <FolderOpen className="w-4 h-4" />,       category: 'Documentation' },
  { label: 'Group Notes',               screen: 'GroupNotes',              icon: <FileText className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'Co-sign Queue',             screen: 'CosignQueue',             icon: <FileText className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'My Caseload',               screen: 'MyCaseload',              icon: <BookUser className="w-4 h-4" />,         category: 'Documentation' },
  { label: 'Appointment Calendar',      screen: 'AppointmentCalendar',     icon: <Calendar className="w-4 h-4" />,         category: 'Scheduling' },
  { label: 'Group Schedule',            screen: 'GroupSchedule',           icon: <Calendar className="w-4 h-4" />,         category: 'Scheduling' },
  { label: 'Group Curriculum Library',  screen: 'GroupTherapyCurriculum',  icon: <BookOpen className="w-4 h-4" />,         category: 'Scheduling' },
  { label: 'Staff Scheduling',          screen: 'StaffScheduling',         icon: <UserCog className="w-4 h-4" />,          category: 'Scheduling' },
  { label: 'Risk Dashboard',            screen: 'RiskDashboard',           icon: <AlertTriangle className="w-4 h-4" />,    category: 'Risk & Outcomes' },
  { label: 'Recovery Engagement Score', screen: 'RecoveryEngagementScore', icon: <TrendingUp className="w-4 h-4" />,       category: 'Risk & Outcomes' },
  { label: 'Outcome Tracking',          screen: 'OutcomeTracking',         icon: <BarChart3 className="w-4 h-4" />,        category: 'Risk & Outcomes' },
  { label: 'Population Analytics',      screen: 'PopulationAnalytics',     icon: <LineChart className="w-4 h-4" />,        category: 'Risk & Outcomes' },
  { label: 'UA / Drug Testing',         screen: 'UADrugTesting',           icon: <Droplets className="w-4 h-4" />,         category: 'Risk & Outcomes' },
  { label: 'Incident Reports',          screen: 'IncidentReporting',       icon: <Siren className="w-4 h-4" />,            category: 'Risk & Outcomes' },
  { label: 'Crisis Assessment',         screen: 'CrisisAssessment',        icon: <AlertTriangle className="w-4 h-4" />,    category: 'Risk & Outcomes' },
  { label: 'Medication MAR',            screen: 'NursingMAR',              icon: <Clipboard className="w-4 h-4" />,        category: 'Nursing' },
  { label: 'Shift Handoff',             screen: 'ShiftHandoff',            icon: <ArrowLeftRight className="w-4 h-4" />,   category: 'Nursing' },
  { label: 'Referral Tracker',          screen: 'ReferralTracker',         icon: <Network className="w-4 h-4" />,          category: 'Operations' },
  { label: 'Waitlist Manager',          screen: 'WaitlistManager',         icon: <ListOrdered className="w-4 h-4" />,      category: 'Operations' },
  { label: 'Business Development',      screen: 'BusinessDevelopment',     icon: <Briefcase className="w-4 h-4" />,        category: 'Operations' },
  { label: 'Insurance Auth / UR',       screen: 'InsuranceAuthorization',  icon: <CreditCard className="w-4 h-4" />,       category: 'Operations' },
  { label: 'Aftercare Planning',        screen: 'AftercarePlanning',       icon: <MapPin className="w-4 h-4" />,           category: 'Operations' },
  { label: 'Alumni Program',            screen: 'AlumniProgram',           icon: <Heart className="w-4 h-4" />,            category: 'Operations' },
  { label: 'Clinical Supervision',      screen: 'ClinicalSupervision',     icon: <UserCheck className="w-4 h-4" />,        category: 'Supervision' },
  { label: 'Certification Tracker',     screen: 'CertificationTracker',    icon: <Award className="w-4 h-4" />,            category: 'Supervision' },
  { label: 'Secure Messaging',          screen: 'SecureMessaging',         icon: <MessageSquare className="w-4 h-4" />,    category: 'Communications' },
  { label: 'Revenue Cycle',             screen: 'RevenueCycle',            icon: <Receipt className="w-4 h-4" />,          category: 'Billing & Compliance' },
  { label: 'Financial Counseling',      screen: 'FinancialCounseling',     icon: <DollarSign className="w-4 h-4" />,       category: 'Billing & Compliance' },
  { label: 'Audit Readiness',           screen: 'AuditCompliance',         icon: <ShieldCheck className="w-4 h-4" />,      category: 'Billing & Compliance' },
  { label: 'Quality Improvement',       screen: 'QualityImprovement',      icon: <Star className="w-4 h-4" />,             category: 'Billing & Compliance' },
  { label: 'Formulary & Drug Ref',      screen: 'FormularyManagement',     icon: <ClipboardCheck className="w-4 h-4" />,   category: 'Billing & Compliance' },
  { label: 'Training',                  screen: 'Training',                icon: <GraduationCap className="w-4 h-4" />,    category: 'Billing & Compliance' },
  { label: 'Settings',                  screen: 'Settings',                icon: <LayoutDashboard className="w-4 h-4" />,  category: 'System' },
  { label: 'Help & Support',            screen: 'HelpSupport',             icon: <LayoutDashboard className="w-4 h-4" />,  category: 'System' },
];

// Persists the last non-empty search query for the session so users don't
// have to retype after switching roles via RoleExplorer and returning.
let _lastQuery = '';

export function CommandPalette({ onClose, navigate }: Props) {
  const [query, setQuery] = useState(_lastQuery);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { roleId, canAccessScreen } = useRole();
  const canSearchPatients = getPermission(roleId, 'PatientDetail') !== 'none';
  const roleLabel = getRoleById(roleId)?.label ?? roleId;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = (screen: Screen, patientId?: string) => { navigate(screen, patientId); onClose(); };

  // Only show screens the current role can access
  const accessibleScreens = ALL_SCREEN_SHORTCUTS.filter(s =>
    s.screen === 'RoleExplorer' || canAccessScreen(s.screen)
  );

  const results: SearchResult[] = query.trim() === ''
    ? accessibleScreens.slice(0, 6).map(s => ({
        type: 'screen' as const,
        label: s.label,
        sublabel: s.category,
        icon: s.icon,
        action: () => go(s.screen),
      }))
    : [
        ...(canSearchPatients ? MOCK_PATIENTS.filter(p =>
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
        })) : []),
        ...accessibleScreens.filter(s =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8).map(s => ({
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
            onChange={e => { const v = e.target.value; setQuery(v); _lastQuery = v; }}
            placeholder={canSearchPatients ? "Search patients, screens, or actions…" : "Search screens or actions…"}
            className="flex-1 text-sm focus:outline-none text-navy placeholder:text-slate"
          />
          <div className="flex items-center gap-2">
            {query && (
              <button onClick={() => { setQuery(''); _lastQuery = ''; }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-3.5 h-3.5 text-slate" />
              </button>
            )}
            <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-slate">Esc</kbd>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {query.trim() === '' && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-semibold text-slate uppercase tracking-wide">Quick Navigation</span>
            </div>
          )}
          {!canSearchPatients && query.trim() !== '' && (
            <div className="mx-4 mt-3 mb-1 rounded-lg bg-amber-50 border border-amber-200 overflow-hidden">
              {/* Header row */}
              <div className="px-3 py-2.5 flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">🔒</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-amber-800">
                    Patient records are not accessible for the {roleLabel} role
                  </div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Only screen results are shown.{' '}
                    <button
                      onClick={() => { navigate('RoleExplorer'); onClose(); }}
                      className="font-semibold underline hover:text-amber-900"
                    >
                      View role permissions →
                    </button>
                  </div>
                </div>
              </div>

              {/* Ghosted patient row previews */}
              <div className="border-t border-amber-200 bg-white/60 px-2 py-1.5">
                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider px-1 mb-1">Preview — what patient results look like</div>
                <div className="relative select-none pointer-events-none" aria-hidden="true">
                  {[
                    { initials: 'MW', name: 'Marcus Webb', sub: 'MRN-83921 · Residential · Severe Opioid Use Disorder', tag: 'Patient' },
                    { initials: 'AR', name: 'Angela Reyes', sub: 'MRN-72819 · PHP · Severe Alcohol Use Disorder', tag: 'Patient' },
                    { initials: 'DP', name: 'Devon Patel',  sub: 'MRN-99321 · Residential · Severe Methamphetamine Use Disorder', tag: 'Patient' },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ filter: 'blur(3.5px)', opacity: 0.55 }}>
                      <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {row.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-navy text-sm">{row.name}</div>
                        <div className="text-xs text-slate truncate">{row.sub}</div>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">{row.tag}</span>
                    </div>
                  ))}
                  {/* Gradient fade at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-amber-50/80 to-transparent rounded-b-lg" />
                </div>
              </div>
            </div>
          )}
          {results.length === 0 && query.trim() !== '' && canSearchPatients && (
            <div className="px-4 py-8 text-center">
              <div className="text-sm text-slate">No results for &ldquo;{query}&rdquo;</div>
            </div>
          )}
          {results.length === 0 && query.trim() !== '' && !canSearchPatients && (
            <div className="px-4 py-6 text-center">
              <div className="text-sm text-slate">No matching screens for &ldquo;{query}&rdquo;</div>
            </div>
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
                {i === selected && <kbd className="text-xs bg-orange/20 text-orange border border-orange/30 rounded px-1">&#8629;</kbd>}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-gray-50 flex items-center gap-4 text-xs text-slate">
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">&#8593;&#8595;</kbd> navigate</div>
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">&#8629;</kbd> open</div>
          <div className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">Esc</kbd> close</div>
          <div className="ml-auto">{canSearchPatients ? `${MOCK_PATIENTS.length} patients · ` : ''}{accessibleScreens.length} screens accessible</div>
        </div>
      </div>
    </div>
  );
}
