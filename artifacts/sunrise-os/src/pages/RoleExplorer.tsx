import React, { useState } from 'react';
import { Screen } from '../App';
import { ROLES, ROLE_CATEGORIES, RoleCategory, Permission } from '../data/mockRoles';
import { useRole } from '../context/RoleContext';
import { Search, Shield, Eye, Minus } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

const ALL_SCREENS: { screen: Screen; label: string; section: string }[] = [
  { screen: 'Dashboard',               label: 'Dashboard',                   section: 'Overview' },
  { screen: 'CommandCenter',           label: 'Command Center',              section: 'Overview' },
  { screen: 'CensusBedBoard',          label: 'Census & Bed Board',          section: 'Clinical' },
  { screen: 'PatientList',             label: 'Patient List',                section: 'Clinical' },
  { screen: 'PatientDetail',           label: 'Patient Detail',              section: 'Clinical' },
  { screen: 'Admissions',             label: 'Admissions / Intake',         section: 'Clinical' },
  { screen: 'Discharges',             label: 'Discharges',                  section: 'Clinical' },
  { screen: 'BedManagement',          label: 'Bed Management',              section: 'Clinical' },
  { screen: 'ChartReview',            label: 'Chart Review',                section: 'Documentation' },
  { screen: 'ProgressNotes',          label: 'Progress Notes',              section: 'Documentation' },
  { screen: 'TreatmentPlans',         label: 'Treatment Plans',             section: 'Documentation' },
  { screen: 'ASAMAssessments',        label: 'ASAM Assessments',            section: 'Documentation' },
  { screen: 'BiopsychosocialAssessment', label: 'Biopsychosocial Intake',   section: 'Documentation' },
  { screen: 'DischargeSummary',       label: 'Discharge Summary',           section: 'Documentation' },
  { screen: 'MedicalRecords',         label: 'Medical Records / ROI',       section: 'Documentation' },
  { screen: 'GroupNotes',             label: 'Group Notes',                 section: 'Documentation' },
  { screen: 'CosignQueue',            label: 'Co-sign Queue',               section: 'Documentation' },
  { screen: 'MyCaseload',             label: 'My Caseload',                 section: 'Documentation' },
  { screen: 'AppointmentCalendar',    label: 'Appointment Calendar',        section: 'Scheduling' },
  { screen: 'GroupSchedule',          label: 'Group Schedule',              section: 'Scheduling' },
  { screen: 'GroupTherapyCurriculum', label: 'Group Curriculum Library',    section: 'Scheduling' },
  { screen: 'StaffScheduling',        label: 'Staff Scheduling',            section: 'Scheduling' },
  { screen: 'PhysicianOrders',        label: 'Physician Orders',            section: 'Clinical Rx' },
  { screen: 'MATManagement',          label: 'MAT Management',              section: 'Clinical Rx' },
  { screen: 'FormularyManagement',    label: 'Formulary & Drug Ref',        section: 'Clinical Rx' },
  { screen: 'NursingMAR',            label: 'Medication MAR',              section: 'Nursing' },
  { screen: 'ShiftHandoff',          label: 'Shift Handoff',               section: 'Nursing' },
  { screen: 'RiskDashboard',         label: 'Risk Dashboard',              section: 'Risk & Outcomes' },
  { screen: 'RecoveryEngagementScore', label: 'Recovery Engagement Score',  section: 'Risk & Outcomes' },
  { screen: 'OutcomeTracking',        label: 'Outcome Tracking',            section: 'Risk & Outcomes' },
  { screen: 'UADrugTesting',         label: 'UA / Drug Testing',           section: 'Risk & Outcomes' },
  { screen: 'IncidentReporting',     label: 'Incident Reports',            section: 'Risk & Outcomes' },
  { screen: 'CrisisAssessment',      label: 'Crisis Assessment (C-SSRS)',  section: 'Risk & Outcomes' },
  { screen: 'PopulationAnalytics',   label: 'Population Analytics',        section: 'Risk & Outcomes' },
  { screen: 'FamilyEngagement',      label: 'Family Engagement',           section: 'Care Coordination' },
  { screen: 'AftercarePlanning',     label: 'Aftercare Planning',          section: 'Care Coordination' },
  { screen: 'PeerSupport',           label: 'Peer Support Program',        section: 'Care Coordination' },
  { screen: 'TelehealthConsults',    label: 'Telehealth Consults',         section: 'Care Coordination' },
  { screen: 'AlumniProgram',         label: 'Alumni Program',              section: 'Care Coordination' },
  { screen: 'ClinicalSupervision',   label: 'Clinical Supervision',        section: 'Supervision' },
  { screen: 'CertificationTracker',  label: 'Certification Tracker',       section: 'Supervision' },
  { screen: 'SecureMessaging',       label: 'Secure Messaging',            section: 'Communications' },
  { screen: 'ReferralTracker',       label: 'Referral Tracker',            section: 'Operations' },
  { screen: 'WaitlistManager',       label: 'Waitlist Manager',            section: 'Operations' },
  { screen: 'BusinessDevelopment',   label: 'Business Development',        section: 'Operations' },
  { screen: 'InsuranceAuthorization', label: 'Insurance Auth / UR',        section: 'Operations' },
  { screen: 'RevenueCycle',          label: 'Revenue Cycle',               section: 'Billing & Compliance' },
  { screen: 'FinancialCounseling',   label: 'Financial Counseling',        section: 'Billing & Compliance' },
  { screen: 'AuditCompliance',       label: 'Audit Readiness',             section: 'Billing & Compliance' },
  { screen: 'QualityImprovement',    label: 'Quality Improvement',         section: 'Billing & Compliance' },
  { screen: 'Training',              label: 'Training',                    section: 'Billing & Compliance' },
  { screen: 'Settings',              label: 'Settings',                    section: 'System' },
  { screen: 'HelpSupport',           label: 'Help & Support',              section: 'System' },
  { screen: 'RoleExplorer',          label: 'Role Explorer',               section: 'System' },
];

const PERM_CELL: Record<Permission, React.ReactNode> = {
  full:  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded"><Shield className="w-2.5 h-2.5" />Full</span>,
  read:  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded"><Eye className="w-2.5 h-2.5" />Read</span>,
  none:  <span className="inline-flex items-center justify-center text-gray-300"><Minus className="w-3 h-3" /></span>,
};

export function RoleExplorer({ navigate: _navigate }: Props) {
  const { roleId, setRoleId } = useRole();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<RoleCategory | 'All'>('All');
  const [filterSection, setFilterSection] = useState<string>('All');

  const sections = Array.from(new Set(ALL_SCREENS.map(s => s.section)));

  const visibleRoles = ROLES.filter(r => filterCat === 'All' || r.category === filterCat);
  const visibleScreens = ALL_SCREENS.filter(s =>
    (filterSection === 'All' || s.section === filterSection) &&
    (search === '' || s.label.toLowerCase().includes(search.toLowerCase()) || s.section.toLowerCase().includes(search.toLowerCase()))
  );

  const fullCount  = (roleId: string) => ALL_SCREENS.filter(s => (ROLES.find(r => r.id === roleId)?.permissions[s.screen] ?? 'none') === 'full').length;
  const readCount  = (roleId: string) => ALL_SCREENS.filter(s => (ROLES.find(r => r.id === roleId)?.permissions[s.screen] ?? 'none') === 'read').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Role Explorer</h1>
          <p className="text-slate text-sm mt-0.5">Complete permission matrix — {ROLES.length} roles × {ALL_SCREENS.length} screens</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-600" />Full access</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-600" />Read only</span>
          <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-gray-400" />No access</span>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setRoleId(r.id)}
            className={`text-left p-3 rounded-xl border transition-all ${roleId === r.id ? `${r.color} ${r.borderColor}` : 'border-border hover:border-orange/40 bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />
              <span className={`text-xs font-bold ${roleId === r.id ? r.textColor : 'text-navy'}`}>{r.shortLabel}</span>
            </div>
            <div className="text-[10px] text-slate flex gap-2">
              <span className="text-green-600 font-semibold">{fullCount(r.id)} full</span>
              <span className="text-blue-600 font-semibold">{readCount(r.id)} read</span>
              <span className="text-gray-400">{ALL_SCREENS.length - fullCount(r.id) - readCount(r.id)} none</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
          <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg"
            placeholder="Filter screens..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-border rounded-lg px-2 py-1.5 text-xs" value={filterCat} onChange={e => setFilterCat(e.target.value as RoleCategory | 'All')}>
          <option value="All">All Role Categories</option>
          {ROLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border border-border rounded-lg px-2 py-1.5 text-xs" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="All">All Screen Sections</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate ml-auto">{visibleScreens.length} screens · {visibleRoles.length} roles shown</span>
      </div>

      {/* Matrix table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy text-white">
                <th className="sticky left-0 bg-navy z-10 px-3 py-2.5 font-semibold text-xs w-52 min-w-52 border-r border-white/10">
                  Screen
                </th>
                <th className="px-2 py-2.5 font-semibold text-[10px] text-slate-300 w-24 min-w-16">Section</th>
                {visibleRoles.map(r => (
                  <th key={r.id} className={`px-2 py-2.5 font-semibold text-center min-w-24 cursor-pointer transition-colors ${roleId === r.id ? r.color : 'hover:bg-white/5'}`}
                      onClick={() => setRoleId(r.id)}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />
                      <span className={`${roleId === r.id ? r.textColor : 'text-white'} text-[10px] leading-tight text-center`}>{r.shortLabel}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let lastSection = '';
                return visibleScreens.map((s, i) => {
                  const sectionHeader = s.section !== lastSection;
                  lastSection = s.section;
                  return (
                    <React.Fragment key={s.screen}>
                      {sectionHeader && (
                        <tr className="bg-navy/5">
                          <td colSpan={2 + visibleRoles.length} className="sticky left-0 px-3 py-1.5 text-[10px] font-bold text-slate uppercase tracking-wider bg-gray-50 border-y border-border">
                            {s.section}
                          </td>
                        </tr>
                      )}
                      <tr className={`border-b border-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-orange/5 transition-colors`}>
                        <td className="sticky left-0 bg-inherit z-10 px-3 py-2 font-semibold text-navy border-r border-border w-52 min-w-52">
                          {s.label}
                        </td>
                        <td className="px-2 py-2 text-[10px] text-slate">{s.section}</td>
                        {visibleRoles.map(r => {
                          const p: Permission = (r.permissions[s.screen] ?? 'none') as Permission;
                          return (
                            <td key={r.id} className={`px-2 py-2 text-center ${roleId === r.id ? r.color + '/30' : ''}`}>
                              {PERM_CELL[p]}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
