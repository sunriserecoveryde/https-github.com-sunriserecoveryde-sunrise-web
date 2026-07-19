import React from 'react';
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
  Eye
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
  title: string;
  items: SidebarItem[];
}

const ALL_SECTIONS: SidebarSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'CommandCenter', label: 'Command Center', icon: Activity },
    ]
  },
  {
    title: 'CLINICAL',
    items: [
      { id: 'CensusBedBoard', label: 'Census & Bed Board', icon: Bed },
      { id: 'PatientList', label: 'Patient List', icon: Users, badge: 18 },
      { id: 'Admissions', label: 'Admissions / Intake', icon: UserPlus },
      { id: 'Discharges', label: 'Discharges', icon: LogOut },
      { id: 'MATManagement', label: 'MAT Management', icon: Pill },
      { id: 'FamilyEngagement', label: 'Family Engagement', icon: Heart },
      { id: 'PhysicianOrders', label: 'Physician Orders', icon: Stethoscope },
      { id: 'PeerSupport', label: 'Peer Support Program', icon: HandHelping },
      { id: 'TelehealthConsults', label: 'Telehealth Consults', icon: Video },
    ]
  },
  {
    title: 'DOCUMENTATION',
    items: [
      { id: 'ChartReview', label: 'Chart Review', icon: FileText },
      { id: 'ProgressNotes', label: 'Progress Notes', icon: ClipboardList, badge: 5 },
      { id: 'TreatmentPlans', label: 'Treatment Plans', icon: CheckSquare, badge: 3 },
      { id: 'ASAMAssessments', label: 'ASAM Assessments', icon: ListTodo },
      { id: 'BiopsychosocialAssessment', label: 'Biopsychosocial Intake', icon: ClipboardList },
      { id: 'DischargeSummary', label: 'Discharge Summary', icon: Download },
      { id: 'MedicalRecords', label: 'Medical Records / ROI', icon: FolderOpen },
      { id: 'GroupNotes', label: 'Group Notes', icon: UsersRound },
      { id: 'CosignQueue', label: 'Co-sign Queue', icon: FileWarning, badge: 4 },
      { id: 'MyCaseload', label: 'My Caseload', icon: BookUser },
    ]
  },
  {
    title: 'SCHEDULING',
    items: [
      { id: 'AppointmentCalendar', label: 'Appointment Calendar', icon: CalendarDays },
      { id: 'GroupSchedule', label: 'Group Schedule', icon: CalendarClock },
      { id: 'GroupTherapyCurriculum', label: 'Group Curriculum Library', icon: BookOpen },
      { id: 'StaffScheduling', label: 'Staff Scheduling', icon: UserCog },
    ]
  },
  {
    title: 'RISK & OUTCOMES',
    items: [
      { id: 'RiskDashboard', label: 'Risk Dashboard', icon: AlertTriangle },
      { id: 'RecoveryEngagementScore', label: 'Recovery Engagement Score', icon: TrendingUp },
      { id: 'OutcomeTracking', label: 'Outcome Tracking', icon: BarChart3 },
      { id: 'PopulationAnalytics', label: 'Population Analytics', icon: LineChart },
      { id: 'UADrugTesting', label: 'UA / Drug Testing', icon: Droplets },
      { id: 'IncidentReporting', label: 'Incident Reports', icon: Siren },
      { id: 'CrisisAssessment', label: 'Crisis Assessment (C-SSRS)', icon: AlertTriangle },
    ]
  },
  {
    title: 'NURSING',
    items: [
      { id: 'NursingMAR', label: 'Medication MAR', icon: Clipboard },
      { id: 'ShiftHandoff', label: 'Shift Handoff', icon: ArrowLeftRight },
      { id: 'WithdrawalMonitor', label: 'Withdrawal Monitor', icon: Activity },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { id: 'ReferralTracker', label: 'Referral Tracker', icon: Network },
      { id: 'WaitlistManager', label: 'Waitlist Manager', icon: ListOrdered },
      { id: 'BusinessDevelopment', label: 'Business Development', icon: Briefcase },
      { id: 'BedManagement', label: 'Bed Management', icon: Bed },
      { id: 'InsuranceAuthorization', label: 'Insurance Auth / UR', icon: CreditCard },
      { id: 'AftercarePlanning', label: 'Aftercare Planning', icon: MapPin },
      { id: 'AlumniProgram', label: 'Alumni Program', icon: Heart },
    ]
  },
  {
    title: 'BILLING & COMPLIANCE',
    items: [
      { id: 'RevenueCycle', label: 'Revenue Cycle', icon: Receipt },
      { id: 'FinancialCounseling', label: 'Financial Counseling', icon: DollarSign },
      { id: 'AuditCompliance', label: 'Audit Readiness', icon: ShieldCheck },
      { id: 'QualityImprovement', label: 'Quality Improvement', icon: Star },
      { id: 'Training', label: 'Training', icon: GraduationCap, badge: 2 },
      { id: 'FormularyManagement', label: 'Formulary & Drug Ref', icon: ClipboardCheck },
    ]
  },
  {
    title: 'SUPERVISION',
    items: [
      { id: 'ClinicalSupervision', label: 'Clinical Supervision', icon: UserCheck },
      { id: 'CertificationTracker', label: 'Certification Tracker', icon: Award },
    ]
  },
  {
    title: 'COMMUNICATIONS',
    items: [
      { id: 'SecureMessaging', label: 'Secure Messaging', icon: MessageSquare, badge: 3 },
    ]
  },
  {
    title: 'SECURITY & ADMIN',
    items: [
      { id: 'StaffAdmin', label: 'Staff Administration', icon: ShieldCheck },
    ]
  },
];

export function Sidebar({ currentScreen, navigate }: SidebarProps) {
  const { canAccessScreen, getPermissionForScreen } = useRole();

  // Filter sections and items based on current role
  const visibleSections = ALL_SECTIONS
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => canAccessScreen(item.id)),
    }))
    .filter(sec => sec.items.length > 0);

  return (
    <div className="w-[var(--nav-width)] bg-navy-mid h-[calc(100vh-var(--banner-height)-var(--topbar-height))] fixed left-0 top-[calc(var(--banner-height)+var(--topbar-height))] overflow-y-auto no-scrollbar border-r border-navy-light flex flex-col text-slate-300">
      <div className="flex-1 py-4">
        {visibleSections.map((sec, i) => (
          <div key={i} className="mb-6">
            <div className="px-4 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {sec.title}
            </div>
            <ul className="space-y-0.5">
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                const perm = getPermissionForScreen(item.id);
                const isReadOnly = perm === 'read';
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-sunrise-blue/20 text-white border-r-2 border-sunrise-orange'
                          : isReadOnly
                            ? 'hover:bg-white/5 hover:text-white/80 border-r-2 border-transparent text-slate-400'
                            : 'hover:bg-white/5 hover:text-white border-r-2 border-transparent'
                      }`}
                      title={isReadOnly ? `${item.label} — View only` : item.label}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 flex-none ${isActive ? 'text-sunrise-orange' : isReadOnly ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className={`truncate ${isActive ? 'font-medium' : ''} ${isReadOnly && !isActive ? 'italic' : ''}`}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-none ml-1">
                        {isReadOnly && !isActive && (
                          <Eye className="w-3 h-3 text-slate-500 flex-none" />
                        )}
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-sunrise-orange text-white' : 'bg-navy-light text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-navy-light space-y-1">
        {canAccessScreen('Settings') && (
          <button
            onClick={() => navigate('Settings')}
            className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-colors ${currentScreen === 'Settings' ? 'text-white' : 'hover:text-white'}`}
          >
            <Settings className={`w-4 h-4 ${currentScreen === 'Settings' ? 'text-sunrise-orange' : 'text-slate-400'}`} />
            Settings
          </button>
        )}
        {canAccessScreen('HelpSupport') && (
          <button
            onClick={() => navigate('HelpSupport')}
            className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-colors ${currentScreen === 'HelpSupport' ? 'text-white' : 'hover:text-white'}`}
          >
            <HelpCircle className={`w-4 h-4 ${currentScreen === 'HelpSupport' ? 'text-sunrise-orange' : 'text-slate-400'}`} />
            Help &amp; Support
          </button>
        )}
        <button
          onClick={() => navigate('RoleExplorer')}
          className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-colors ${currentScreen === 'RoleExplorer' ? 'text-white' : 'hover:text-white'}`}
        >
          <Grid3X3 className={`w-4 h-4 ${currentScreen === 'RoleExplorer' ? 'text-sunrise-orange' : 'text-slate-400'}`} />
          Role Explorer
        </button>
      </div>
    </div>
  );
}
