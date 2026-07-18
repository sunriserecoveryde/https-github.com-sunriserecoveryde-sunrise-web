import React from 'react';
import { 
  LayoutDashboard, Users, UserPlus, LogOut, 
  FileText, ClipboardList, CheckSquare, ListTodo, Activity,
  CalendarDays, UsersRound, CalendarClock,
  AlertTriangle, TrendingUp, BarChart3,
  Network, Briefcase, FileWarning, Bed,
  Receipt, ShieldCheck, GraduationCap, FileBarChart,
  HelpCircle, Settings
} from 'lucide-react';
import { Screen } from '../../App';

interface SidebarProps {
  currentScreen: Screen;
  navigate: (s: Screen) => void;
}

export function Sidebar({ currentScreen, navigate }: SidebarProps) {
  const sections = [
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
      ]
    },
    {
      title: 'DOCUMENTATION',
      items: [
        { id: 'ChartReview', label: 'Chart Review', icon: FileText },
        { id: 'ProgressNotes', label: 'Progress Notes', icon: ClipboardList, badge: 5 },
        { id: 'TreatmentPlans', label: 'Treatment Plans', icon: CheckSquare, badge: 3 },
        { id: 'ASAMAssessments', label: 'ASAM Assessments', icon: ListTodo },
        { id: 'GroupNotes', label: 'Group Notes', icon: UsersRound },
        { id: 'CosignQueue', label: 'Co-sign Queue', icon: FileWarning, badge: 4 },
      ]
    },
    {
      title: 'SCHEDULING',
      items: [
        { id: 'AppointmentCalendar', label: 'Appointment Calendar', icon: CalendarDays },
        { id: 'GroupSchedule', label: 'Group Schedule', icon: CalendarClock },
      ]
    },
    {
      title: 'RISK & OUTCOMES',
      items: [
        { id: 'RiskDashboard', label: 'Risk Dashboard', icon: AlertTriangle },
        { id: 'RecoveryEngagementScore', label: 'Recovery Engagement Score', icon: TrendingUp },
        { id: 'OutcomeTracking', label: 'Outcome Tracking', icon: BarChart3 },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'ReferralTracker', label: 'Referral Tracker', icon: Network },
        { id: 'BusinessDevelopment', label: 'Business Development', icon: Briefcase },
        { id: 'BedManagement', label: 'Bed Management', icon: Bed },
      ]
    },
    {
      title: 'BILLING & COMPLIANCE',
      items: [
        { id: 'RevenueCycle', label: 'Revenue Cycle', icon: Receipt },
        { id: 'AuditCompliance', label: 'Audit Readiness', icon: ShieldCheck },
        { id: 'Training', label: 'Training', icon: GraduationCap, badge: 2 },
      ]
    }
  ];

  return (
    <div className="w-[var(--nav-width)] bg-navy-mid h-[calc(100vh-var(--banner-height)-var(--topbar-height))] fixed left-0 top-[calc(var(--banner-height)+var(--topbar-height))] overflow-y-auto no-scrollbar border-r border-navy-light flex flex-col text-slate-300">
      <div className="flex-1 py-4">
        {sections.map((sec, i) => (
          <div key={i} className="mb-6">
            <div className="px-4 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              {sec.title}
            </div>
            <ul className="space-y-0.5">
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.id as Screen)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                        isActive 
                          ? 'bg-sunrise-blue/20 text-white border-r-2 border-sunrise-orange' 
                          : 'hover:bg-white/5 hover:text-white border-r-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-sunrise-orange' : 'text-slate-400'}`} />
                        <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-sunrise-orange text-white' : 'bg-navy-light text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-navy-light space-y-1">
        <button className="w-full flex items-center gap-3 px-2 py-2 text-sm hover:text-white transition-colors">
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-2 py-2 text-sm hover:text-white transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          Help & Support
        </button>
      </div>
    </div>
  );
}
