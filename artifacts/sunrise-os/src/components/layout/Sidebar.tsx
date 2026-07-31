import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  FileText, ClipboardList, CheckSquare, ListTodo, Activity,
  CalendarDays, UsersRound, CalendarClock,
  AlertTriangle, TrendingUp, BarChart3,
  Network, Briefcase, FileWarning, Bed,
  Receipt, ShieldCheck, GraduationCap, FileBarChart,
  HelpCircle, Settings, Droplets, Siren, UserCog,
  Pill, Heart, Stethoscope, LineChart, Clipboard,
  ArrowLeftRight, Star, CreditCard, MapPin, BookUser, Download,
  Video, UserCheck, FolderOpen, DollarSign, BookOpen, HandHelping,
  Award, ClipboardCheck, MessageSquare, ListOrdered, Grid3X3,
  Eye, Sparkles, Brain, FlaskConical, Building2, FileSearch,
  ChevronRight, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Screen } from '../../App';
import { useRole } from '../../context/RoleContext';

interface SidebarProps {
  currentScreen: Screen;
  navigate: (s: Screen) => void;
}

interface SidebarItem {
  id: Screen;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarSection {
  key: string;
  title: string;
  items: SidebarItem[];
}

// ── 7 canonical groups per spec ─────────────────────────────────────────────
const ALL_SECTIONS: SidebarSection[] = [
  {
    key: 'overview',
    title: 'OVERVIEW',
    items: [
      { id: 'Dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
      { id: 'CommandCenter', label: 'Command Center', icon: Activity },
    ],
  },
  {
    key: 'patient-care',
    title: 'PATIENT CARE',
    items: [
      { id: 'CensusBedBoard',    label: 'Census & Bed Board',   icon: Bed },
      { id: 'PatientList',       label: 'Patient List',         icon: Users, badge: 18 },
      { id: 'Admissions',        label: 'Admissions / Intake',  icon: UserPlus },
      { id: 'Discharges',        label: 'Discharges',           icon: LogOut },
      { id: 'MATManagement',     label: 'MAT Management',       icon: Pill },
      { id: 'FamilyEngagement',  label: 'Family Engagement',    icon: Heart },
      { id: 'PhysicianOrders',   label: 'Physician Orders',     icon: Stethoscope },
      { id: 'PeerSupport',       label: 'Peer Support',         icon: HandHelping },
      { id: 'TelehealthConsults',label: 'Telehealth',           icon: Video },
      { id: 'NursingMAR',        label: 'Medication MAR',       icon: Clipboard },
      { id: 'WithdrawalMonitor', label: 'Withdrawal Monitor',   icon: Activity },
      { id: 'ShiftHandoff',      label: 'Shift Handoff',        icon: ArrowLeftRight },
      { id: 'CrisisAssessment',  label: 'Crisis Assessment',    icon: AlertTriangle },
      { id: 'WaitlistManager',   label: 'Waitlist Manager',     icon: ListOrdered },
      { id: 'ReferralTracker',   label: 'Referral Tracker',     icon: Network },
      { id: 'BedManagement',     label: 'Bed Management',       icon: Bed },
      { id: 'AftercarePlanning', label: 'Aftercare Planning',   icon: MapPin },
      { id: 'AlumniProgram',     label: 'Alumni Program',       icon: Heart },
    ],
  },
  {
    key: 'documentation',
    title: 'DOCUMENTATION',
    items: [
      { id: 'ChartReview',             label: 'Chart Review',             icon: FileText },
      { id: 'ProgressNotes',           label: 'Progress Notes',           icon: ClipboardList, badge: 5 },
      { id: 'TreatmentPlans',          label: 'Treatment Plans',          icon: CheckSquare,   badge: 3 },
      { id: 'ASAMAssessments',         label: 'ASAM Assessments',         icon: ListTodo },
      { id: 'ClinicalForms',           label: 'Admissions Screening',     icon: ClipboardCheck },
      { id: 'BiopsychosocialAssessment', label: 'Biopsychosocial Intake', icon: ClipboardList },
      { id: 'DischargeSummary',        label: 'Discharge Summary',        icon: Download },
      { id: 'MedicalRecords',          label: 'Medical Records / ROI',    icon: FolderOpen },
      { id: 'GroupNotes',              label: 'Group Notes',              icon: UsersRound },
      { id: 'GroupTherapyCurriculum',  label: 'Group Curriculum Library', icon: BookOpen },
      { id: 'CosignQueue',             label: 'Co-sign Queue',            icon: FileWarning, badge: 4 },
      { id: 'MyCaseload',              label: 'My Caseload',              icon: BookUser },
    ],
  },
  {
    key: 'operations',
    title: 'OPERATIONS',
    items: [
      { id: 'AppointmentCalendar', label: 'Appointment Calendar', icon: CalendarDays },
      { id: 'GroupSchedule',       label: 'Group Schedule',       icon: CalendarClock },
      { id: 'StaffScheduling',     label: 'Staff Scheduling',     icon: UserCog },
      { id: 'BusinessDevelopment', label: 'Business Development', icon: Briefcase },
      { id: 'SecureMessaging',     label: 'Secure Messaging',     icon: MessageSquare, badge: 3 },
      { id: 'UADrugTesting',       label: 'UA / Drug Testing',    icon: Droplets },
      { id: 'IncidentReporting',   label: 'Incident Reports',     icon: Siren },
    ],
  },
  {
    key: 'financial',
    title: 'FINANCIAL',
    items: [
      { id: 'RevenueCycle',           label: 'Revenue Cycle',         icon: Receipt },
      { id: 'FinancialCounseling',    label: 'Financial Counseling',  icon: DollarSign },
      { id: 'InsuranceAuthorization', label: 'Insurance Auth / UR',   icon: CreditCard },
      { id: 'AuditCompliance',        label: 'Audit Readiness',       icon: ShieldCheck },
      { id: 'ChartAuditTool',         label: 'Chart Audit Tool',      icon: FileSearch },
      { id: 'QualityImprovement',     label: 'Quality Improvement',   icon: Star },
      { id: 'FormularyManagement',    label: 'Formulary & Drug Ref',  icon: ClipboardCheck },
    ],
  },
  {
    key: 'intelligence',
    title: 'INTELLIGENCE',
    items: [
      { id: 'ClinicalIntelligence',    label: 'Clinical Intelligence',     icon: Brain, badge: 3 },
      { id: 'RiskDashboard',           label: 'Risk Dashboard',            icon: AlertTriangle },
      { id: 'RecoveryEngagementScore', label: 'Recovery Engagement Score', icon: TrendingUp },
      { id: 'OutcomeTracking',         label: 'Outcome Tracking',          icon: BarChart3 },
      { id: 'MeasurementBasedCare',    label: 'Measurement-Based Care',    icon: ClipboardCheck },
      { id: 'PopulationAnalytics',     label: 'Population Analytics',      icon: LineChart },
      { id: 'AIAssistant',             label: 'Sunrise AI',                icon: Sparkles },
      { id: 'DAPNoteWorkflow',         label: 'DAP Note Workflow',         icon: FlaskConical },
    ],
  },
  {
    key: 'administration',
    title: 'ADMINISTRATION',
    items: [
      { id: 'StaffAdmin',           label: 'Staff Administration',     icon: ShieldCheck },
      { id: 'WorkforceCompliance',  label: 'Workforce Compliance',     icon: Building2, badge: 4 },
      { id: 'CertificationTracker', label: 'Credentialing & Licenses', icon: Award },
      { id: 'Training',             label: 'Training & LMS',           icon: GraduationCap, badge: 2 },
      { id: 'ClinicalSupervision',  label: 'Clinical Supervision',     icon: UserCheck },
    ],
  },
];

// Keys of groups that should default to open
const DEFAULT_OPEN = new Set(['overview']);

function getSectionForScreen(screen: Screen): string | null {
  for (const sec of ALL_SECTIONS) {
    if (sec.items.some(i => i.id === screen)) return sec.key;
  }
  return null;
}

const SESSION_OPEN_KEY    = 'sunrise_sidebar_open_v1';
const SESSION_COMPACT_KEY = 'sidebar_compact';

function loadOpenKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_OPEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set(DEFAULT_OPEN);
}

function saveOpenKeys(keys: Set<string>) {
  try { sessionStorage.setItem(SESSION_OPEN_KEY, JSON.stringify([...keys])); } catch { /* ignore */ }
}

function saveCompact(v: boolean) {
  try { sessionStorage.setItem(SESSION_COMPACT_KEY, String(v)); } catch { /* ignore */ }
}

export function Sidebar({ currentScreen, navigate }: SidebarProps) {
  const { canAccessScreen, getPermissionForScreen } = useRole();

  const [openKeys, setOpenKeys] = useState<Set<string>>(loadOpenKeys);
  const [compact, setCompact] = useState<boolean>(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('sidebar_compact') : null;
    return raw === 'true';
  });

  // Keep --nav-width CSS variable in sync with compact state (including on mount)
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-width', compact ? '56px' : '240px');
  }, [compact]);

  // Auto-expand the group containing the active page
  useEffect(() => {
    const key = getSectionForScreen(currentScreen);
    if (!key) return;
    setOpenKeys(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      saveOpenKeys(next);
      return next;
    });
  }, [currentScreen]);

  const toggleSection = useCallback((key: string) => {
    setOpenKeys(prev => {
      const next = new Set(prev);
      // Never collapse if it contains the active screen
      const activeKey = getSectionForScreen(currentScreen);
      if (key === activeKey && prev.has(key)) return prev;
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      saveOpenKeys(next);
      return next;
    });
  }, [currentScreen]);

  const toggleCompact = useCallback(() => {
    setCompact(prev => {
      const next = !prev;
      saveCompact(next);
      return next;
    });
  }, []);

  // Filter sections/items by role permissions
  const visibleSections = ALL_SECTIONS
    .map(sec => {
      const visibleItems = sec.items.filter(item => canAccessScreen(item.id));
      const allReadOnly = visibleItems.length > 0 &&
        visibleItems.every(item => getPermissionForScreen(item.id) === 'read');
      return { ...sec, items: visibleItems, allReadOnly };
    })
    .filter(sec => sec.items.length > 0);

  const isFooterActive = (currentScreen === 'Settings' || currentScreen === 'HelpSupport' || currentScreen === 'RoleExplorer');

  return (
    <div
      className={`${compact ? 'w-[56px]' : 'w-[var(--nav-width)]'} bg-navy-mid h-[calc(100vh-var(--banner-height)-var(--topbar-height))] fixed left-0 top-[calc(var(--banner-height)+var(--topbar-height))] overflow-y-auto no-scrollbar border-r border-navy-light flex flex-col text-slate-300 transition-[width] duration-200`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Compact toggle */}
      <div className={`flex ${compact ? 'justify-center' : 'justify-end'} px-2 pt-3 pb-1`}>
        <button
          onClick={toggleCompact}
          className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
          title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {compact
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav sections */}
      <div className="flex-1 pb-4">
        {visibleSections.map(sec => {
          const isOpen = openKeys.has(sec.key);
          const activeKey = getSectionForScreen(currentScreen);
          const hasActive = sec.key === activeKey;

          return (
            <div key={sec.key} className="mb-1">
              {/* Section header */}
              {compact ? (
                /* Compact: just a thin divider between groups */
                <div className="mx-2 my-2 border-t border-navy-light/60" aria-hidden="true" />
              ) : (
                <button
                  onClick={() => toggleSection(sec.key)}
                  className={`w-full px-4 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    sec.allReadOnly ? 'text-slate-600 hover:text-slate-500' : 'text-slate-400 hover:text-slate-300'
                  }`}
                  aria-expanded={isOpen}
                  aria-controls={`nav-section-${sec.key}`}
                >
                  <span className="flex items-center gap-2">
                    {sec.title}
                    {sec.allReadOnly && (
                      <span className="normal-case text-[9px] font-medium text-slate-600 tracking-normal">(View only)</span>
                    )}
                  </span>
                  <ChevronRight
                    className={`w-3 h-3 flex-none transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${hasActive && !isOpen ? 'text-sunrise-orange' : ''}`}
                  />
                </button>
              )}

              {/* Items */}
              <ul
                id={`nav-section-${sec.key}`}
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  compact || isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  const perm = getPermissionForScreen(item.id);
                  const isReadOnly = perm === 'read';

                  if (compact) {
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => navigate(item.id)}
                          title={isReadOnly ? `${item.label} — View only` : item.label}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`relative group w-full flex items-center justify-center h-9 transition-colors ${
                            isActive
                              ? 'bg-sunrise-blue/20 border-r-2 border-sunrise-orange'
                              : isReadOnly
                                ? 'hover:bg-white/5 border-r-2 border-transparent'
                                : 'hover:bg-white/5 border-r-2 border-transparent'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-none ${
                            isActive ? 'text-sunrise-orange' : isReadOnly ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'
                          }`} />
                          {item.badge ? (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[8px] flex items-center justify-center rounded-full bg-sunrise-orange text-white font-bold">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigate(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group w-full flex items-center justify-between px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
                          isActive
                            ? 'bg-sunrise-blue/20 text-white border-r-2 border-sunrise-orange'
                            : isReadOnly
                              ? 'hover:bg-white/5 hover:text-slate-400 border-r-2 border-transparent text-slate-600'
                              : 'hover:bg-white/5 hover:text-white border-r-2 border-transparent'
                        }`}
                        title={isReadOnly ? `${item.label} — View only` : item.label}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 flex-none transition-colors ${
                            isActive ? 'text-sunrise-orange' : isReadOnly ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-white'
                          }`} />
                          <span className={`truncate text-sm ${isActive ? 'font-medium' : ''} ${isReadOnly ? 'italic' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-none ml-1">
                          {isReadOnly && (
                            <Eye className={`w-3 h-3 flex-none ${isActive ? 'text-white/60' : 'text-slate-600 group-hover:text-slate-400'}`} />
                          )}
                          {item.badge ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isActive ? 'bg-sunrise-orange text-white' : 'bg-navy-light text-white'
                            }`}>
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer: Settings, Help, Role Explorer */}
      <div className={`border-t border-navy-light ${compact ? 'py-2 space-y-1' : 'p-4 space-y-1'}`}>
        {[
          canAccessScreen('Settings')    && { id: 'Settings'    as Screen, label: 'Settings',       icon: Settings    },
          canAccessScreen('HelpSupport') && { id: 'HelpSupport' as Screen, label: 'Help & Support',  icon: HelpCircle  },
          /* RoleExplorer is always visible */
                                            { id: 'RoleExplorer' as Screen, label: 'Role Explorer',   icon: Grid3X3     },
        ].filter(Boolean).map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          if (compact) {
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex justify-center items-center h-9 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sunrise-orange' : ''}`} />
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sunrise-orange focus-visible:ring-inset rounded-md ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-none ${isActive ? 'text-sunrise-orange' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
